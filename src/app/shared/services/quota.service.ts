import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { QuotaInfoResponse, QuotaStatus } from '../models/quota.model';

@Injectable({
  providedIn: 'root',
})
export class QuotaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl =
    environment.services?.api?.url || 'http://localhost:3000/api';

  public getQuotaInfo(): Observable<QuotaInfoResponse> {
    return this.http.get<QuotaInfoResponse>(`${this.apiUrl}/quota/info`).pipe(
      tap((info) => {}),
      catchError((error) => {
        return EMPTY;
      })
    );
  }

  /**
   * Détermine le statut du quota basé sur le pourcentage d'utilisation
   */
  private getQuotaStatus(percentage: number): QuotaStatus {
    if (percentage >= 100) return QuotaStatus.EXCEEDED;
    if (percentage >= 80) return QuotaStatus.WARNING;
    return QuotaStatus.AVAILABLE;
  }
}
