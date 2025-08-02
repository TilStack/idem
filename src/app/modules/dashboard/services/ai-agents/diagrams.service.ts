import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SseClient } from 'ngx-sse-client';
import { environment } from '../../../../../environments/environment';
import { DiagramModel } from '../../models/diagram.model';
import { DiagramStepEvent } from '../../models/diagram-step.model';

@Injectable({
  providedIn: 'root',
})
export class DiagramsService {
  private readonly apiUrl = `${environment.services.api.url}/project/diagrams`;
  private readonly http = inject(HttpClient);
  private readonly sseClient = inject(SseClient);

  // SSE connection management
  private sseSubscription: any = null;



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
   * Create a new diagram using Server-Sent Events for real-time updates
   * @param projectId Project ID
   * @returns Observable with SSE events
   */
  createDiagramModel(projectId: string): Observable<DiagramStepEvent> {
    console.log('Starting diagram generation with SSE...');
    
    // Close any existing SSE connection
    this.closeSSEConnection();

    return this.createSSEConnection(projectId);
  }

  /**
   * Create SSE connection for real-time updates using ngx-sse-client
   * @param projectId Project ID
   * @returns Observable with SSE events
   */
  private createSSEConnection(projectId: string): Observable<DiagramStepEvent> {
    const url = `${this.apiUrl}/generate-stream/${projectId}`;
    console.log('Attempting SSE connection to:', url);
    
    return new Observable<DiagramStepEvent>((observer) => {
      // Create SSE connection using ngx-sse-client
      this.sseSubscription = this.sseClient.stream(url, {
        keepAlive: true,
        reconnectionDelay: 1000
      }).subscribe({
        next: (event: Event) => {
          try {
            const messageEvent = event as MessageEvent;
            
            // Validate message data before parsing
            if (!messageEvent.data || messageEvent.data === 'undefined' || messageEvent.data.trim() === '') {
              console.log('Received empty or invalid SSE message, ignoring:', messageEvent.data);
              observer.complete();
              this.closeSSEConnection();
              return; // Ignore empty or invalid messages
            }
            
            // Additional check for common SSE termination messages
            if (messageEvent.data['type'] === 'complete') {
              console.log('SSE stream completed');
              observer.complete();
              this.closeSSEConnection();
              return;
            }
            
            const data: DiagramStepEvent = JSON.parse(messageEvent.data);
            console.log('SSE message received:', data);
            
            // Validate the parsed data structure
            if (!data || typeof data !== 'object') {
              console.log('Invalid SSE data structure, ignoring:', data);
              observer.complete();
              this.closeSSEConnection();
              return;
            }
            
            // Emit the event to the component
            observer.next(data);
            
          } catch (error) {
            console.error('Error parsing SSE message:', error, 'Raw data:', (event as MessageEvent).data);
            // Don't propagate parsing errors - just log them and continue
            // observer.error(error); // Commented out to prevent infinite loops
          }
        },
        error: (error: any) => {
          console.error('SSE connection error:', error);
          observer.error(new Error('SSE endpoint not available'));
          this.closeSSEConnection();
        },
        complete: () => {
          console.log('SSE connection completed');
          observer.complete();
          this.closeSSEConnection();
        }
      });
    });
  }

  /**
   * Cancel ongoing SSE connection
   */
  cancelGeneration(): void {
    this.closeSSEConnection();
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
