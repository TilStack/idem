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

          // Check if generation is completed
          if (state.completed && state.steps.length > 0) {
            this.completeGeneration(state.steps);
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
    });
    this.finalDiagram.set(null);
  }

  /**
   * Complete the generation process and create final diagram
   */
  private completeGeneration(steps: any[]): void {
    const combinedContent = this.combineStepsContent(steps);

    const finalDiagram: DiagramModel = {
      id: `diagram-${Date.now()}`,
      title: 'Generated Diagram',
      content: combinedContent,
      sections: steps.map((step) => ({
        id: `section-${step.stepName}`,
        name: step.stepName,
        type: 'generated',
        data: step.content || step.summary || '',
        summary: step.summary || '',
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.finalDiagram.set(finalDiagram);

    // Auto-scroll to bottom after completion
    setTimeout(() => this.scrollToBottom(), 100);
  }

  /**
   * Combine all step contents into a single diagram content
   */
  private combineStepsContent(steps: any[]): string {
    return steps
      .filter((step) => step.content && step.content !== 'step_started')
      .map((step) => `## ${step.stepName}\n\n${step.content}`)
      .join('\n\n---\n\n');
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
