import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SseClient } from 'ngx-sse-client';
import { environment } from '../../../../../environments/environment';
import { BusinessPlanModel } from '../../models/businessPlan.model';
import { BusinessPlanStepEvent } from '../../models/business-plan-step.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessPlanService {
  private readonly apiUrl = `${environment.services.api.url}/project/businessPlans`;
  private readonly http = inject(HttpClient);
  private readonly sseClient = inject(SseClient);

  // SSE connection management
  private sseSubscription: any = null;

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Close SSE connection
   */
  private closeSSEConnection(): void {
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
      this.sseSubscription = null;
      console.log('Business Plan SSE connection closed');
    }
  }

  /**
   * Create a new project business plan item using Server-Sent Events for real-time updates
   * @param projectId Project ID to create business plan for
   * @returns Observable with SSE events
   */
  createBusinessplanItem(projectId: string): Observable<BusinessPlanStepEvent> {
    console.log('Starting business plan generation with SSE...');
    
    // Close any existing SSE connection
    this.closeSSEConnection();

    return this.createSSEConnection(projectId);
  }

  /**
   * Create SSE connection for real-time updates using ngx-sse-client
   * @param projectId Project ID
   * @returns Observable with SSE events
   */
  private createSSEConnection(projectId: string): Observable<BusinessPlanStepEvent> {
    const url = `${this.apiUrl}/generate/${projectId}`;
    console.log('Attempting business plan SSE connection to:', url);
    
    return new Observable<BusinessPlanStepEvent>((observer) => {
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
              console.log('Received empty or invalid business plan SSE message, ignoring:', messageEvent.data);
              observer.complete();
              this.closeSSEConnection();
              return; // Ignore empty or invalid messages
            }
            
            // Additional check for common SSE termination messages
            if (messageEvent.data['type'] === 'complete') {
              console.log('Business Plan SSE stream completed');
              observer.complete();
              this.closeSSEConnection();
              return;
            }
            
            const data: BusinessPlanStepEvent = JSON.parse(messageEvent.data);
            console.log('Business Plan SSE message received:', data);
            
            // Validate the parsed data structure
            if (!data || typeof data !== 'object') {
              console.log('Invalid business plan SSE data structure, ignoring:', data);
              observer.complete();
              this.closeSSEConnection();
              return;
            }
            
            // Emit the event to the component
            observer.next(data);
            
          } catch (error) {
            console.error('Error parsing business plan SSE message:', error, 'Raw data:', (event as MessageEvent).data);
            // Don't propagate parsing errors - just log them and continue
          }
        },
        error: (error: any) => {
          console.error('Business Plan SSE connection error:', error);
          observer.error(new Error('Business Plan SSE endpoint not available'));
          this.closeSSEConnection();
        },
        complete: () => {
          console.log('Business Plan SSE connection completed');
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

  // Get all project businessplan items (optionally by projectId)
  getBusinessplanItems(projectId?: string): Observable<BusinessPlanModel> {
    return this.http.get<BusinessPlanModel>(`${this.apiUrl}/${projectId}`)
      .pipe(
      tap((response) =>
        console.log('getBusinessplanItems response:', response)
      ),
      catchError((error) => {
        console.error('Error in getBusinessplanItems:', error);
        throw error;
      })
    );
  }

  // Get a specific project businessplan item by ID
  getBusinessplanItemById(id: string): Observable<BusinessPlanModel> {
    return this.http.get<BusinessPlanModel>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log('getBusinessplanItemById response:', response)
      ),
      catchError((error) => {
        console.error(`Error in getBusinessplanItemById for ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Get a specific business plan item
  getBusinessplanItem(
    projectId: string,
    businessplanId: string
  ): Observable<BusinessPlanModel> {
    return this.http.get<BusinessPlanModel>(
      `${this.apiUrl}/${projectId}/${businessplanId}`
    ).pipe(
      tap((response) =>
        console.log('getBusinessplanItem response:', response)
      ),
      catchError((error) => {
        console.error(`Error in getBusinessplanItem for ID ${businessplanId}:`, error);
        throw error;
      })
    );
  }

  // Update a specific project businessplan item
  updateBusinessplanItem(
    id: string,
    item: Partial<BusinessPlanModel>
  ): Observable<BusinessPlanModel> {
    return this.http.put<BusinessPlanModel>(`${this.apiUrl}/${id}`, item).pipe(
      tap((response) =>
        console.log('updateBusinessplanItem response:', response)
      ),
      catchError((error) => {
        console.error(`Error in updateBusinessplanItem for ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Delete a specific project businessplan item
  deleteBusinessplanItem(
    projectId: string,
    businessplanId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${projectId}/${businessplanId}`
    ).pipe(
      tap((response) =>
        console.log(`deleteBusinessplanItem response for ID ${businessplanId}:`, response)
      ),
      catchError((error) => {
        console.error(`Error in deleteBusinessplanItem for ID ${businessplanId}:`, error);
        throw error;
      })
    );
  }
}
