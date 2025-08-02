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
import {
  BusinessPlanStepEvent,
  BusinessPlanStep,
  BusinessPlanGenerationState,
} from '../../../../models/business-plan-step.model';
import { BusinessPlanModel } from '../../../../models/businessPlan.model';

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
  private readonly cookieService = inject(CookieService);
  private readonly destroy$ = new Subject<void>();

  // Outputs
  readonly businessPlanGenerated = output<BusinessPlanModel>();

  // Signals for reactive state management
  protected readonly projectId = signal<string | null>(null);
  protected readonly generationState = signal<BusinessPlanGenerationState>({
    steps: [],
    currentStep: null,
    isGenerating: false,
    error: null,
    completed: false,
  });

  // Computed properties
  protected readonly isGenerating = computed(
    () => this.generationState().isGenerating
  );
  protected readonly generationError = computed(
    () => this.generationState().error
  );
  protected readonly currentStep = computed(
    () => this.generationState().currentStep
  );
  protected readonly completedSteps = computed(() =>
    this.generationState().steps.filter((step) => step.status === 'completed')
  );
  protected readonly hasCompletedSteps = computed(
    () => this.completedSteps().length > 0
  );
  protected readonly totalSteps = computed(
    () => this.generationState().steps.length
  );
  protected readonly completedCount = computed(
    () => this.completedSteps().length
  );
  protected readonly progressPercentage = computed(() => {
    const total = this.totalSteps();
    const completed = this.completedCount();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

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

    this.businessPlanService
      .createBusinessplanItem(this.projectId()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stepEvent: BusinessPlanStepEvent) => {
          console.log('Business Plan SSE step event received:', stepEvent);
          this.handleSSEStepEvent(stepEvent);
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
          this.generationState.update((state) => ({
            ...state,
            isGenerating: false,
            completed: true,
          }));
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
    });
  }

  /**
   * Handle SSE step events and update UI state
   */
  private handleSSEStepEvent(stepEvent: BusinessPlanStepEvent): void {
    const currentState = this.generationState();

    if (stepEvent.type === 'started' || stepEvent.data === 'step_started') {
      // Step started - add or update step as in-progress
      const newStep: BusinessPlanStep = {
        stepName: stepEvent.stepName,
        status: 'in-progress',
        timestamp: stepEvent.timestamp,
        summary: stepEvent.summary,
      };

      const existingStepIndex = currentState.steps.findIndex(
        (step) => step.stepName === stepEvent.stepName
      );

      let updatedSteps: BusinessPlanStep[];
      if (existingStepIndex >= 0) {
        updatedSteps = [...currentState.steps];
        updatedSteps[existingStepIndex] = newStep;
      } else {
        updatedSteps = [...currentState.steps, newStep];
      }

      this.generationState.update((state) => ({
        ...state,
        steps: updatedSteps,
        currentStep: newStep,
      }));
    } else if (stepEvent.type === 'completed') {
      // Step completed - update step with content
      const completedStep: BusinessPlanStep = {
        stepName: stepEvent.stepName,
        status: 'completed',
        content: stepEvent.data,
        timestamp: stepEvent.timestamp,
        summary: stepEvent.summary,
      };

      const existingStepIndex = currentState.steps.findIndex(
        (step) => step.stepName === stepEvent.stepName
      );

      let updatedSteps: BusinessPlanStep[];
      if (existingStepIndex >= 0) {
        updatedSteps = [...currentState.steps];
        updatedSteps[existingStepIndex] = completedStep;
      } else {
        updatedSteps = [...currentState.steps, completedStep];
      }

      // Check if this is the final step (assuming 6 steps like diagrams)
      const completedSteps = updatedSteps.filter(
        (step) => step.status === 'completed'
      );
      const isAllCompleted = completedSteps.length >= 6;

      this.generationState.update((state) => ({
        ...state,
        steps: updatedSteps,
        currentStep: isAllCompleted ? null : state.currentStep,
        isGenerating: !isAllCompleted,
        completed: isAllCompleted,
      }));

      // If all steps are completed, emit the final business plan data
      if (isAllCompleted) {
      }
    }
  }

  /**
   * Cancel ongoing generation
   */
  protected cancelGeneration(): void {
    this.businessPlanService.cancelGeneration();
    this.generationState.update((state) => ({
      ...state,
      isGenerating: false,
      error: 'Generation cancelled',
    }));
  }
}
