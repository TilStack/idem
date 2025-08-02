import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { generatePdf } from '../../../../../../utils/pdf-generator';
import { SafeHtmlPipe } from '../../../projects-list/safehtml.pipe';

@Component({
  selector: 'app-business-plan-display',
  standalone: true,
  imports: [SafeHtmlPipe],
  templateUrl: './business-plan-display.html',
  styleUrl: './business-plan-display.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPlanDisplayComponent {
  readonly businessPlan = input.required<any>();

  protected makePdf(): void {
    if (this.businessPlan()?.sections) {
      const content = this.businessPlan().sections
        .map((section: any) => section.data)
        .join('\n\n');
      generatePdf(content, true);
    }
  }
}
