import {
  ChangeDetectionStrategy,
  Component,
  output,
} from '@angular/core';

@Component({
  selector: 'app-business-plan-creation',
  standalone: true,
  imports: [],
  templateUrl: './business-plan-creation.html',
  styleUrl: './business-plan-creation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessPlanCreationComponent {
  readonly generateRequested = output<void>();

  protected onGenerateClick(): void {
    this.generateRequested.emit();
  }
}
