import {
  Component,
  Input,
  inject,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotaService } from '../../services/quota.service';

@Component({
  selector: 'app-quota-tooltip',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block group">
      <!-- Trigger element -->
      <ng-content></ng-content>

      <!-- Tooltip -->
      <div
        class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 min-w-max"
      >
        @if (tooltipContent(); as content) {
        <div class="text-center">
          <!-- Titre -->
          <div class="font-medium mb-1">{{ content.title }}</div>

          <!-- Message principal -->
          <div class="text-gray-300 mb-2">{{ content.message }}</div>

          <!-- Informations de quota -->
          @if (content.quotaInfo) {
          <div class="border-t border-gray-700 pt-2 space-y-1">
            <div class="flex justify-between text-xs">
              <span>Quotidien:</span>
              <span [class]="content.quotaInfo.dailyStatus">
                {{ content.quotaInfo.remainingDaily }}/{{
                  content.quotaInfo.dailyLimit
                }}
              </span>
            </div>
            <div class="flex justify-between text-xs">
              <span>Hebdomadaire:</span>
              <span [class]="content.quotaInfo.weeklyStatus">
                {{ content.quotaInfo.remainingWeekly }}/{{
                  content.quotaInfo.weeklyLimit
                }}
              </span>
            </div>
          </div>
          }

          <!-- Restrictions bêta -->
          @if (content.betaRestrictions) {
          <div class="border-t border-gray-700 pt-2 text-xs">
            <div class="text-orange-300 font-medium mb-1">
              Limitations bêta:
            </div>
            <ul class="text-left space-y-1">
              @for (restriction of content.betaRestrictions; track restriction)
              {
              <li>• {{ restriction }}</li>
              }
            </ul>
          </div>
          }
        </div>
        }

        <!-- Flèche du tooltip -->
        <div
          class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"
        ></div>
      </div>
    </div>
  `,
})
export class QuotaTooltipComponent {
  @Input() featureName: string = '';
  @Input() customMessage: string = '';

  private readonly quotaService = inject(QuotaService);

  protected readonly tooltipContent = computed(() => {
    const quotaInfo = this.quotaService.quotaInfo();
    const quotaDisplay = this.quotaService.quotaDisplay();
    const isBeta = this.quotaService.isBeta();
    const betaRestrictions = this.quotaService.betaRestrictions();

    if (!quotaInfo) return null;

    // Déterminer le titre et message principal
    let title = 'Informations de quota';
    let message = this.customMessage;

    if (!message) {
      if (!quotaDisplay?.canUseFeature) {
        title = 'Quota dépassé';
        message = "Vous avez atteint vos limites d'utilisation";
      } else if (
        isBeta &&
        this.featureName &&
        !this.quotaService.isFeatureAllowedInBeta(this.featureName)
      ) {
        title = 'Fonctionnalité limitée';
        message = 'Non disponible en version bêta';
      } else if (
        quotaDisplay?.dailyStatus === 'warning' ||
        quotaDisplay?.weeklyStatus === 'warning'
      ) {
        title = 'Quota bientôt atteint';
        message = 'Utilisez avec modération';
      } else {
        message = 'Quotas disponibles';
      }
    }

    // Informations de quota avec statut coloré
    const quotaInfoFormatted = {
      dailyLimit: quotaInfo.dailyLimit,
      remainingDaily: quotaInfo.remainingDaily,
      weeklyLimit: quotaInfo.weeklyLimit,
      remainingWeekly: quotaInfo.remainingWeekly,
      dailyStatus: this.getStatusClass(
        quotaDisplay?.dailyStatus || 'available'
      ),
      weeklyStatus: this.getStatusClass(
        quotaDisplay?.weeklyStatus || 'available'
      ),
    };

    // Restrictions bêta formatées
    let betaRestrictionsFormatted: string[] | null = null;
    if (isBeta && betaRestrictions) {
      betaRestrictionsFormatted = [
        `${betaRestrictions.maxStyles} styles maximum`,
        `Résolution: ${betaRestrictions.maxResolution}`,
        `${betaRestrictions.maxOutputTokens} tokens max`,
      ];

      if (
        this.featureName &&
        !betaRestrictions.allowedFeatures.includes(this.featureName)
      ) {
        betaRestrictionsFormatted.unshift('Fonctionnalité non autorisée');
      }
    }

    return {
      title,
      message,
      quotaInfo: quotaInfoFormatted,
      betaRestrictions: betaRestrictionsFormatted,
    };
  });

  private getStatusClass(status: string): string {
    switch (status) {
      case 'exceeded':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  }
}
