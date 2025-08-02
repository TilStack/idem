import {
  ChangeDetectionStrategy,
  Component,
  output,
} from '@angular/core';

@Component({
  selector: 'app-branding-creation',
  standalone: true,
  imports: [],
  templateUrl: './branding-creation.html',
  styleUrl: './branding-creation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandingCreationComponent {
  readonly generateRequested = output<void>();

  protected onGenerateClick(): void {
    this.generateRequested.emit();
  }
}
