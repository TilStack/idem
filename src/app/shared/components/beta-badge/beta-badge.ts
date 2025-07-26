import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotaService } from '../../services/quota.service';

@Component({
  selector: 'app-beta-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isBeta()) {
      <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border border-orange-500/30 shadow-lg backdrop-blur-sm">
        <div class="flex items-center">
          <!-- Icône pulse -->
          <span class="relative flex h-2 w-2 mr-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          
          <!-- Texte BETA -->
          <span class="font-bold tracking-wider">BETA</span>
          
          <!-- Icône info avec tooltip -->
          <div class="relative ml-2 group">
            <svg class="w-4 h-4 text-orange-300 cursor-help" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            
            <!-- Tooltip -->
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              <div class="text-center">
                <div class="font-medium mb-1">Version Bêta</div>
                <div class="text-gray-300">Fonctionnalités limitées</div>
              </div>
              <!-- Flèche du tooltip -->
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class BetaBadgeComponent {
  private readonly quotaService = inject(QuotaService);

  protected readonly isBeta = this.quotaService.isBeta;
}
