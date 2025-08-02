import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { BusinessPlanModel } from '../../models/businessPlan.model';
import { BusinessPlanStepEvent } from '../../models/business-plan-step.model';
import { SSEService } from '../../../../shared/services/sse.service';
import { SSEStepEvent, SSEConnectionConfig } from '../../../../shared/models/sse-step.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessPlanService {
  private readonly apiUrl = `${environment.services.api.url}/project/businessPlans`;
  private readonly http = inject(HttpClient);
  private readonly sseService = inject(SSEService);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Close SSE connection
   */
  closeSSEConnection(): void {
    this.sseService.closeConnection('business-plan');
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

    const config: SSEConnectionConfig = {
      url: `${this.apiUrl}/generate/${projectId}`,
      keepAlive: true,
      reconnectionDelay: 1000
    };

    return this.sseService.createConnection(config, 'business-plan').pipe(
      map((sseEvent: SSEStepEvent) => this.mapToBusinessPlanStepEvent(sseEvent))
    );
  }

  /**
   * Map generic SSE event to BusinessPlanStepEvent
   * @param sseEvent Generic SSE event
   * @returns BusinessPlanStepEvent
   */
  private mapToBusinessPlanStepEvent(sseEvent: SSEStepEvent): BusinessPlanStepEvent {
    return {
      type: sseEvent.type as 'started' | 'completed',
      stepName: sseEvent.stepName || '',
      data: sseEvent.data || '',
      summary: sseEvent.summary || '',
      timestamp: sseEvent.timestamp || new Date().toISOString(),
      parsedData: {
        status: sseEvent.parsedData?.status || sseEvent.type,
        stepName: sseEvent.parsedData?.stepName || sseEvent.stepName || ''
      }
    };
  }

  /**
   * Cancel ongoing SSE connection
   */
  cancelGeneration(): void {
    this.sseService.cancelGeneration('business-plan');
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
