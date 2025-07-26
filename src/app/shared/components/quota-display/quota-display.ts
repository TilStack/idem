import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotaStatus, QuotaDisplayData, QuotaInfoResponse, BetaRestrictions } from '../../models/quota.model';

@Component({
  selector: 'app-quota-display',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
        @if (!isLoading && quotaDisplay) {
      <div class="quota-display bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
        <!-- Header avec badge bêta -->
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-gray-300">Quotas</h3>
          @if (isBeta) {
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <span class="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1"></span>
              BETA
            </span>
          }
        </div>

        <!-- Quota quotidien -->
        <div class="mb-3">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-gray-400">Quotidien</span>
            <span [class]="getDailyStatusClass()">
              {{ quotaInfo?.remainingDaily || 0 }}/{{ quotaInfo?.dailyLimit || 0 }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              [class]="getDailyProgressClass()"
              [style.width.%]="quotaDisplay.dailyPercentage"
            ></div>
          </div>
        </div>

        <!-- Quota hebdomadaire -->
        <div class="mb-2">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="text-gray-400">Hebdomadaire</span>
            <span [class]="getWeeklyStatusClass()">
              {{ quotaInfo?.remainingWeekly || 0 }}/{{ quotaInfo?.weeklyLimit || 0 }}
            </span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              [class]="getWeeklyProgressClass()"
              [style.width.%]="quotaDisplay.weeklyPercentage"
            ></div>
          </div>
        </div>

        <!-- Messages d'avertissement -->
        @if (quotaDisplay.dailyStatus === QuotaStatus.WARNING || quotaDisplay.weeklyStatus === QuotaStatus.WARNING) {
          <div class="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
              Quota bientôt atteint
            </div>
          </div>
        }

        @if (quotaDisplay.dailyStatus === QuotaStatus.EXCEEDED || quotaDisplay.weeklyStatus === QuotaStatus.EXCEEDED) {
          <div class="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
            <div class="flex items-center">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
              Quota dépassé
            </div>
          </div>
        }

        <!-- Informations bêta -->
        @if (isBeta && betaRestrictions) {
          <div class="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
            <div class="font-medium mb-1">Limitations bêta:</div>
            <ul class="space-y-1 text-xs">
              <li>• {{ betaRestrictions.maxStyles }} styles maximum</li>
              <li>• Résolution: {{ betaRestrictions.maxResolution }}</li>
              <li>• {{ betaRestrictions.maxOutputTokens }} tokens max</li>
            </ul>
          </div>
        }
      </div>
    } @else if (isLoading) {
      <div class="quota-display bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-700 rounded mb-2"></div>
          <div class="h-2 bg-gray-700 rounded mb-2"></div>
          <div class="h-2 bg-gray-700 rounded"></div>
        </div>
      </div>
    }
  `
})
export class QuotaDisplayComponent {
  @Input() quotaInfo: QuotaInfoResponse | null = null;
  @Input() quotaDisplay: QuotaDisplayData | null = null;
  @Input() isBeta: boolean = false;
  @Input() betaRestrictions: BetaRestrictions | null = null;
  @Input() isLoading: boolean = true;

  protected readonly QuotaStatus = QuotaStatus;

  protected getDailyStatusClass(): string {
    if (!this.quotaDisplay) return 'text-gray-400';

    switch (this.quotaDisplay.dailyStatus) {
      case QuotaStatus.EXCEEDED:
        return 'text-red-400 font-medium';
      case QuotaStatus.WARNING:
        return 'text-yellow-400 font-medium';
      default:
        return 'text-green-400';
    }
  }

  protected getWeeklyStatusClass(): string {
    if (!this.quotaDisplay) return 'text-gray-400';

    switch (this.quotaDisplay.weeklyStatus) {
      case QuotaStatus.EXCEEDED:
        return 'text-red-400 font-medium';
      case QuotaStatus.WARNING:
        return 'text-yellow-400 font-medium';
      default:
        return 'text-green-400';
    }
  }

  protected getDailyProgressClass(): string {
    if (!this.quotaDisplay) return 'bg-gray-600';

    switch (this.quotaDisplay.dailyStatus) {
      case QuotaStatus.EXCEEDED:
        return 'bg-red-500';
      case QuotaStatus.WARNING:
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  }

  protected getWeeklyProgressClass(): string {
    if (!this.quotaDisplay) return 'bg-gray-600';

    switch (this.quotaDisplay.weeklyStatus) {
      case QuotaStatus.EXCEEDED:
        return 'bg-red-500';
      case QuotaStatus.WARNING:
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  }
}
