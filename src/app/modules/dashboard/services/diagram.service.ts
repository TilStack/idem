import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Define a basic interface for Diagram items
export interface DiagramItem {
  id?: string;
  name: string;
  type: string;
  data: any;
  summary: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiagramService {
  private apiUrl = `${environment.services.api.url}/project/diagrams`;

  private http = inject(HttpClient);

  constructor() {}
  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  /**
   * Create a new diagram item
   * @param item The diagram item to create
   * @returns Observable of the created diagram item
   */
  createDiagram(item: DiagramItem): Observable<DiagramItem> {
    return this.http.post<DiagramItem>(this.apiUrl, item).pipe(
      tap((response) => console.log('createDiagram response:', response)),
      catchError((error) => {
        console.error('Error in createDiagram:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all diagram items (optionally by projectId)
   * @param projectId Optional project ID to filter diagrams
   * @returns Observable of diagram items array
   */
  getDiagrams(projectId?: string): Observable<DiagramItem[]> {
    let url = this.apiUrl;
    if (projectId) {
      url += `?projectId=${projectId}`;
    }

    return this.http.get<DiagramItem[]>(url).pipe(
      tap((response) => console.log('getDiagrams response:', response)),
      catchError((error) => {
        console.error('Error in getDiagrams:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific diagram item by ID
   * @param id ID of the diagram to retrieve
   * @returns Observable of the requested diagram item
   */
  getDiagramById(id: string): Observable<DiagramItem> {
    return this.http.get<DiagramItem>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => console.log('getDiagramById response:', response)),
      catchError((error) => {
        console.error(`Error in getDiagramById for ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a specific diagram item
   * @param id ID of the diagram to update
   * @param item Partial diagram data to update
   * @returns Observable of the updated diagram item
   */
  updateDiagram(
    id: string,
    item: Partial<DiagramItem>
  ): Observable<DiagramItem> {
    return this.http.put<DiagramItem>(`${this.apiUrl}/${id}`, item).pipe(
      tap((response) => console.log('updateDiagram response:', response)),
      catchError((error) => {
        console.error(`Error in updateDiagram for ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a specific diagram item
   * @param id ID of the diagram to delete
   * @returns Observable of void
   */
  deleteDiagram(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log(`deleteDiagram response for ID ${id}:`, response)
      ),
      catchError((error) => {
        console.error(`Error in deleteDiagram for ID ${id}:`, error);
        return throwError(() => error);
      })
    );
  }
}
