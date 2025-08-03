import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DiagramsService } from '../../../../services/ai-agents/diagrams.service';
import { DiagramModel } from '../../../../models/diagram.model';
import { GenerationService } from '../../../../../../shared/services/generation.service';
import {
  SSEGenerationState,
  SSEConnectionConfig,
} from '../../../../../../shared/models/sse-step.model';
import { generatePdf } from '../../../../../../utils/pdf-generator';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-diagram-generation',
  standalone: true,
  imports: [
    CommonModule,
    MarkdownModule,
    SkeletonModule,
    CardModule,
    ProgressBarModule,
    ButtonModule,
    TagModule,
  ],
  templateUrl: './diagram-generation.html',
  styleUrls: ['./diagram-generation.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramGeneration implements OnInit, OnDestroy {
  private readonly diagramsService = inject(DiagramsService);
  private readonly generationService = inject(GenerationService);
  private readonly destroy$ = new Subject<void>();

  // ViewChild for scroll container
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  // Input for project ID
  readonly projectId = input.required<string>();

  // Generation state signal
  protected readonly generationState = signal<SSEGenerationState>({
    steps: [],
    currentStep: null,
    isGenerating: false,
    error: null,
    completed: false,
    totalSteps: 0,
    completedSteps: 0,
    stepsInProgress: [],
    completedStepNames: [],
  });

  protected readonly finalDiagram = signal<DiagramModel | null>(null);

  // Environment URL
  protected readonly diagenUrl = environment.services.diagen.url;

  // Computed properties using the new generation state
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
  protected readonly isCompleted = computed(
    () => this.generationState().completed
  );
  protected readonly progressPercentage = computed(() =>
    this.generationService.calculateProgress(this.generationState())
  );

  // Computed-like getters
  protected hasCompletedSteps(): boolean {
    return this.generationService.hasCompletedSteps(this.generationState());
  }

  protected totalSteps(): number {
    return this.generationState().totalSteps;
  }

  ngOnInit(): void {
    // Auto-start generation when component loads
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Generate new diagrams using SSE for real-time updates
   */
  protected generateDiagrams(): void {
    if (!this.projectId()) {
      console.error('Project ID not found');
      return;
    }

    // Reset state for new generation
    this.resetGenerationState();
    console.log('Starting diagram generation with SSE...');

    const config: SSEConnectionConfig = {
      url: `${
        environment.services.api.url
      }/project/diagrams/generate-stream/${this.projectId()}`,
      keepAlive: true,
      reconnectionDelay: 1000,
    };

    this.generationService
      .startGeneration(config, 'diagram', this.destroy$)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state: SSEGenerationState) => {
          console.log('Generation state updated:', state);
          this.generationState.set(state);

          // Check if generation is completed - handle both scenarios
          if (state.completed) {
            if (state.finalData) {
              // Complete event with full payload
              this.completeGeneration(state.finalData);
            } else if (state.steps.length > 0) {
              // Fallback: use individual completed steps
              this.completeGenerationFromSteps(state.steps);
            }
          }
        },
        error: (err) => {
          console.error(
            `Error generating diagrams for project ID: ${this.projectId()}:`,
            err
          );
          this.generationState.update((state) => ({
            ...state,
            error: 'Failed to generate diagrams',
            isGenerating: false,
          }));
        },
        complete: () => {
          console.log('Diagram generation completed');
          // Force completion if stream ends without explicit completion event
          this.generationState.update((state) => {
            if (state.isGenerating && state.completedStepNames.length > 0 && state.stepsInProgress.length === 0) {
              console.log('Forcing completion due to stream end');
              return {
                ...state,
                isGenerating: false,
                completed: true,
                currentStep: null,
              };
            }
            return state;
          });
          
          // Trigger completion if we have completed steps
          const currentState = this.generationState();
          if (currentState.steps.length > 0 && !currentState.completed) {
            this.completeGenerationFromSteps(currentState.steps);
          }
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
      completedSteps: 0,
      stepsInProgress: [],
      completedStepNames: [],
    });
    this.finalDiagram.set(null);
  }

  /**
   * Complete the generation process and create final diagram
   */
  private completeGeneration(diagramPayload: any): void {
    console.log('Processing final diagram payload:', diagramPayload);
    
    if (diagramPayload && diagramPayload.sections) {
      // Extract only the diagram sections (not progress events)
      const diagramSections = diagramPayload.sections.filter(
        (section: any) => section.type === 'text/markdown' && 
                          section.name !== 'progress' && 
                          section.name !== 'completion'
      );
      
      // Combine all diagram content
      const combinedContent = diagramSections
        .map((section: any) => section.data)
        .join('\n\n');
      
      // Create final diagram model
      const finalDiagram: DiagramModel = {
        id: diagramPayload.id || `diagram-${Date.now()}`,
        title: 'Generated Diagram',
        content: combinedContent,
        sections: diagramSections.map((section: any) => ({
          id: `section-${section.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: section.name,
          type: 'generated',
          data: section.data,
          summary: section.summary,
        })),
        createdAt: diagramPayload.createdAt ? new Date(diagramPayload.createdAt._seconds * 1000) : new Date(),
        updatedAt: diagramPayload.updatedAt ? new Date(diagramPayload.updatedAt._seconds * 1000) : new Date(),
      };
      
      console.log('Final diagram created:', finalDiagram);
      this.finalDiagram.set(finalDiagram);
    }
    
    // Auto-scroll to bottom after completion
    setTimeout(() => this.scrollToBottom(), 100);
  }

  /**
   * Complete generation from individual completed steps (fallback method)
   */
  private completeGenerationFromSteps(steps: any[]): void {
    console.log('Processing completion from individual steps:', steps);
    
    // Filter only completed steps with content
    const completedSteps = steps.filter(
      (step: any) => step.status === 'completed' && step.content && step.content !== 'step_started'
    );
    
    if (completedSteps.length > 0) {
      // Combine all diagram content
      const combinedContent = completedSteps
        .map((step: any) => step.content)
        .join('\n\n');
      
      // Create final diagram model
      const finalDiagram: DiagramModel = {
        id: `diagram-${Date.now()}`,
        title: 'Generated Diagram',
        content: combinedContent,
        sections: completedSteps.map((step: any) => ({
          id: `section-${step.stepName.replace(/\s+/g, '-').toLowerCase()}`,
          name: step.stepName,
          type: 'generated',
          data: step.content,
          summary: step.summary,
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Final diagram created from steps:', finalDiagram);
      this.finalDiagram.set(finalDiagram);
    }
    
    // Auto-scroll to bottom after completion
    setTimeout(() => this.scrollToBottom(), 100);
  }

  /**
   * Download PDF of the generated diagram
   */
  protected downloadPdf(): void {
    const diagram = this.finalDiagram();
    if (diagram && diagram.content) {
      generatePdf(diagram.content);
    }
  }

  /**
   * Cancel ongoing diagram generation
   */
  protected cancelGeneration(): void {
    this.generationService.cancelGeneration('diagram');
    this.generationState.update((state) => ({
      ...state,
      isGenerating: false,
      error: 'Generation cancelled',
    }));
  }

  /**
   * Auto-scroll to bottom of the container
   */
  private scrollToBottom(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTo({
        top: this.scrollContainer.nativeElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }
}
