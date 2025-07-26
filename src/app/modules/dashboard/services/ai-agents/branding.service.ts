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

@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private apiUrl = `${environment.services.api.url}/project/brandings`;

  private http = inject(HttpClient);

  constructor() {}

  /**
   * Authentication headers are now handled by the centralized auth.interceptor
   * No need for manual token management in each service
   */

  // Create a new branding item
  createBrandIdentityModel(projectId: string): Observable<BrandIdentityModel> {
    return this.http
      .post<BrandIdentityModel>(`${this.apiUrl}/generate/${projectId}`, {})
      .pipe(
        tap((response) =>
          console.log('createBrandIdentityModel response:', response)
        ),
        catchError((error) => {
          console.error('Error in createBrandIdentityModel:', error);
          throw error;
        })
      );
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
