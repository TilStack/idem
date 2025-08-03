import { inject, Injectable, signal } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { SseClient } from 'ngx-sse-client';
import {
  SSEStepEvent,
  SSEStep,
  SSEGenerationState,
  SSEConnectionConfig,
  SSEServiceEventType,
} from '../models/sse-step.model';

@Injectable({
  providedIn: 'root',
})
export class SSEService {
  private readonly sseClient = inject(SseClient);

  // Track active connections by service type
  private activeConnections = new Map<SSEServiceEventType, any>();
  private destroySubjects = new Map<SSEServiceEventType, Subject<void>>();

  constructor() {}

  /**
   * Create SSE connection for real-time updates
   * @param config SSE connection configuration
   * @param serviceType Type of service (diagram, branding, business-plan)
   * @returns Observable with SSE events
   */
  createConnection(
    config: SSEConnectionConfig,
    serviceType: SSEServiceEventType
  ): Observable<SSEStepEvent> {
    console.log(`Starting ${serviceType} SSE connection to:`, config.url);

    // Close any existing connection for this service type
    this.closeConnection(serviceType);

    // Create destroy subject for this connection
    const destroySubject = new Subject<void>();
    this.destroySubjects.set(serviceType, destroySubject);

    return new Observable<SSEStepEvent>((observer) => {
      // Create SSE connection using ngx-sse-client
      const subscription = this.sseClient
        .stream(config.url, {
          keepAlive: config.keepAlive ?? true,
          reconnectionDelay: config.reconnectionDelay ?? 1000,
        })
        .pipe(
          takeUntil(destroySubject),
          catchError((error) => {
            console.error(`${serviceType} SSE connection error:`, error);
            this.closeConnection(serviceType);
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (event: Event) => {
            try {
              const messageEvent = event as MessageEvent;

              // Validate message data before parsing
              if (!this.isValidMessage(messageEvent.data)) {
                console.log(
                  `Received empty or invalid ${serviceType} SSE message, ignoring:`,
                  messageEvent.data
                );
                observer.complete();
                this.closeConnection(serviceType);
                return;
              }

              // Handle completion message
              if (this.isCompletionMessage(messageEvent.data)) {
                console.log(`${serviceType} SSE stream completed`);
                observer.complete();
                this.closeConnection(serviceType);
                return;
              }

              const data: SSEStepEvent = JSON.parse(messageEvent.data);
              console.log(`${serviceType} SSE message received:`, data);

              // Validate the parsed data structure
              if (!this.isValidSSEEvent(data)) {
                console.log(
                  `Invalid ${serviceType} SSE data structure, ignoring:`,
                  data
                );
                return;
              }

              // Process the event based on type
              const processedEvent = this.processSSEEvent(data, serviceType);

              // Emit the event to the component
              observer.next(processedEvent);
            } catch (error) {
              console.error(
                `Error parsing ${serviceType} SSE message:`,
                error,
                'Raw data:',
                (event as MessageEvent).data
              );
              // Don't propagate parsing errors - just log them and continue
            }
          },
          error: (error) => {
            console.error(`${serviceType} SSE subscription error:`, error);
            this.closeConnection(serviceType);
            observer.error(error);
          },
          complete: () => {
            console.log(`${serviceType} SSE subscription completed`);
            this.closeConnection(serviceType);
            observer.complete();
          },
        });

      // Store the subscription
      this.activeConnections.set(serviceType, subscription);
    });
  }

  /**
   * Close SSE connection for a specific service type
   * @param serviceType Type of service to close connection for
   */
  closeConnection(serviceType: SSEServiceEventType): void {
    // Complete the destroy subject to clean up the connection
    const destroySubject = this.destroySubjects.get(serviceType);
    if (destroySubject) {
      destroySubject.next();
      destroySubject.complete();
      this.destroySubjects.delete(serviceType);
    }

    // Unsubscribe from the connection
    const subscription = this.activeConnections.get(serviceType);
    if (subscription) {
      subscription.unsubscribe();
      this.activeConnections.delete(serviceType);
      console.log(`${serviceType} SSE connection closed`);
    }
  }

  /**
   * Close all active SSE connections
   */
  closeAllConnections(): void {
    for (const serviceType of this.activeConnections.keys()) {
      this.closeConnection(serviceType);
    }
  }

  /**
   * Cancel generation for a specific service type
   * @param serviceType Type of service to cancel
   * @param cancelUrl URL to call for cancellation
   */
  cancelGeneration(serviceType: SSEServiceEventType, cancelUrl?: string): void {
    console.log(`Cancelling ${serviceType} generation...`);
    this.closeConnection(serviceType);

    // If cancel URL is provided, make a request to cancel on the backend
    if (cancelUrl) {
      // This would typically be handled by the specific service
      console.log(`Cancel URL for ${serviceType}:`, cancelUrl);
    }
  }

  /**
   * Validate if message data is valid
   */
  private isValidMessage(data: any): boolean {
    return (
      data &&
      data !== 'undefined' &&
      typeof data === 'string' &&
      data.trim() !== ''
    );
  }

  /**
   * Check if message indicates completion
   */
  private isCompletionMessage(data: any): boolean {
    try {
      const parsed = JSON.parse(data);
      return parsed.type === 'complete' || parsed.type === 'completed';
    } catch {
      return false;
    }
  }

  /**
   * Validate SSE event structure
   */
  private isValidSSEEvent(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      (data.type === 'progress' ||
        data.type === 'completed' ||
        data.type === 'completion' ||
        data.type === 'complete') &&
      (typeof data.timestamp === 'string' || data.type === 'complete')
    );
  }

  /**
   * Process SSE event and handle different types
   */
  private processSSEEvent(
    data: SSEStepEvent,
    serviceType: SSEServiceEventType
  ): SSEStepEvent {
    // Handle individual step events (backward compatibility)
    if (data.type === 'progress' || data.type === 'completed' || data.type === 'completion' || data.type === 'complete') {
      return data;
    }

    return data;
  }

  /**
   * Create initial generation state
   */
  createInitialState(): SSEGenerationState {
    return {
      steps: [],
      currentStep: null,
      isGenerating: false,
      error: null,
      completed: false,
      totalSteps: 0,
      completedSteps: 0,
      stepsInProgress: [],
      completedStepNames: [],
    };
  }

  /**
   * Update generation state based on SSE event
   */
  updateGenerationState(
    currentState: SSEGenerationState,
    event: SSEStepEvent
  ): SSEGenerationState {
    const newState = { ...currentState };

    switch (event.type) {
      case 'progress':
        // Handle individual step started (backward compatibility)
        if (event.stepName) {
          const existingStepIndex = newState.steps.findIndex(
            (step) => step.stepName === event.stepName
          );
          const newStep: SSEStep = {
            stepName: event.stepName,
            status: 'progress',
            timestamp: event.timestamp || new Date().toISOString(),
            summary: event.summary || '',
            content: event.data,
          };

          if (existingStepIndex >= 0) {
            newState.steps[existingStepIndex] = newStep;
          } else {
            newState.steps.push(newStep);
          }

          newState.currentStep = newStep;
          newState.isGenerating = true;
        }
        break;

      case 'completed':
        // Handle individual step completed (backward compatibility)
        if (event.stepName) {
          const existingStepIndex = newState.steps.findIndex(
            (step) => step.stepName === event.stepName
          );
          const completedStep: SSEStep = {
            stepName: event.stepName,
            status: 'completed',
            timestamp: event.timestamp || new Date().toISOString(),
            summary: event.summary || '',
            content: event.data,
          };

          if (existingStepIndex >= 0) {
            newState.steps[existingStepIndex] = completedStep;
          } else {
            newState.steps.push(completedStep);
          }

          newState.completedSteps = newState.steps.filter(
            (step) => step.status === 'completed'
          ).length;
          newState.currentStep =
            newState.steps.find((step) => step.status === 'progress') || null;

          // Check if all steps are completed
          if (newState.currentStep === null && newState.steps.length > 0) {
            newState.isGenerating = false;
            newState.completed = true;
          }
        }
        break;
    }

    return newState;
  }
}
