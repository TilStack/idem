import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntil, first } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DiagramsService } from '../../services/ai-agents/diagrams.service';
import { AuthService } from '../../../auth/services/auth.service';
import { CookieService } from '../../../../shared/services/cookie.service';
import { User } from '@angular/fire/auth';
import { DiagramModel } from '../../models/diagram.model';
import { DiagramDisplay } from './components/diagram-display/diagram-display';
import { DiagramGeneration } from './components/diagram-generation/diagram-generation';

@Component({
  selector: 'app-show-diagrams',
  standalone: true,
  imports: [CommonModule, DiagramDisplay, DiagramGeneration],
  templateUrl: './show-diagrams.html',
  styleUrls: ['./show-diagrams.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowDiagramsComponent implements OnInit, OnDestroy {
  // Injected services
  private readonly diagramsService = inject(DiagramsService);
  private readonly auth = inject(AuthService);
  private readonly cookiesService = inject(CookieService);
  private readonly destroy$ = new Subject<void>();

  // Component state signals
  protected readonly projectIdFromCookie = signal<string | null>(null);
  protected readonly currentUser = signal<User | null>(null);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly existingDiagram = signal<DiagramModel | null>(null);
  protected readonly showDisplayComponent = signal<boolean>(false);
  protected readonly showGenerationComponent = signal<boolean>(false);
  protected readonly isDiagramsLoaded = signal<boolean>(false);

  constructor() {
    this.projectIdFromCookie.set(this.cookiesService.get('projectId'));
  }

  ngOnInit(): void {
    try {
      this.isDiagramsLoaded.set(true);

      // Subscribe to user authentication
      this.auth.user$
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe((user: User | null) => {
          if (user) {
            this.currentUser.set(user);
          } else {
            console.log('User not logged in');
            return;
          }
        });

      // Load existing diagram if project ID exists
      if (this.projectIdFromCookie()) {
        this.loadExistingDiagram();
      } else {
        // No project ID, show generation component
        this.showGenerationComponent.set(true);
        this.isLoading.set(false);
      }
    } catch (error) {
      console.error('Error while loading project or user', error);
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load existing diagram for the project
   */
  private loadExistingDiagram(): void {
    this.isDiagramsLoaded.set(true); // Set loading state while fetching
    this.diagramsService
      .getDiagram(this.projectIdFromCookie()!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (diagramData) => {
          console.log('Diagram data loaded:', diagramData);

          if (diagramData && (diagramData.content || diagramData.sections)) {
            // Format section data with code blocks if sections exist
            if (diagramData.sections) {
              diagramData.sections.forEach((section) => {
                section.data = `\`\`\`${section.data}\n\`\`\``;
              });
            }

            // Existing diagram found - show display component
            this.existingDiagram.set(diagramData);
            this.showDisplayComponent.set(true);
            this.showGenerationComponent.set(false);
          } else {
            // No existing diagram - show generation component
            this.showDisplayComponent.set(false);
            this.showGenerationComponent.set(true);
          }

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading diagram:', err);
          // Error loading - show generation component
          this.showDisplayComponent.set(false);
          this.showGenerationComponent.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Start diagram generation process
   */
  protected generateDiagrams(): void {
    if (this.projectIdFromCookie()) {
      this.showDisplayComponent.set(false);
      this.showGenerationComponent.set(true);
    } else {
      console.error('No project ID available');
    }
  }
}
