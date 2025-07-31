import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { DiagramModel } from '../../models/diagram.model';

@Injectable({
  providedIn: 'root',
})
export class DiagramsService {
  private apiUrl = `${environment.services.api.url}/project/diagrams`;

  private http = inject(HttpClient);

  // Reactive state management with signals
  public readonly diagramState = signal<DiagramModel | null>(null);
  public readonly isGenerating = signal<boolean>(false);
  public readonly generationProgress = signal<number>(0);
  public readonly generationStatus = signal<string>('');
  public readonly generationError = signal<string | null>(null);

  // SSE connection management
  private eventSource: EventSource | null = null;
  private generationSubject = new BehaviorSubject<DiagramModel | null>(null);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Create a new diagram using Server-Sent Events for real-time updates
   * Falls back to regular HTTP POST if SSE is not available
   * @param projectId Project ID
   * @returns Observable with the created diagram model
   */
  createDiagramModel(projectId: string): Observable<DiagramModel> {
    // Reset state
    this.isGenerating.set(true);
    this.generationProgress.set(0);
    this.generationStatus.set('Initializing diagram generation...');
    this.generationError.set(null);
    this.diagramState.set(null);

    // Close any existing SSE connection
    this.closeEventSource();

    // Try SSE first, fallback to HTTP POST if it fails
    return this.trySSEConnection(projectId).pipe(
      catchError((sseError) => {
        console.warn('SSE connection failed, falling back to HTTP POST:', sseError);
        this.generationStatus.set('Falling back to standard generation...');
        return this.fallbackToHttpPost(projectId);
      })
    );
  }

  /**
   * Attempt to create SSE connection for real-time updates
   * @param projectId Project ID
   * @returns Observable with the created diagram model
   */
  private trySSEConnection(projectId: string): Observable<DiagramModel> {
    return new Observable<DiagramModel>((observer) => {
      try {
        // Create SSE connection with authentication
        const url = `${this.apiUrl}/generate-stream/${projectId}`;
        console.log('Attempting SSE connection to:', url);
        
        // Note: EventSource doesn't support custom headers, so we need to handle auth differently
        // The backend should handle authentication via cookies or query parameters
        this.eventSource = new EventSource(url, {
          withCredentials: true // Include cookies for authentication
        });

        // Set a timeout for connection establishment
        const connectionTimeout = setTimeout(() => {
          console.error('SSE connection timeout');
          this.closeEventSource();
          observer.error(new Error('SSE connection timeout'));
        }, 10000); // 10 second timeout

        this.eventSource.onopen = () => {
          console.log('SSE connection opened for diagram generation');
          clearTimeout(connectionTimeout);
          this.generationStatus.set('Connected to generation stream...');
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('SSE message received:', data);

            // Handle different types of SSE messages
            switch (data.type) {
              case 'progress':
                this.generationProgress.set(data.progress || 0);
                this.generationStatus.set(data.message || 'Generating...');
                break;
              
              case 'section':
                // Update diagram state with new section
                const currentDiagram = this.diagramState();
                if (currentDiagram) {
                  const updatedDiagram = {
                    ...currentDiagram,
                    sections: [...currentDiagram.sections, data.section]
                  };
                  this.diagramState.set(updatedDiagram);
                } else {
                  const newDiagram: DiagramModel = {
                    id: data.diagramId,
                    sections: [data.section],
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  this.diagramState.set(newDiagram);
                }
                break;
              
              case 'complete':
                const finalDiagram = data.diagram as DiagramModel;
                this.diagramState.set(finalDiagram);
                this.isGenerating.set(false);
                this.generationProgress.set(100);
                this.generationStatus.set('Diagram generation completed!');
                this.generationSubject.next(finalDiagram);
                clearTimeout(connectionTimeout);
                observer.next(finalDiagram);
                observer.complete();
                this.closeEventSource();
                break;
              
              case 'error':
                const errorMessage = data.message || 'Unknown error occurred';
                this.generationError.set(errorMessage);
                this.isGenerating.set(false);
                this.generationStatus.set('Generation failed');
                clearTimeout(connectionTimeout);
                observer.error(new Error(errorMessage));
                this.closeEventSource();
                break;
            }
          } catch (parseError) {
            console.error('Error parsing SSE data:', parseError);
            this.generationError.set('Error parsing server response');
            clearTimeout(connectionTimeout);
            observer.error(parseError);
          }
        };

        this.eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          clearTimeout(connectionTimeout);
          
          // Check if this is a connection failure (404, 401, etc.)
          if (this.eventSource?.readyState === EventSource.CLOSED) {
            observer.error(new Error('SSE endpoint not available'));
          } else {
            this.generationError.set('Connection error occurred');
            this.isGenerating.set(false);
            this.generationStatus.set('Connection failed');
            observer.error(new Error('SSE connection failed'));
          }
          this.closeEventSource();
        };

      } catch (error) {
        console.error('Error setting up SSE connection:', error);
        this.generationError.set('Failed to establish connection');
        this.isGenerating.set(false);
        observer.error(error);
      }
    });
  }

  /**
   * Fallback to regular HTTP POST when SSE is not available
   * @param projectId Project ID
   * @returns Observable with the created diagram model
   */
  private fallbackToHttpPost(projectId: string): Observable<DiagramModel> {
    console.log('Using HTTP POST fallback for diagram generation');
    this.generationStatus.set('Generating diagrams (standard mode)...');
    this.generationProgress.set(50); // Show some progress
    
    return this.http.post<DiagramModel>(
      `${this.apiUrl}/generate/${projectId}`, // Use non-streaming endpoint
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      tap((response) => {
        console.log('HTTP POST diagram generation response:', response);
        this.diagramState.set(response);
        this.isGenerating.set(false);
        this.generationProgress.set(100);
        this.generationStatus.set('Diagram generation completed!');
        this.generationSubject.next(response);
      }),
      catchError((error) => {
        console.error('HTTP POST fallback failed:', error);
        this.isGenerating.set(false);
        this.generationError.set(error.message || 'Generation failed');
        this.generationStatus.set('Generation failed');
        throw error;
      })
    );
  }

  /**
   * Get all diagrams for a project
   * @param projectId Project ID
   * @returns Observable with array of diagram models
   */
  getDiagramModels(projectId: string): Observable<DiagramModel[]> {
    return this.http.get<DiagramModel[]>(
      `${this.apiUrl}?projectId=${projectId}`
    ).pipe(
      tap((response) => console.log('getDiagramModels response:', response)),
      catchError((error) => {
        console.error('Error in getDiagramModels:', error);
        throw error;
      })
    );
  }

  /**
   * Get a specific diagram by project ID
   * @param projectId Project ID
   * @returns Observable with the requested diagram model
   */
  getDiagramModelById(projectId: string): Observable<DiagramModel> {
    return this.http.get<DiagramModel>(
      `${this.apiUrl}/getAll/${projectId}`
    ).pipe(
      tap((response) => console.log('getDiagramModelById response:', response)),
      catchError((error) => {
        console.error(
          `Error in getDiagramModelById for ID ${projectId}:`,
          error
        );
        throw error;
      })
    );
  }

  /**
   * Update a specific diagram
   * @param id Diagram ID to update
   * @param item Updated diagram data
   * @returns Observable with the updated diagram model
   */
  updateDiagramModel(
    id: string,
    item: Partial<DiagramModel>
  ): Observable<DiagramModel> {
    return this.http.put<DiagramModel>(`${this.apiUrl}/${id}`, item).pipe(
      tap((response) => console.log('updateDiagramModel response:', response)),
      catchError((error) => {
        console.error(`Error in updateDiagramModel for ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Delete a specific diagram
   * @param id Diagram ID to delete
   * @returns Observable for the deletion operation
   */
  deleteDiagramModel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log(`deleteDiagramModel response for ID ${id}:`, response)
      ),
      catchError((error) => {
        console.error(`Error in deleteDiagramModel for ID ${id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get the current diagram state as an observable
   * @returns Observable of the current diagram state
   */
  getDiagramState(): Observable<DiagramModel | null> {
    return this.generationSubject.asObservable();
  }

  /**
   * Reset all generation state
   */
  resetGenerationState(): void {
    this.isGenerating.set(false);
    this.generationProgress.set(0);
    this.generationStatus.set('');
    this.generationError.set(null);
    this.diagramState.set(null);
    this.closeEventSource();
  }

  /**
   * Close the current SSE connection
   */
  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('SSE connection closed');
    }
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.closeEventSource();
  }
}
