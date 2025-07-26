import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { DiagramModel } from '../../models/diagram.model';

@Injectable({
  providedIn: 'root',
})
export class DiagramsService {
  private apiUrl = `${environment.services.api.url}/project/diagrams`;

  private http = inject(HttpClient);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Create a new diagram
   * @param projectId Project ID
   * @returns Observable with the created diagram model
   */
  createDiagramModel(projectId: string): Observable<DiagramModel> {
    return this.http.post<DiagramModel>(
      `${this.apiUrl}/generate/${projectId}`,
      {}
    ).pipe(
      tap((response) => console.log('createDiagramModel response:', response)),
      catchError((error) => {
        console.error('Error in createDiagramModel:', error);
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
}
