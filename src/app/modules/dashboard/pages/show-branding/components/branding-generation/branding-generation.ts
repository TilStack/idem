import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { CookieService } from '../../../../../../shared/services/cookie.service';
import { GenerationService } from '../../../../../../shared/services/generation.service';
import { SSEGenerationState, SSEConnectionConfig } from '../../../../../../shared/models/sse-step.model';
import { BrandIdentityModel } from '../../../../models/brand-identity.model';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-branding-generation',
  standalone: true,
  imports: [DatePipe, SkeletonModule],
  templateUrl: './branding-generation.html',
  styleUrl: './branding-generation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandingGenerationComponent implements OnInit, OnDestroy {
  private readonly brandingService = inject(BrandingService);
  private readonly generationService = inject(GenerationService);
  private readonly cookieService = inject(CookieService);
  private readonly destroy$ = new Subject<void>();

  // Outputs
  readonly brandingGenerated = output<BrandIdentityModel>();

  // Signals for reactive state management
  protected readonly projectId = signal<string | null>(null);
  protected readonly generationState = signal<SSEGenerationState>({
    steps: [],
    stepsInProgress: [],
    completedSteps: [],
    totalSteps: 0,
    completed: false,
    error: null,
    isGenerating: false
  });

  // Computed properties using the new generation state
  protected readonly isGenerating = computed(() => this.generationState().isGenerating);
  protected readonly generationError = computed(() => this.generationState().error);
  protected readonly completedSteps = computed(() => 
    this.generationState().steps.filter(step => step.status === 'completed')
  );
  protected readonly hasCompletedSteps = computed(() => 
    this.generationService.hasCompletedSteps(this.generationState())
  );
  protected readonly totalSteps = computed(() => this.generationState().totalSteps);
  protected readonly completedCount = computed(() => this.generationState().completedSteps);
  protected readonly progressPercentage = computed(() => 
    this.generationService.calculateProgress(this.generationState())
  );

  ngOnInit(): void {
    this.projectId.set(this.cookieService.get('projectId'));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Generate new branding using SSE for real-time updates
   */
  protected generateBranding(): void {
    if (!this.projectId()) {
      console.error('Project ID not found');
      return;
    }

    // Reset state for new generation
    this.resetGenerationState();
    console.log('Starting branding generation with SSE...');

    // Create SSE connection for branding generation
    const sseConnection = this.brandingService.createBrandIdentityModel(this.projectId()!);

    this.generationService
      .startGeneration('branding', sseConnection)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state: SSEGenerationState) => {
          console.log('Branding generation state updated:', state);
          this.generationState.set(state);
          
          // Check if generation is completed
          if (state.completed && state.steps.length > 0) {
            this.emitBrandingData(state.steps);
          }
        },
        error: (err) => {
          console.error(
            `Error generating branding for project ID: ${this.projectId()}:`,
            err
          );
          this.generationState.update(state => ({
            ...state,
            error: 'Failed to generate branding',
            isGenerating: false,
          }));
        },
        complete: () => {
          console.log('Branding generation completed');
        }
      });
  }

  /**
   * Reset generation state for new generation
   */
  private resetGenerationState(): void {
    this.generationState.set({
      steps: [],
      stepsInProgress: [],
      completedSteps: [],
      totalSteps: 0,
      completed: false,
      error: null,
      isGenerating: true
    });
  }

  /**
   * Cancel ongoing generation
   */
  protected cancelGeneration(): void {
    this.generationService.cancelGeneration('branding');
    this.generationState.update(state => ({
      ...state,
      isGenerating: false,
      error: 'Generation cancelled',
    }));
  }

  /**
   * Emit final branding data when generation is completed
   */
  private emitBrandingData(steps: any[]): void {
    try {
      // Create branding data from completed steps
      const brandingData: BrandIdentityModel = {
        id: this.projectId() || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        logo: {
          id: '',
          name: 'Generated Logo',
          svg: '',
          concept: this.extractStepContent(steps, 'Logo') || 'Generated brand logo',
          colors: ['#000000', '#ffffff'],
          fonts: ['Arial']
        },
        generatedLogos: [],
        colors: {
          id: '',
          name: 'Generated Colors',
          url: '',
          colors: {
            primary: '#000000',
            secondary: '#ffffff',
            accent: '#007bff',
            background: '#f8f9fa',
            text: '#212529'
          }
        },
        generatedColors: [],
        typography: {
          id: '',
          name: 'Generated Typography',
          url: '',
          primaryFont: 'Arial',
          secondaryFont: 'Helvetica'
        },
        generatedTypography: [],
        sections: steps.map((step, index) => ({
          id: `section-${index}`,
          name: step.stepName || `Step ${index + 1}`,
          type: 'branding',
          data: step.content || step.summary || '',
          summary: step.summary || '',
          order: index
        }))
      };

      console.log('Emitting branding data:', brandingData);
      this.brandingGenerated.emit(brandingData);
    } catch (error) {
      console.error('Error creating branding data:', error);
      this.generationState.update(state => ({
        ...state,
        error: 'Failed to process branding data',
        isGenerating: false
      }));
    }
  }

  /**
   * Extract content from a specific step by name
   */
  private extractStepContent(steps: any[], stepName: string): string {
    const step = steps.find(s => s.stepName?.toLowerCase().includes(stepName.toLowerCase()));
    return step?.content || step?.summary || '';
  }
}
