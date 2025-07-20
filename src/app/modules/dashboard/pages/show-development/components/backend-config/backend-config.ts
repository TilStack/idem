import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TechCardComponent, TechCardModel } from '../shared/tech-card';
import {
  FRAMEWORK_API_TYPES,
  FRAMEWORK_SPECIFIC_ORMS,
  LANGUAGE_FRAMEWORKS,
  PROGRAMMING_LANGUAGES,
} from './datas';

@Component({
  selector: 'app-backend-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TechCardComponent],
  templateUrl: './backend-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendConfigComponent implements OnInit {
  ngOnInit() {
    this.availableFrameworks.set(
      this.languageFrameworks[this.backendForm()?.get('language')?.value] || []
    );
    this.availableApiTypes.set(
      this.frameworkApiTypes[this.backendForm()?.get('framework')?.value] || []
    );
    this.availableOrms.set(
      this.frameworkSpecificOrms[this.backendForm()?.get('framework')?.value] ||
        []
    );
  }

  onProgrammingLanguageTechSelect(event: string): void {
    this.backendForm()?.get('language')?.setValue(event);
    this.availableFrameworks.set(
      this.languageFrameworks[this.backendForm()?.get('language')?.value] || []
    );
    this.availableApiTypes.set(
      this.frameworkApiTypes[this.backendForm()?.get('framework')?.value] || []
    );
    this.availableOrms.set(
      this.frameworkSpecificOrms[this.backendForm()?.get('framework')?.value] ||
        []
    );
  }

  onFrameworkTechSelect(event: string): void {
    this.backendForm()?.get('framework')?.setValue(event);
    this.availableApiTypes.set(
      this.frameworkApiTypes[this.backendForm()?.get('framework')?.value] || []
    );
    this.availableOrms.set(
      this.frameworkSpecificOrms[this.backendForm()?.get('framework')?.value] ||
        []
    );
  }

  onApiTypeTechSelect(event: string): void {
    this.backendForm()?.get('apiType')?.setValue(event);
    this.availableOrms.set(
      this.frameworkSpecificOrms[this.backendForm()?.get('framework')?.value] ||
        []
    );
  }

  onOrmTechSelect(event: string): void {
    this.backendForm()?.get('orm')?.setValue(event);
  }
  // Input properties
  readonly backendForm = input.required<FormGroup>();
  readonly versionOptions = input.required<{
    [key: string]: { [key: string]: string[] };
  }>();
  readonly showAdvancedOptions = input.required<boolean>();

  // State signals
  protected readonly advancedOptionsVisibleFor = signal<string | null>(null);

  public readonly programmingLanguages: TechCardModel[] = PROGRAMMING_LANGUAGES;

  protected readonly languageFrameworks: { [key: string]: TechCardModel[] } =
    LANGUAGE_FRAMEWORKS;

  protected readonly frameworkApiTypes: { [key: string]: TechCardModel[] } =
    FRAMEWORK_API_TYPES;

  protected readonly frameworkSpecificOrms: { [key: string]: TechCardModel[] } =
    FRAMEWORK_SPECIFIC_ORMS;

  readonly availableFrameworks = signal<TechCardModel[]>([]);

  readonly availableApiTypes = signal<TechCardModel[]>([]);

  readonly availableOrms = signal<TechCardModel[]>([]);

  protected toggleAdvancedOptions(frameworkId: string): void {
    this.advancedOptionsVisibleFor.update((current) =>
      current === frameworkId ? null : frameworkId
    );
  }

  protected isAdvancedOptionsVisible(frameworkId: string): boolean {
    return this.advancedOptionsVisibleFor() === frameworkId;
  }

  protected getLanguageVersions(): string[] {
    const selectedLanguage = this.backendForm()?.get('language')?.value;
    if (selectedLanguage) {
      const language = this.programmingLanguages.find(
        (l) => l.id === selectedLanguage
      );
      return language?.versions || ['latest'];
    }
    return ['latest'];
  }

  protected getFrameworkVersions(): string[] {
    const selectedFramework = this.backendForm()?.get('framework')?.value;
    if (selectedFramework) {
      const frameworks = this.availableFrameworks();
      const framework = frameworks.find((f) => f.id === selectedFramework);
      return framework?.versions || ['latest'];
    }
    return ['latest'];
  }

  protected getApiVersions(): string[] {
    const selectedApiType = this.backendForm()?.get('apiType')?.value;
    if (selectedApiType) {
      const apiTypes = this.availableApiTypes();
      const apiType = apiTypes.find((a) => a.id === selectedApiType);
      return apiType?.versions || ['latest'];
    }
    return ['latest'];
  }

  protected getOrmVersions(): string[] {
    const selectedOrm = this.backendForm()?.get('orm')?.value;
    if (selectedOrm) {
      const orms = this.availableOrms();
      const orm = orms.find((o) => o.id === selectedOrm);
      return orm?.versions || ['latest'];
    }
    return ['latest'];
  }
}
