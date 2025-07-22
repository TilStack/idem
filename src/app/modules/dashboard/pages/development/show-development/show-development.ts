import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DevelopmentService } from '../../../services/ai-agents/development.service';
import { DevelopmentConfigsModel } from '../../../models/development.model';
import { CookieService } from '../../../../../shared/services/cookie.service';
import { catchError, finalize, of, tap } from 'rxjs';
import { Loader } from "../../../../../components/loader/loader";

@Component({
  selector: 'app-show-development',
  standalone: true,
  imports: [CommonModule, RouterModule, Loader],
  templateUrl: './show-development.html',
  styleUrls: ['./show-development.css'],
})
export class ShowDevelopment implements OnInit {
  // Services
  private readonly developmentService = inject(DevelopmentService);
  private readonly cookieService = inject(CookieService);

  // State management using signals
  protected readonly developmentConfigs =
    signal<DevelopmentConfigsModel | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly projectId = signal<string>('');

  ngOnInit(): void {
    const storedProjectId = this.cookieService.get('projectId');
    if (storedProjectId) {
      this.projectId.set(storedProjectId);
      this.fetchDevelopmentConfigs(storedProjectId);
    } else {
      this.error.set('No project ID found. Please select a project first.');
    }
  }

  private fetchDevelopmentConfigs(projectId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.developmentService
      .getDevelopmentConfigs(projectId)
      .pipe(
        tap((configs: DevelopmentConfigsModel) => {
          if (configs) {
            this.developmentConfigs.set(configs);
          } else {
            this.error.set(
              'No development configurations found for this project.'
            );
          }
        }),
        catchError((err) => {
          console.error('Error fetching development configs:', err);
          this.error.set(
            'Failed to load development configurations. Please try again.'
          );
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }

  protected openApplication(): void {
    // This would typically open the application in a new tab
    // For now, we'll just redirect to a placeholder URL
    const appUrl = `/preview/app/${this.projectId()}`;
    window.open(appUrl, '_blank');
  }

  protected getFeaturesList(features: string[] | string | Record<string, boolean | undefined>): string {
    if (!features) return 'None';
    
    if (typeof features === 'string') {
      return features;
    } else if (Array.isArray(features)) {
      return features.length > 0 ? features.join(', ') : 'None';
    } else {
      const enabledFeatures = Object.entries(features)
        .filter(([_, enabled]) => enabled)
        .map(([name, _]) => name);
      return enabledFeatures.length > 0 ? enabledFeatures.join(', ') : 'None';
    }
  }

  /**
   * Formats custom options as a pretty-printed string
   */
  protected formatCustomOptions(options: any): string {
    return options ? JSON.stringify(options, null, 2) : '';
  }
}
