import {
  Component,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { QuotaService } from '../../services/quota.service';
import { NotificationService } from '../../services/notification.service';
import {
  QuotaStatus,
  QuotaInfoResponse,
  QuotaDisplayData,
} from '../../models/quota.model';

@Component({
  selector: 'app-quota-warning',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldShowWarning(); as warning) {
    <div class="fixed bottom-4 right-4 z-50 max-w-sm">
      <div
        class="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg border border-yellow-400/30"
      >
        <div class="flex items-start">
          <!-- Icône d'avertissement -->
          <div class="flex-shrink-0 mr-3">
            <svg
              class="w-6 h-6 text-yellow-200"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </div>

          <div class="flex-1">
            <h4 class="font-semibold text-sm mb-1">{{ warning.title }}</h4>
            <p class="text-sm text-yellow-100 mb-3">{{ warning.message }}</p>

            <!-- Détails des quotas -->
            <div class="space-y-2 text-xs">
              @if (warning.dailyWarning) {
              <div class="flex justify-between items-center">
                <span>Quota quotidien:</span>
                <span class="font-medium"
                  >{{ warning.dailyUsage }}/{{ warning.dailyLimit }}</span
                >
              </div>
              } @if (warning.weeklyWarning) {
              <div class="flex justify-between items-center">
                <span>Quota hebdomadaire:</span>
                <span class="font-medium"
                  >{{ warning.weeklyUsage }}/{{ warning.weeklyLimit }}</span
                >
              </div>
              }
            </div>

            <!-- Actions -->
            <div class="flex space-x-2 mt-3">
              <button
                (click)="dismissWarning()"
                class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
              >
                Compris
              </button>
              <button
                (click)="showQuotaDetails()"
                class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
              >
                Voir détails
              </button>
            </div>
          </div>

          <!-- Bouton fermer -->
          <button
            (click)="dismissWarning()"
            class="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class QuotaWarningComponent implements OnInit {
  private readonly quotaService = inject(QuotaService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private warningDismissed = false;

  // Local state management with signals
  protected readonly quotaInfo = signal<QuotaInfoResponse | null>(null);
  protected readonly quotaDisplay = signal<QuotaDisplayData | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly shouldShowWarning = signal<any>(null);

  /**
   * Calculates if warning should be shown based on quota data
   */
  private calculateWarningState(): void {
    if (this.warningDismissed) {
      this.shouldShowWarning.set(null);
      return;
    }

    const quotaInfo = this.quotaInfo();
    const quotaDisplay = this.quotaDisplay();

    if (!quotaInfo || !quotaDisplay) {
      this.shouldShowWarning.set(null);
      return;
    }

    const dailyWarning = quotaDisplay.dailyStatus === QuotaStatus.WARNING;
    const weeklyWarning = quotaDisplay.weeklyStatus === QuotaStatus.WARNING;

    if (!dailyWarning && !weeklyWarning) {
      this.shouldShowWarning.set(null);
      return;
    }

    let title = 'Quota bientôt atteint';
    let message = "Vous approchez de vos limites d'utilisation.";

    if (dailyWarning && weeklyWarning) {
      message = 'Vos quotas quotidien et hebdomadaire sont bientôt atteints.';
    } else if (dailyWarning) {
      message = 'Votre quota quotidien est bientôt atteint.';
    } else if (weeklyWarning) {
      message = 'Votre quota hebdomadaire est bientôt atteint.';
    }

    this.shouldShowWarning.set({
      title,
      message,
      dailyWarning,
      weeklyWarning,
      dailyUsage: quotaInfo.dailyUsage,
      dailyLimit: quotaInfo.dailyLimit,
      weeklyUsage: quotaInfo.weeklyUsage,
      weeklyLimit: quotaInfo.weeklyLimit,
    });
  }

  ngOnInit(): void {
    this.loadQuotaInfo();
  }

  /**
   * Loads quota information from the service
   */
  private loadQuotaInfo(): void {
    this.isLoading.set(true);

    this.quotaService
      .getQuotaInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (info: QuotaInfoResponse) => {
          this.quotaInfo.set(info);
          this.processQuotaDisplayData(info);
          this.isLoading.set(false);
          this.calculateWarningState();

          // Send notification if warning is active
          const warning = this.shouldShowWarning();
          if (warning && !this.warningDismissed) {
            this.sendWarningNotification(warning);
          }
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Processes quota info into display data
   */
  private processQuotaDisplayData(info: QuotaInfoResponse): void {
    if (!info) return;

    const dailyPercentage = (info.dailyUsage / info.dailyLimit) * 100;
    const weeklyPercentage = (info.weeklyUsage / info.weeklyLimit) * 100;

    const displayData: QuotaDisplayData = {
      dailyPercentage,
      weeklyPercentage,
      dailyStatus: this.getQuotaStatus(dailyPercentage),
      weeklyStatus: this.getQuotaStatus(weeklyPercentage),
      canUseFeature: info.remainingDaily > 0 && info.remainingWeekly > 0,
    };

    this.quotaDisplay.set(displayData);
  }

  /**
   * Determines quota status based on percentage
   */
  private getQuotaStatus(percentage: number): QuotaStatus {
    if (percentage >= 100) return QuotaStatus.EXCEEDED;
    if (percentage >= 80) return QuotaStatus.WARNING;
    return QuotaStatus.AVAILABLE;
  }

  protected dismissWarning(): void {
    this.warningDismissed = true;

    // Réactiver l'avertissement après 1 heure
    setTimeout(() => {
      this.warningDismissed = false;
    }, 60 * 60 * 1000);
  }

  protected showQuotaDetails(): void {
    this.notificationService.showInfo({
      title: 'Informations de quota',
      message:
        'Consultez votre tableau de bord pour plus de détails sur vos quotas.',
      duration: 4000,
    });
    this.dismissWarning();
  }

  private sendWarningNotification(warning: any): void {
    // Envoyer une notification une seule fois
    if (!this.warningDismissed) {
      this.notificationService.showWarning({
        title: warning.title,
        message: warning.message,
        duration: 6000,
        actions: [
          {
            label: 'Voir détails',
            action: () => this.showQuotaDetails(),
          },
        ],
      });
    }
  }
}
