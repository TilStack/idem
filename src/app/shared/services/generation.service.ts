import { inject, Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { SSEService } from './sse.service';
import { 
  SSEStepEvent, 
  SSEStep, 
  SSEGenerationState, 
  SSEConnectionConfig,
  SSEServiceEventType 
} from '../models/sse-step.model';

/**
 * Generic Generation Service that handles SSE-based AI generation
 * Can be used by diagram, branding, and business plan generation components
 */
@Injectable({
  providedIn: 'root',
})
export class GenerationService {
  private readonly sseService = inject(SSEService);

  constructor() {}

  /**
   * Start generation process with SSE for real-time updates
   * @param config SSE connection configuration
   * @param serviceType Type of service (diagram, branding, business-plan)
   * @param destroy$ Subject for cleanup
   * @returns Observable with generation state updates
   */
  startGeneration(
    config: SSEConnectionConfig,
    serviceType: SSEServiceEventType,
    destroy$: Subject<void>
  ): Observable<SSEGenerationState> {
    console.log(`Starting ${serviceType} generation with SSE...`);

    // Create initial state signal
    const generationState = signal<SSEGenerationState>(this.createInitialState());

    return this.sseService.createConnection(config, serviceType).pipe(
      takeUntil(destroy$),
      map((sseEvent: SSEStepEvent) => {
        const currentState = generationState();
        const newState = this.updateGenerationState(currentState, sseEvent);
        generationState.set(newState);
        return newState;
      })
    );
  }

  /**
   * Cancel generation for a specific service type
   * @param serviceType Type of service to cancel
   * @param cancelUrl Optional cancel URL
   */
  cancelGeneration(serviceType: SSEServiceEventType, cancelUrl?: string): void {
    this.sseService.cancelGeneration(serviceType, cancelUrl);
  }

  /**
   * Close connection for a specific service type
   * @param serviceType Type of service to close connection for
   */
  closeConnection(serviceType: SSEServiceEventType): void {
    this.sseService.closeConnection(serviceType);
  }

  /**
   * Create initial generation state
   */
  private createInitialState(): SSEGenerationState {
    return {
      steps: [],
      currentStep: null,
      isGenerating: true,
      error: null,
      completed: false,
      totalSteps: 0,
      completedSteps: 0
    };
  }

  /**
   * Update generation state based on SSE event
   * Handles both new backend format (steps_list) and legacy format (started/completed)
   */
  private updateGenerationState(
    currentState: SSEGenerationState, 
    event: SSEStepEvent
  ): SSEGenerationState {
    const newState = { ...currentState };

    switch (event.type) {
      case 'steps_list':
        // Handle new backend format with list of steps
        if (event.steps) {
          console.log('Received steps list from backend:', event.steps);
          newState.steps = event.steps;
          newState.totalSteps = event.steps.length;
          newState.completedSteps = event.steps.filter(step => step.status === 'completed').length;
          newState.currentStep = event.steps.find(step => step.status === 'in-progress') || null;
          newState.isGenerating = newState.completedSteps < newState.totalSteps;
          newState.completed = newState.completedSteps === newState.totalSteps;
          newState.error = null;
        }
        break;

      case 'started':
        // Handle individual step started (backward compatibility)
        if (event.stepName) {
          const existingStepIndex = newState.steps.findIndex(step => step.stepName === event.stepName);
          const newStep: SSEStep = {
            stepName: event.stepName,
            status: 'in-progress',
            timestamp: event.timestamp,
            summary: event.summary || '',
            content: event.data
          };

          if (existingStepIndex >= 0) {
            newState.steps[existingStepIndex] = newStep;
          } else {
            newState.steps.push(newStep);
          }

          newState.currentStep = newStep;
          newState.isGenerating = true;
          newState.totalSteps = Math.max(newState.totalSteps, newState.steps.length);
        }
        break;

      case 'completed':
        // Handle individual step completed (backward compatibility)
        if (event.stepName) {
          const existingStepIndex = newState.steps.findIndex(step => step.stepName === event.stepName);
          const completedStep: SSEStep = {
            stepName: event.stepName,
            status: 'completed',
            timestamp: event.timestamp,
            summary: event.summary || '',
            content: event.data
          };

          if (existingStepIndex >= 0) {
            newState.steps[existingStepIndex] = completedStep;
          } else {
            newState.steps.push(completedStep);
          }

          newState.completedSteps = newState.steps.filter(step => step.status === 'completed').length;
          newState.currentStep = newState.steps.find(step => step.status === 'in-progress') || null;
          newState.totalSteps = Math.max(newState.totalSteps, newState.steps.length);
          
          // Check if all steps are completed
          if (newState.currentStep === null && newState.steps.length > 0) {
            newState.isGenerating = false;
            newState.completed = true;
          }
        }
        break;

      default:
        console.warn('Unknown SSE event type:', event.type);
        break;
    }

    return newState;
  }

  /**
   * Calculate progress percentage
   * @param state Current generation state
   * @returns Progress percentage (0-100)
   */
  calculateProgress(state: SSEGenerationState): number {
    return state.totalSteps > 0 ? Math.round((state.completedSteps / state.totalSteps) * 100) : 0;
  }

  /**
   * Get completed steps from state
   * @param state Current generation state
   * @returns Array of completed steps
   */
  getCompletedSteps(state: SSEGenerationState): SSEStep[] {
    return state.steps.filter(step => step.status === 'completed');
  }

  /**
   * Check if generation has completed steps
   * @param state Current generation state
   * @returns True if there are completed steps
   */
  hasCompletedSteps(state: SSEGenerationState): boolean {
    return this.getCompletedSteps(state).length > 0;
  }

  /**
   * Get current step from state
   * @param state Current generation state
   * @returns Current step or null
   */
  getCurrentStep(state: SSEGenerationState): SSEStep | null {
    return state.currentStep;
  }

  /**
   * Check if generation is in progress
   * @param state Current generation state
   * @returns True if generation is in progress
   */
  isGenerating(state: SSEGenerationState): boolean {
    return state.isGenerating;
  }

  /**
   * Check if generation is completed
   * @param state Current generation state
   * @returns True if generation is completed
   */
  isCompleted(state: SSEGenerationState): boolean {
    return state.completed;
  }

  /**
   * Get generation error
   * @param state Current generation state
   * @returns Error message or null
   */
  getError(state: SSEGenerationState): string | null {
    return state.error;
  }
}
