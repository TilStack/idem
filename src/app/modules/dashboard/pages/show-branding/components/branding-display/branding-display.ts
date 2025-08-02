import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { generatePdf } from '../../../../../../utils/pdf-generator';
import { SafeHtmlPipe } from '../../../projects-list/safehtml.pipe';
import { BrandIdentityModel } from '../../../../models/brand-identity.model';

@Component({
  selector: 'app-branding-display',
  standalone: true,
  imports: [SafeHtmlPipe],
  templateUrl: './branding-display.html',
  styleUrl: './branding-display.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandingDisplayComponent {
  readonly branding = input.required<BrandIdentityModel | null>();

  protected makePdf(): void {
    if (this.branding()?.sections) {
      const content = this.branding()!
        .sections.map((section: any) => section.data)
        .join('\n\n');
      generatePdf(content, true);
    }
  }
}
