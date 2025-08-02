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
import {
  DiagramStep,
  DiagramStepEvent,
} from '../../../../models/diagram-step.model';
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
  private readonly destroy$ = new Subject<void>();

  // ViewChild for scroll container
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  // Input for project ID
  readonly projectId = input.required<string>();

  // Generation state signals
  protected readonly completedSteps = signal<DiagramStep[]>([]);
  protected readonly currentStep = signal<DiagramStep | null>(null);
  protected readonly isGenerating = signal<boolean>(false);
  protected readonly generationError = signal<string | null>(null);
  protected readonly isCompleted = signal<boolean>(false);
  protected readonly generationProgress = signal<number>(0);
  protected readonly generationStatus = signal<string>('');
  protected readonly finalDiagram = signal<DiagramModel | null>(null);

  // Environment URL
  protected readonly diagenUrl = environment.services.diagen.url;

  // Computed-like getters
  protected hasCompletedSteps(): boolean {
    return this.completedSteps().length > 0;
  }

  protected totalSteps(): number {
    return this.completedSteps().length + (this.currentStep() ? 1 : 0);
  }

  protected progressPercentage(): number {
    const completed = this.completedSteps().length;
    const total = Math.max(2, completed + (this.currentStep() ? 1 : 0)); // Assume 6 total steps
    return Math.round((completed / total) * 100);
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

    this.diagramsService
      .createDiagramModel(this.projectId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stepEvent: DiagramStepEvent) => {
          console.log('SSE step event received:', stepEvent);
          this.handleSSEStepEvent(stepEvent);
        },
        error: (err) => {
          console.error(
            `Error generating diagrams for project ID: ${this.projectId()}:`,
            err
          );
          this.generationError.set('Failed to generate diagrams');
          this.isGenerating.set(false);
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
    this.completedSteps.set([]);
    this.currentStep.set(null);
    this.isGenerating.set(true);
    this.generationError.set(null);
    this.isCompleted.set(false);
    this.generationProgress.set(0);
    this.generationStatus.set('Initializing diagram generation...');
    this.finalDiagram.set(null);
  }

  /**
   * Handle SSE step events and update component state
   */
  private handleSSEStepEvent(stepEvent: DiagramStepEvent): void {
    if (stepEvent.type === 'started' || stepEvent.data === 'step_started') {
      // Step started - set as current step
      const newStep: DiagramStep = {
        stepName: stepEvent.stepName,
        status: 'in-progress',
        timestamp: stepEvent.timestamp,
        summary: stepEvent.summary,
      };

      this.currentStep.set(newStep);
      this.generationStatus.set(`Generating ${stepEvent.stepName}...`);
    } else if (
      stepEvent.type === 'completed' &&
      stepEvent.data !== 'step_started'
    ) {
      // Step completed - move to completed steps
      const completedStep: DiagramStep = {
        stepName: stepEvent.stepName,
        status: 'completed',
        content: `\`\`\`${stepEvent.data}\n\`\`\``,
        timestamp: stepEvent.timestamp,
        summary: stepEvent.summary,
      };

      console.log('Completed step:', completedStep.content);

      const updatedSteps = [...this.completedSteps(), completedStep];
      this.completedSteps.set(updatedSteps);
      this.currentStep.set(null);

      this.generationStatus.set(`Completed ${stepEvent.stepName}`);
      this.generationProgress.set((updatedSteps.length / 2) * 100); // Assuming 6 total steps

      // Auto-scroll to bottom after step completion
      setTimeout(() => this.scrollToBottom(), 100);

      // Check if all steps are completed
      if (updatedSteps.length >= 2) {
        this.completeGeneration(updatedSteps);
      }
    }
  }

  /**
   * Complete the generation process and create final diagram
   */
  private completeGeneration(steps: DiagramStep[]): void {
    const finalDiagram: DiagramModel = {
      id: `diagram_${this.projectId()}_${Date.now()}`,
      title: 'Generated Diagrams',
      content: this.combineStepsContent(steps),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.finalDiagram.set(finalDiagram);
    this.isGenerating.set(false);
    this.isCompleted.set(true);
    this.generationProgress.set(100);
    this.generationStatus.set('All diagrams generated successfully!');
  }

  /**
   * Combine all step contents into a single diagram content
   */
  private combineStepsContent(steps: DiagramStep[]): string {
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
    this.diagramsService.cancelGeneration();
    this.isGenerating.set(false);
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
