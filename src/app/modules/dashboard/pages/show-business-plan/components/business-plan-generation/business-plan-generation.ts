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
import { BusinessPlanService } from '../../../../services/ai-agents/business-plan.service';
import { CookieService } from '../../../../../../shared/services/cookie.service';
import { GenerationService } from '../../../../../../shared/services/generation.service';
import { SSEGenerationState, SSEConnectionConfig } from '../../../../../../shared/models/sse-step.model';
import { BusinessPlanModel } from '../../../../models/businessPlan.model';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-business-plan-generation',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './business-plan-generation.html',
  styleUrl: './business-plan-generation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPlanGenerationComponent implements OnInit, OnDestroy {
  private readonly businessPlanService = inject(BusinessPlanService);
  private readonly generationService = inject(GenerationService);
  private readonly cookieService = inject(CookieService);
  private readonly destroy$ = new Subject<void>();

  // Outputs
  readonly businessPlanGenerated = output<BusinessPlanModel>();

  // Signals for reactive state management
  protected readonly projectId = signal<string | null>(null);
  protected readonly generationState = signal<SSEGenerationState>({
    steps: [],
    currentStep: null,
    isGenerating: false,
    error: null,
    completed: false,
    totalSteps: 0,
    completedSteps: 0
  });

  // Computed properties using the new generation state
  protected readonly isGenerating = computed(() => this.generationState().isGenerating);
  protected readonly generationError = computed(() => this.generationState().error);
  protected readonly currentStep = computed(() => this.generationState().currentStep);
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
   * Generate new business plan using SSE for real-time updates
   */
  protected generateBusinessPlan(): void {
    if (!this.projectId()) {
      console.error('Project ID not found');
      return;
    }

    // Reset state for new generation
    this.resetGenerationState();
    console.log('Starting business plan generation with SSE...');

    const config: SSEConnectionConfig = {
      url: `${environment.services.api.url}/project/businessPlans/generate/${this.projectId()}`,
      keepAlive: true,
      reconnectionDelay: 1000
    };

    this.generationService
      .startGeneration(config, 'business-plan', this.destroy$)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state: SSEGenerationState) => {
          console.log('Business plan generation state updated:', state);
          this.generationState.set(state);
          
          // Check if generation is completed
          if (state.completed && state.steps.length > 0) {
            this.emitBusinessPlanData(state.steps);
          }
        },
        error: (err) => {
          console.error(
            `Error generating business plan for project ID: ${this.projectId()}:`,
            err
          );
          this.generationState.update((state) => ({
            ...state,
            error: 'Failed to generate business plan',
            isGenerating: false,
          }));
        },
        complete: () => {
          console.log('Business plan generation completed');
        },
      });
  }

  /**
   * Reset generation state for new generation
   */
  private resetGenerationState(): void {
    this.generationState.set({
      steps: [],
      currentStep: null,
      isGenerating: true,
      error: null,
      completed: false,
      totalSteps: 0,
      completedSteps: 0
    });
  }

  /**
   * Emit business plan data when generation is completed
   */
  private emitBusinessPlanData(steps: any[]): void {
    const combinedContent = this.combineStepsContent(steps);
    
    const businessPlan: BusinessPlanModel = {
      sections: steps.map(step => ({
        id: `section-${step.stepName}`,
        name: step.stepName,
        type: 'generated',
        data: step.content || step.summary || '',
        summary: step.summary || ''
      }))
    };
    
    this.businessPlanGenerated.emit(businessPlan);
  }

  /**
   * Combine all step contents into a single business plan content
   */
  private combineStepsContent(steps: any[]): string {
    return steps
      .filter((step) => step.content && step.content !== 'step_started')
      .map((step) => `## ${step.stepName}\n\n${step.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Cancel ongoing generation
   */
  protected cancelGeneration(): void {
    this.generationService.cancelGeneration('business-plan');
    this.generationState.update((state) => ({
      ...state,
      isGenerating: false,
      error: 'Generation cancelled',
    }));
  }
}
