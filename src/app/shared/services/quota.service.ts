import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, EMPTY, filter } from 'rxjs';
import {
  catchError,
  tap,
  switchMap,
  startWith,
  map,
  takeUntil,
} from 'rxjs/operators';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { AuthService } from '../../modules/auth/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, DestroyRef } from '@angular/core';
import {
  QuotaInfoResponse,
  FeatureValidationResponse,
  BetaInfoResponse,
  QuotaDisplayData,
  QuotaStatus,
  BetaRestrictions,
} from '../models/quota.model';

@Injectable({
  providedIn: 'root',
})
export class QuotaService {
  private readonly http = inject(HttpClient);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl =
    environment.services?.api?.url || 'http://localhost:3000/api';

  // Signals pour l'état des quotas
  private readonly quotaInfo$ = new BehaviorSubject<QuotaInfoResponse | null>(
    null
  );
  private readonly betaInfo$ = new BehaviorSubject<BetaInfoResponse | null>(
    null
  );
  private readonly isLoading$ = new BehaviorSubject<boolean>(false);
  private readonly error$ = new BehaviorSubject<string | null>(null);

  // Conversion en signals
  public readonly quotaInfo = toSignal(this.quotaInfo$.asObservable());
  public readonly betaInfo = toSignal(this.betaInfo$.asObservable());
  public readonly isLoading = toSignal(this.isLoading$.asObservable(), {
    initialValue: false,
  });
  public readonly error = toSignal(this.error$.asObservable());

  // Computed signals pour l'affichage
  public readonly isBeta = computed(() => this.quotaInfo()?.isBeta || false);

  public readonly quotaDisplay = computed((): QuotaDisplayData | null => {
    const info = this.quotaInfo();
    if (!info) return null;

    const dailyPercentage = (info.dailyUsage / info.dailyLimit) * 100;
    const weeklyPercentage = (info.weeklyUsage / info.weeklyLimit) * 100;

    return {
      dailyPercentage,
      weeklyPercentage,
      dailyStatus: this.getQuotaStatus(dailyPercentage),
      weeklyStatus: this.getQuotaStatus(weeklyPercentage),
      canUseFeature: info.remainingDaily > 0 && info.remainingWeekly > 0,
    };
  });

  public readonly betaRestrictions = computed((): BetaRestrictions | null => {
    const info = this.betaInfo();
    if (!info) return null;

    return {
      ...info.restrictions,
      allowedFeatures: info.allowedFeatures,
    };
  });

  /**
   * Récupère les informations de quota depuis l'API
   */
  public getQuotaInfo(): Observable<QuotaInfoResponse> {
    this.isLoading$.next(true);
    this.error$.next(null);

    return this.http.get<QuotaInfoResponse>(`${this.apiUrl}/quota/info`).pipe(
      tap((info) => {
        this.quotaInfo$.next(info);
        this.isLoading$.next(false);
      }),
      catchError((error) => {
        this.handleError('Erreur lors de la récupération des quotas', error);
        return EMPTY;
      })
    );
  }

  /**
   * Récupère les informations bêta depuis l'API
   */
  public getBetaInfo(): Observable<BetaInfoResponse> {
    return this.http.get<BetaInfoResponse>(`${this.apiUrl}/quota/beta`).pipe(
      tap((info) => this.betaInfo$.next(info)),
      catchError((error) => {
        this.handleError(
          'Erreur lors de la récupération des infos bêta',
          error
        );
        return EMPTY;
      })
    );
  }

  /**
   * Valide si une fonctionnalité est disponible
   */
  public validateFeature(
    featureName: string
  ): Observable<FeatureValidationResponse> {
    return this.http
      .get<FeatureValidationResponse>(
        `${this.apiUrl}/quota/validate/${featureName}`
      )
      .pipe(
        catchError((error) => {
          this.handleError(
            `Erreur lors de la validation de la fonctionnalité ${featureName}`,
            error
          );
          return EMPTY;
        })
      );
  }

  /**
   * Vérifie si l'utilisateur peut utiliser une fonctionnalité
   */
  public canUseFeature(featureName: string): Observable<boolean> {
    return this.validateFeature(featureName).pipe(
      map((response: FeatureValidationResponse) => {
        if (!response.allowed && response.message) {
          this.showQuotaExceededMessage(response.message);
        }
        return response.allowed;
      }),
      catchError(() => {
        return [false]; // Retourne false en cas d'erreur
      })
    );
  }

  /**
   * Rafraîchit les informations de quota
   */
  public refreshQuotaInfo(): Observable<QuotaInfoResponse> {
    return this.getQuotaInfo().pipe(
      switchMap(() => this.getBetaInfo()),
      switchMap(() => {
        const currentInfo = this.quotaInfo$.value;
        if (currentInfo) {
          return [currentInfo];
        }
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

  /**
   * Gère les erreurs HTTP
   */
  private handleError(message: string, error: HttpErrorResponse): void {
    console.error(message, error);
    this.error$.next(message);
    this.isLoading$.next(false);

    if (error.status === 429) {
      this.showQuotaExceededMessage(
        'Quota dépassé. Veuillez attendre avant de réessayer.'
      );
    }
  }

  /**
   * Affiche un message d'erreur de quota dépassé
   */
  private showQuotaExceededMessage(message: string): void {
    this.notificationService.showError({
      title: 'Quota dépassé',
      message,
      duration: 5000,
      actions: [
        {
          label: 'Rafraîchir',
          action: () => this.refreshQuotaInfo().subscribe(),
        },
      ],
    });
  }

  /**
   * Vérifie si une fonctionnalité est autorisée en mode bêta
   */
  public isFeatureAllowedInBeta(featureName: string): boolean {
    const betaInfo = this.betaInfo();
    if (!betaInfo || !betaInfo.isBeta) return true;

    return betaInfo.allowedFeatures.includes(featureName);
  }

  /**
   * Retourne un message d'explication pour les restrictions bêta
   */
  public getBetaRestrictionMessage(featureName: string): string {
    if (!this.isBeta()) return '';

    const restrictions = this.betaRestrictions();
    if (!restrictions) return '';

    if (!this.isFeatureAllowedInBeta(featureName)) {
      return `Cette fonctionnalité n'est pas disponible en version bêta.`;
    }

    return `Version bêta - Limitations: ${restrictions.maxStyles} styles max, résolution ${restrictions.maxResolution}`;
  }
}
