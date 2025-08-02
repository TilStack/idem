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
import { BrandingService } from '../../../../services/ai-agents/branding.service';
import { CookieService } from '../../../../../../shared/services/cookie.service';
import { BrandingStepEvent, BrandingStep, BrandingGenerationState } from '../../../../models/branding-step.model';
import { BrandIdentityModel } from '../../../../models/brand-identity.model';

@Component({
  selector: 'app-branding-generation',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './branding-generation.html',
  styleUrl: './branding-generation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandingGenerationComponent implements OnInit, OnDestroy {
  private readonly brandingService = inject(BrandingService);
  private readonly cookieService = inject(CookieService);
  private readonly destroy$ = new Subject<void>();

  // Outputs
  readonly brandingGenerated = output<BrandIdentityModel>();

  // Signals for reactive state management
  protected readonly projectId = signal<string | null>(null);
  protected readonly generationState = signal<BrandingGenerationState>({
    steps: [],
    currentStep: null,
    isGenerating: false,
    error: null,
    completed: false,
  });

  // Computed properties
  protected readonly isGenerating = computed(() => this.generationState().isGenerating);
  protected readonly generationError = computed(() => this.generationState().error);
  protected readonly currentStep = computed(() => this.generationState().currentStep);
  protected readonly completedSteps = computed(() => 
    this.generationState().steps.filter(step => step.status === 'completed')
  );
  protected readonly hasCompletedSteps = computed(() => this.completedSteps().length > 0);
  protected readonly totalSteps = computed(() => this.generationState().steps.length);
  protected readonly completedCount = computed(() => this.completedSteps().length);
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

    this.brandingService
      .createBrandIdentityModel(this.projectId()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stepEvent: BrandingStepEvent) => {
          console.log('Branding SSE step event received:', stepEvent);
          this.handleSSEStepEvent(stepEvent);
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
          this.generationState.update(state => ({
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
  private handleSSEStepEvent(stepEvent: BrandingStepEvent): void {
    const currentState = this.generationState();
    
    if (stepEvent.type === 'started' || stepEvent.data === 'step_started') {
      // Step started - add or update step as in-progress
      const newStep: BrandingStep = {
        stepName: stepEvent.stepName,
        status: 'in-progress',
        timestamp: stepEvent.timestamp,
        summary: stepEvent.summary,
      };

      const existingStepIndex = currentState.steps.findIndex(
        step => step.stepName === stepEvent.stepName
      );

      let updatedSteps: BrandingStep[];
      if (existingStepIndex >= 0) {
        updatedSteps = [...currentState.steps];
        updatedSteps[existingStepIndex] = newStep;
      } else {
        updatedSteps = [...currentState.steps, newStep];
      }

      this.generationState.update(state => ({
        ...state,
        steps: updatedSteps,
        currentStep: newStep,
      }));

    } else if (stepEvent.type === 'completed') {
      // Step completed - update step with content
      const completedStep: BrandingStep = {
        stepName: stepEvent.stepName,
        status: 'completed',
        content: stepEvent.data,
        timestamp: stepEvent.timestamp,
        summary: stepEvent.summary,
      };

      const existingStepIndex = currentState.steps.findIndex(
        step => step.stepName === stepEvent.stepName
      );

      let updatedSteps: BrandingStep[];
      if (existingStepIndex >= 0) {
        updatedSteps = [...currentState.steps];
        updatedSteps[existingStepIndex] = completedStep;
      } else {
        updatedSteps = [...currentState.steps, completedStep];
      }

      // Check if this is the final step (assuming 6 steps like diagrams)
      const completedSteps = updatedSteps.filter(step => step.status === 'completed');
      const isAllCompleted = completedSteps.length >= 6;

      this.generationState.update(state => ({
        ...state,
        steps: updatedSteps,
        currentStep: isAllCompleted ? null : state.currentStep,
        isGenerating: !isAllCompleted,
        completed: isAllCompleted,
      }));

      // If all steps are completed, emit the final branding data
      if (isAllCompleted) {
        
      }
    }
  }

  /**
   * Cancel ongoing generation
   */
  protected cancelGeneration(): void {
    this.brandingService.cancelGeneration();
    this.generationState.update(state => ({
      ...state,
      isGenerating: false,
      error: 'Generation cancelled',
    }));
  }
}
