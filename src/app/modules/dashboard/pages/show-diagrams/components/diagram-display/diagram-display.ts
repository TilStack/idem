import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { DiagramModel } from '../../../../models/diagram.model';
import { generatePdf } from '../../../../../../utils/pdf-generator';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-diagram-display',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  templateUrl: './diagram-display.html',
  styleUrls: ['./diagram-display.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramDisplay {
  // Input signal for the diagram data
  readonly diagram = input.required<DiagramModel>();
  
  // Environment URL for external services
  protected readonly diagenUrl = environment.services.diagen.url;

  /**
   * Generate PDF from current diagram
   */
  protected makePdf(): void {
    const diagramData = this.diagram();
    if (diagramData && diagramData.content) {
      generatePdf(diagramData.content);
    } else if (diagramData && diagramData.sections) {
      const diagramContent = diagramData.sections
        .map((section: any) => section.data || '')
        .join('\n');
      generatePdf(diagramContent);
    }
  }

  /**
   * Trigger generation of new diagrams
   */
  protected generateNewDiagrams(): void {
    // Emit event to parent component to handle new generation
    window.location.reload(); // Simple approach - reload to trigger new generation
  }
}
