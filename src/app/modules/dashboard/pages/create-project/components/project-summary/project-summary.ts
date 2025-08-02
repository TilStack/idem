import {
  Component,
  EventEmitter,
  input,
  Input,
  output,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectModel } from '../../../../models/project.model';
import { SafeHtmlPipe } from '../../../projects-list/safehtml.pipe';
import {
  ColorModel,
  TypographyModel,
} from '../../../../models/brand-identity.model';
import { LogoModel } from '../../../../models/logo.model';

@Component({
  selector: 'app-project-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  templateUrl: './project-summary.html',
  styleUrl: './project-summary.css',
})
export class ProjectSummaryComponent {
  // Angular inputs
  project = input.required<ProjectModel>();
  selectedLogo = input.required<string>();
  selectedColor = input.required<string>();
  selectedTypography = input.required<string>();
  logos = input.required<LogoModel[]>();
  colorPalettes = input.required<ColorModel[]>();
  typographyOptions = input.required<TypographyModel[]>();
  privacyPolicyAccepted = input.required<boolean>();
  marketingConsentAccepted = input.required<boolean>();

  // Angular outputs
  privacyPolicyChange = output<boolean>();
  marketingConsentChange = output<boolean>();
  finalizeProject = output<void>();

  protected getSelectedLogo(): LogoModel | undefined {
    const logo = this.logos().find((logo) => logo.id === this.selectedLogo());
    console.log('Selected logo', logo);
    return logo;
  }

  protected getSelectedColor(): ColorModel | undefined {
    const color = this.colorPalettes().find(
      (color) => color.id === this.selectedColor()
    );
    console.log('Selected color', color);
    return color;
  }

  protected getSelectedTypography(): TypographyModel | undefined {
    const typography = this.typographyOptions().find(
      (typo) => typo.id === this.selectedTypography()
    );
    console.log('Selected typography', typography);
    return typography;
  }

  protected onPrivacyPolicyChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.privacyPolicyChange.emit(checkbox.checked);
  }

  protected onMarketingConsentChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.marketingConsentChange.emit(checkbox.checked);
  }

  protected submitProject(): void {
    this.finalizeProject.emit();
  }
}
