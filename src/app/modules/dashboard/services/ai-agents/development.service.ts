import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { DevelopmentConfigsModel } from '../../models/development.model';
import { ProjectModel } from '../../models/project.model';

// Define a basic interface for Development items
export interface DevelopmentItem {
  id?: string;
  taskName: string;
  status?: string;
  // Add other properties as needed
}

@Injectable({
  providedIn: 'root',
})
export class DevelopmentService {
  private apiUrl = `${environment.services.api.url}/project/developments`;

  private http = inject(HttpClient);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  // Save development configurations
  saveDevelopmentConfigs(
    developmentConfigs: DevelopmentConfigsModel,
    projectId: string
  ): Observable<ProjectModel> {
    return this.http.post<ProjectModel>(`${this.apiUrl}/configs`, {
      developmentConfigs,
      projectId,
    });
  }

  // Create a new development item
  createDevelopmentItem(item: DevelopmentItem): Observable<DevelopmentItem> {
    return this.http.post<DevelopmentItem>(this.apiUrl, item).pipe(
      tap((response) =>
        console.log('createDevelopmentItem response:', response)
      ),
      catchError((error) => {
        console.error('Error in saveDevelopmentConfigs:', error);
        throw error;
      })
    );
  }

  // Get the development configurations for a specific project
  getDevelopmentConfigs(
    projectId: string
  ): Observable<DevelopmentConfigsModel | null> {
    return this.http
      .get<DevelopmentConfigsModel>(`${this.apiUrl}/configs/${projectId}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          console.error('Error in getDevelopmentConfigs:', error);
          throw error;
        })
      );
  }

  // Get all development items
  getAllDevelopmentItems(projectId: string): Observable<DevelopmentItem[]> {
    return this.http.get<DevelopmentItem[]>(`${this.apiUrl}/${projectId}`).pipe(
      tap((response) =>
        console.log('getAllDevelopmentItems response:', response)
      ),
      catchError((error) => {
        console.error(
          `Error in getAllDevelopmentItems for project ${projectId}:`,
          error
        );
        throw error;
      })
    );
  }

  // Get a specific development item by ID
  getDevelopmentItemById(id: string): Observable<DevelopmentItem> {
    return this.http.get<DevelopmentItem>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log('getDevelopmentItemById response:', response)
      ),
      catchError((error) => {
        console.error(`Error in getDevelopmentItemById for ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Update a specific development item
  updateDevelopmentItem(
    id: string,
    item: Partial<DevelopmentItem>
  ): Observable<DevelopmentItem> {
    return this.http.put<DevelopmentItem>(`${this.apiUrl}/${id}`, item).pipe(
      tap((response) =>
        console.log('updateDevelopmentItem response:', response)
      ),
      catchError((error) => {
        console.error(`Error in updateDevelopmentItem for ID ${id}:`, error);
        throw error;
      })
    );
  }

  // Delete a specific development item
  deleteDevelopmentItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log(`deleteDevelopmentItem response for ID ${id}:`, response)
      ),
      catchError((error) => {
        console.error(`Error in deleteDevelopmentItem for ID ${id}:`, error);
        throw error;
      })
    );
  }
}
