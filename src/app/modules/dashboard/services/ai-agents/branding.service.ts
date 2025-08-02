import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  BrandIdentityModel,
  ColorModel,
  TypographyModel,
} from '../../models/brand-identity.model';
import { ProjectModel } from '../../models/project.model';
import { LogoModel } from '../../models/logo.model';
import { BrandingStepEvent } from '../../models/branding-step.model';
import { SSEService } from '../../../../shared/services/sse.service';
import { SSEStepEvent, SSEConnectionConfig } from '../../../../shared/models/sse-step.model';

@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private readonly apiUrl = `${environment.services.api.url}/project/brandings`;
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
    this.sseService.closeConnection('branding');
  }

  /**
   * Create a new branding item using Server-Sent Events for real-time updates
   * @param projectId Project ID
   * @returns Observable with SSE events
   */
  createBrandIdentityModel(projectId: string): Observable<BrandingStepEvent> {
    console.log('Starting branding generation with SSE...');

    // Close any existing SSE connection
    this.closeSSEConnection();

    const config: SSEConnectionConfig = {
      url: `${this.apiUrl}/generate/${projectId}`,
      keepAlive: true,
      reconnectionDelay: 1000
    };

    return this.sseService.createConnection(config, 'branding').pipe(
      map((sseEvent: SSEStepEvent) => this.mapToBrandingStepEvent(sseEvent))
    );
  }

  /**
   * Map generic SSE event to BrandingStepEvent
   * @param sseEvent Generic SSE event
   * @returns BrandingStepEvent
   */
  private mapToBrandingStepEvent(sseEvent: SSEStepEvent): BrandingStepEvent {
    return {
      type: sseEvent.type as 'started' | 'completed',
      stepName: sseEvent.stepName || '',
      data: sseEvent.data,
      summary: sseEvent.summary || '',
      timestamp: sseEvent.timestamp,
      parsedData: sseEvent.parsedData || {
        status: sseEvent.type,
        stepName: sseEvent.stepName || ''
      }
    };
  }

  /**
   * Cancel ongoing SSE connection
   */
  cancelGeneration(): void {
    this.sseService.cancelGeneration('branding');
  }

  /**
   * Cancel ongoing SSE connection (legacy method)
   */
  private legacyCancelGeneration(): void {
    this.closeSSEConnection();
  }

  // Generate Logo Colors and Typography for a project
  generateLogoColorsAndTypography(project: ProjectModel): Observable<{
    logos: LogoModel[];
    colors: ColorModel[];
    typography: TypographyModel[];
  }> {
    console.log('Generating logo colors and typography...');
    console.log('Project:', project);
    return this.http
      .post<{
        logos: LogoModel[];
        colors: ColorModel[];
        typography: TypographyModel[];
      }>(`${this.apiUrl}/genColorsAndTypography`, { project })
      .pipe(
        tap((response) =>
          console.log('generateLogoColorsAndTypography response:', response)
        ),
        catchError((error) => {
          console.error('Error in generateLogoColorsAndTypography:', error);
          throw error;
        })
      );
  }

  // Get all branding items for a project (assuming API needs projectId for filtering)
  // If API doesn't filter by projectId here, this might need adjustment or projectId removed.
  getBrandIdentityModels(projectId: string): Observable<BrandIdentityModel[]> {
    // Assuming the API endpoint for all items is just this.apiUrl
    // and filtering by projectId is either done by the backend via token or needs a query param.
    // For now, let's assume the GET to this.apiUrl returns all accessible items.
    // If it needs a projectId in the path or query, this URL formation needs to change.
    return this.http
      .get<BrandIdentityModel[]>(`${this.apiUrl}?projectId=${projectId}`)
      .pipe(
        tap((response) =>
          console.log('getBrandIdentityModels response:', response)
        ),
        catchError((error) => {
          console.error('Error in getBrandIdentityModels:', error);
          throw error;
        })
      );
  }

  // Get a specific branding item by ID
  getBrandIdentity(
    projectId: string,
    brandingId: string
  ): Observable<BrandIdentityModel> {
    return this.http
      .get<BrandIdentityModel>(`${this.apiUrl}/${projectId}/${brandingId}`)
      .pipe(
        tap((response) =>
          console.log('getBrandIdentityModelById response:', response)
        ),
        catchError((error) => {
          console.error(
            `Error in getBrandIdentityModelById for ID ${projectId}:`,
            error
          );
          throw error;
        })
      );
  }
  // Get a specific branding item by ID
  getBrandIdentityModelById(projectId: string): Observable<BrandIdentityModel> {
    return this.http.get<BrandIdentityModel>(
      `${this.apiUrl}/getAll/${projectId}`
    );
  }

  // Update a specific branding item
  updateBrandIdentity(
    projectId: string,
    brandingId: string,
    brandData: Partial<BrandIdentityModel>
  ): Observable<BrandIdentityModel> {
    return this.http
      .put<BrandIdentityModel>(
        `${this.apiUrl}/${projectId}/update/${brandingId}`,
        brandData
      )
      .pipe(
        tap((response) =>
          console.log('updateBrandIdentityModel response:', response)
        ),
        catchError((error) => {
          console.error(
            `Error in updateBrandIdentityModel for ID ${brandingId}:`,
            error
          );
          throw error;
        })
      );
  }

  // Delete a specific branding item
  deleteBrandIdentityModel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap((response) =>
        console.log('deleteBrandIdentityModel response for ID ${id}:', response)
      ),
      catchError((error) => {
        console.error(`Error in deleteBrandIdentityModel for ID ${id}:`, error);
        throw error;
      })
    );
  }
}
