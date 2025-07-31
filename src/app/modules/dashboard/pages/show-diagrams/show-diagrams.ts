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
  
  // Computed signals from service state
  protected readonly diagram = computed(() => this.diagramsService.diagramState());
  protected readonly isGenerating = computed(() => this.diagramsService.isGenerating());
  protected readonly generationProgress = computed(() => this.diagramsService.generationProgress());
  protected readonly generationStatus = computed(() => this.diagramsService.generationStatus());
  protected readonly generationError = computed(() => this.diagramsService.generationError());
  
  // Computed derived state
  protected readonly isDiagramExists = computed(() => {
    const diagramData = this.diagram();
    return diagramData !== null && diagramData.sections && diagramData.sections.length > 0;
  });
  
  protected readonly formattedDiagram = computed(() => {
    const diagramData = this.diagram();
    if (!diagramData || !diagramData.sections) return null;
    
    return {
      ...diagramData,
      sections: diagramData.sections.map(section => ({
        ...section,
        data: `\`\`\`${section.data}\n\`\`\``
      }))
    };
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
        error
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
    // Reset service state when component is destroyed
    this.diagramsService.resetGenerationState();
  }

  /**
   * Load existing diagram for the project
   */
  private loadExistingDiagram(): void {
    this.diagramsService
      .getDiagramModelById(this.projectIdFromCookie()!)
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
    this.diagramsService.resetGenerationState();
    this.isDiagramsLoaded.set(false);
  }
}
