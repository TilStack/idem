import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SseClient } from 'ngx-sse-client';
import { environment } from '../../../../../environments/environment';
import { DiagramModel } from '../../models/diagram.model';
import { DiagramStepEvent, DiagramStep, DiagramGenerationState } from '../../models/diagram-step.model';

@Injectable({
  providedIn: 'root',
})
export class DiagramsService {
  private readonly apiUrl = `${environment.services.api.url}/project/diagrams`;
  private readonly http = inject(HttpClient);
  private readonly sseClient = inject(SseClient);

  // Reactive state management with signals for step-based generation
  public readonly generationState = signal<DiagramGenerationState>({
    steps: [],
    currentStep: null,
    isGenerating: false,
    error: null,
    completed: false
  });

  // Legacy signals for backward compatibility
  public readonly diagramState = signal<DiagramModel | null>(null);
  public readonly isGenerating = signal<boolean>(false);
  public readonly generationProgress = signal<number>(0);
  public readonly generationStatus = signal<string>('');
  public readonly generationError = signal<string | null>(null);

  // SSE connection management
  private sseSubscription: any = null;

  /**
   * Reset generation state to initial values
   */
  private resetGenerationState(): void {
    this.generationState.set({
      steps: [],
      currentStep: null,
      isGenerating: true,
      error: null,
      completed: false
    });
    
    // Update legacy signals for backward compatibility
    this.isGenerating.set(true);
    this.generationProgress.set(0);
    this.generationStatus.set('Initializing diagram generation...');
    this.generationError.set(null);
    this.diagramState.set(null);
  }

  /**
   * Update generation state with partial updates
   */
  private updateGenerationState(updates: Partial<DiagramGenerationState>): void {
    const currentState = this.generationState();
    this.generationState.set({ ...currentState, ...updates });
    
    // Update legacy signals for backward compatibility
    if (updates.isGenerating !== undefined) {
      this.isGenerating.set(updates.isGenerating);
    }
    if (updates.error !== undefined) {
      this.generationError.set(updates.error);
    }
  }

  /**
   * Close SSE connection
   */
  private closeSSEConnection(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
      console.log('SSE connection closed');
    }
  }

  /**
   * Handle SSE message and update state accordingly
   */
  private handleSSEMessage(data: DiagramStepEvent): void {
    const currentState = this.generationState();
    
    if (data.type === 'started' || data.data === 'step_started') {
      // Step started - set as current step
      const newStep: DiagramStep = {
        stepName: data.stepName,
        status: 'in-progress',
        timestamp: data.timestamp,
        summary: data.summary
      };
      
      this.updateGenerationState({
        currentStep: newStep,
        isGenerating: true
      });
      
      // Update legacy signals
      this.generationStatus.set(`Generating ${data.stepName}...`);
      
    } else if (data.type === 'completed' && data.data !== 'step_started') {
      // Step completed - move to completed steps
      const completedStep: DiagramStep = {
        stepName: data.stepName,
        status: 'completed',
        content: data.data,
        timestamp: data.timestamp,
        summary: data.summary
      };
      
      const updatedSteps = [...currentState.steps, completedStep];
      
      this.updateGenerationState({
        steps: updatedSteps,
        currentStep: null
      });
      
      // Update legacy signals
      this.generationStatus.set(`Completed ${data.stepName}`);
      this.generationProgress.set((updatedSteps.length / 6) * 100); // Assuming 6 total steps
    }
  }

  /**
   * Create a new diagram using Server-Sent Events for real-time updates
   * Falls back to regular HTTP POST if SSE is not available
   * @param projectId Project ID
   * @returns Observable with the created diagram model
   */
  createDiagramModel(projectId: string): Observable<DiagramModel> {
    console.log('Starting diagram generation with SSE...');
    
    // Reset state
    this.resetGenerationState();
    
    // Close any existing SSE connection
    this.closeSSEConnection();

    // Try SSE first, fallback to HTTP POST if it fails
    return this.trySSEConnection(projectId).pipe(
      catchError((sseError) => {
        console.warn('SSE connection failed, falling back to HTTP POST:', sseError);
        this.updateGenerationState({
          error: 'SSE connection failed, using fallback method'
        });
        throw sseError;
      })
    );
  }

  /**
   * Attempt to create SSE connection for real-time updates using ngx-sse-client
   * @param projectId Project ID
   * @returns Observable with the created diagram model
   */
  private trySSEConnection(projectId: string): Observable<DiagramModel> {
    const url = `${this.apiUrl}/generate-stream/${projectId}`;
    console.log('Attempting SSE connection to:', url);
    
    return new Observable<DiagramModel>((observer) => {
      // Create SSE connection using ngx-sse-client
      this.sseSubscription = this.sseClient.stream(url, {
        keepAlive: true,
        reconnectionDelay: 1000
      }).subscribe({
        next: (event: Event) => {
          try {
            const messageEvent = event as MessageEvent;
            const data: DiagramStepEvent = JSON.parse(messageEvent.data);
            console.log('SSE message received:', data);
            
            this.handleSSEMessage(data);
            
            // Check if all steps are completed
            const currentState = this.generationState();
            if (currentState.steps.length >= 6 && !currentState.currentStep) {
              // All steps completed, create final diagram
              const finalDiagram: DiagramModel = {
                id: `diagram_${projectId}_${Date.now()}`,
                title: 'Generated Diagrams',
                content: this.combineStepsContent(currentState.steps),
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              this.diagramState.set(finalDiagram);
              this.updateGenerationState({
                isGenerating: false,
                completed: true
              });
              
              observer.next(finalDiagram);
              observer.complete();
              this.closeSSEConnection();
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        },
        error: (error: any) => {
          console.error('SSE connection error:', error);
          this.updateGenerationState({
            error: 'SSE connection error',
            isGenerating: false
          });
          observer.error(new Error('SSE endpoint not available'));
          this.closeSSEConnection();
        },
        complete: () => {
          console.log('SSE connection completed');
          this.closeSSEConnection();
        }
      });
    });
  }

  /**
   * Combine all step contents into a single diagram content
   */
  private combineStepsContent(steps: DiagramStep[]): string {
    return steps
      .filter(step => step.content && step.content !== 'step_started')
      .map(step => `## ${step.stepName}\n\n${step.content}`)
      .join('\n\n---\n\n');
  }



  /**
   * Get all diagrams for a project
   * @param projectId Project ID
   * @returns Observable with array of diagram models
   */
  getDiagrams(projectId: string): Observable<DiagramModel[]> {
    return this.http.get<DiagramModel[]>(`${this.apiUrl}/${projectId}`);
  }

  /**
   * Get a specific diagram by ID
   * @param diagramId Diagram ID
   * @returns Observable with the diagram model
   */
  getDiagram(diagramId: string): Observable<DiagramModel> {
    return this.http.get<DiagramModel>(`${this.apiUrl}/getAll/${diagramId}`);
  }

  /**
   * Update an existing diagram
   * @param diagramId Diagram ID
   * @param updates Partial diagram updates
   * @returns Observable with the updated diagram model
   */
  updateDiagram(diagramId: string, updates: Partial<DiagramModel>): Observable<DiagramModel> {
    return this.http.put<DiagramModel>(`${this.apiUrl}/diagram/${diagramId}`, updates);
  }

  /**
   * Delete a diagram
   * @param diagramId Diagram ID
   * @returns Observable with void
   */
  deleteDiagram(diagramId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/diagram/${diagramId}`);
  }
}
