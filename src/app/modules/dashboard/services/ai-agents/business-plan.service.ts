import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { BusinessPlanModel } from '../../models/businessPlan.model';

@Injectable({
  providedIn: 'root',
})
export class BusinessPlanService {
  private apiUrl = `${environment.services.api.url}/project/businessPlans`;

  private http = inject(HttpClient);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Create a new project business plan item
   * @param projectId Project ID to create business plan for
   * @returns Observable with the created business plan
   */
  createBusinessplanItem(projectId: string): Observable<BusinessPlanModel> {
    return this.http.post<BusinessPlanModel>(
      `${this.apiUrl}/${projectId}`,
      {}
    ).pipe(
      tap((response) =>
        console.log('createBusinessplanItem response:', response)
      ),
      catchError((error) => {
        console.error('Error in createBusinessplanItem:', error);
        throw error;
      })
    );
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
