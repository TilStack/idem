import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../../auth/services/auth.service';
import { DiagramModel } from '../../models/diagram.model';
import { first, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DiagramsService } from '../../services/ai-agents/diagrams.service';
import { CookieService } from '../../../../shared/services/cookie.service';
import { generatePdf } from '../../../../utils/pdf-generator';

@Component({
  selector: 'app-show-diagrams',
  imports: [MarkdownComponent, CommonModule],
  templateUrl: './show-diagrams.html',
  styleUrl: './show-diagrams.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowDiagramsComponent implements OnInit, OnDestroy {
  // Injected services
  private readonly diagramsService = inject(DiagramsService);
  private readonly auth = inject(AuthService);
  private readonly cookiesService = inject(CookieService);

  // Destruction subject for cleanup
  private readonly destroy$ = new Subject<void>();

  // Local state signals
  protected readonly projectIdFromCookie = signal<string | null>(null);
  protected readonly currentUser = signal<User | null>(null);
  protected readonly isDiagramsLoaded = signal(true);

  // Computed signals from service state - new step-based approach
  protected readonly generationState = computed(() =>
    this.diagramsService.generationState()
  );
  protected readonly completedSteps = computed(
    () => this.generationState().steps
  );
  protected readonly currentStep = computed(
    () => this.generationState().currentStep
  );
  protected readonly isGenerating = computed(
    () => this.generationState().isGenerating
  );
  protected readonly generationError = computed(
    () => this.generationState().error
  );
  protected readonly isCompleted = computed(
    () => this.generationState().completed
  );

  // Legacy computed signals for backward compatibility
  protected readonly diagram = computed(() =>
    this.diagramsService.diagramState()
  );
  protected readonly generationProgress = computed(() =>
    this.diagramsService.generationProgress()
  );
  protected readonly generationStatus = computed(() =>
    this.diagramsService.generationStatus()
  );

  // Computed derived state
  protected readonly isDiagramExists = computed(() => {
    const diagramData = this.diagram();
    return (
      diagramData !== null &&
      diagramData.content &&
      diagramData.content.length > 0
    );
  });

  protected readonly formattedDiagram = computed(() => {
    const diagramData = this.diagram();
    if (!diagramData || !diagramData.content) return null;

    return {
      ...diagramData,
      content: diagramData.content,
    };
  });

  // New computed properties for step-based UI
  protected readonly hasCompletedSteps = computed(
    () => this.completedSteps().length > 0
  );
  protected readonly totalSteps = computed(
    () => this.completedSteps().length + (this.currentStep() ? 1 : 0)
  );
  protected readonly progressPercentage = computed(() => {
    const completed = this.completedSteps().length;
    const total = Math.max(6, completed + (this.currentStep() ? 1 : 0)); // Assume 6 total steps
    return Math.round((completed / total) * 100);
  });

  protected readonly diagenUrl = environment.services.diagen.url;

  constructor() {
    this.projectIdFromCookie.set(this.cookiesService.get('projectId'));

    // Effect to automatically update UI when diagram state changes
    effect(() => {
      const diagramData = this.diagram();
      const isGen = this.isGenerating();
      const progress = this.generationProgress();
      const status = this.generationStatus();
      const error = this.generationError();

      console.log('Diagram state updated:', {
        diagram: diagramData,
        isGenerating: isGen,
        progress,
        status,
        error,
      });

      // Update loading state based on generation status
      if (!isGen && (diagramData || error)) {
        this.isDiagramsLoaded.set(false);
      }
    });
  }

  ngOnInit(): void {
    try {
      this.isDiagramsLoaded.set(true);

      // Subscribe to user authentication
      this.auth.user$
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe((user) => {
          if (user) {
            this.currentUser.set(user);
          } else {
            console.log('User not logged in');
            return;
          }
        });

      // Load existing diagram if project ID exists
      if (this.projectIdFromCookie() == null) {
        console.log('Project ID not found');
        this.isDiagramsLoaded.set(false);
        return;
      } else {
        this.loadExistingDiagram();
      }
    } catch (error) {
      console.error('Error while loading project or user', error);
      this.isDiagramsLoaded.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Note: Service state will be reset automatically on next generation
  }

  /**
   * Load existing diagram for the project
   */
  private loadExistingDiagram(): void {
    this.diagramsService
      .getDiagram(this.projectIdFromCookie()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diagramData) => {
          // Set the diagram state in the service
          this.diagramsService.diagramState.set(diagramData);
          console.log('Existing diagram loaded:', diagramData);
          this.isDiagramsLoaded.set(false);
        },
        error: (err) => {
          console.error(
            `Error fetching diagrams for project ID: ${this.projectIdFromCookie()}:`,
            err
          );
          this.diagramsService.diagramState.set(null);
          this.isDiagramsLoaded.set(false);
        },
      });
  }

  /**
   * Generate PDF from current diagram
   */
  protected makePdf(): void {
    const diagramData = this.formattedDiagram();
    if (diagramData && diagramData.sections) {
      const diagramContent = diagramData.sections
        .map((section) => section.data || '')
        .join('\n');
      generatePdf(diagramContent);
    }
  }

  /**
   * Generate new diagrams using SSE for real-time updates
   */
  protected generateDiagrams(): void {
    if (!this.projectIdFromCookie()) {
      console.error('Project ID not found');
      return;
    }

    this.isDiagramsLoaded.set(true);
    console.log('Starting diagram generation with SSE...');

    this.diagramsService
      .createDiagramModel(this.projectIdFromCookie()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diagramData) => {
          console.log('Diagram generation completed:', diagramData);
          // State is already managed by the service signals
          // The UI will automatically update through computed signals
        },
        error: (err) => {
          console.error(
            `Error generating diagrams for project ID: ${this.projectIdFromCookie()}:`,
            err
          );
          // Error state is already managed by the service signals
        },
      });
  }

  /**
   * Cancel ongoing diagram generation
   */
  protected cancelGeneration(): void {
    // Note: SSE connection will be closed automatically by the service
    // when the component is destroyed or a new generation starts
    this.isDiagramsLoaded.set(false);
  }
}
