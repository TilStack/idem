import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FrontendConfigComponent } from './components/frontend-config/frontend-config';
import { BackendConfigComponent } from './components/backend-config/backend-config';
import { DatabaseConfigComponent } from './components/database-config/database-config';
import { DeploymentConfigComponent } from './components/deployment-config/deployment-config';
import { environment } from '../../../../../environments/environment';
import { initEmptyObject } from '../../../../utils/init-empty-object';
import { AuthService } from '../../../auth/services/auth.service';
import { AnalysisResultModel } from '../../models/analysisResult.model';
import { ProjectModel } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { Loader } from '../../../../components/loader/loader';
import { DevelopmentConfigsModel } from '../../models/development.model';
import { CookieService } from '../../../../shared/services/cookie.service';
import { User } from '@angular/fire/auth';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-show-development',
  standalone: true,
  imports: [
    Loader,
    CommonModule,
    ReactiveFormsModule,
    FrontendConfigComponent,
    BackendConfigComponent,
    DatabaseConfigComponent,
    DeploymentConfigComponent,
  ],
  templateUrl: './show-development.html',
  styleUrl: './show-development.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowDevelopmentComponent implements OnInit {
  protected readonly tabs = [
    'frontend',
    'backend',
    'database',
    'deployment',
  ] as const;

  // Injectable services - suivant le style guide Angular
  protected readonly auth = inject(AuthService);
  protected readonly user$ = this.auth.user$;
  protected readonly projectService = inject(ProjectService);
  protected readonly cookieService = inject(CookieService);
  protected readonly fb = inject(FormBuilder);

  // State signals - groupés par fonctionnalité
  // - Project state
  protected readonly isLoaded = signal(true);
  protected readonly projectId = signal('');
  protected readonly project = signal<ProjectModel>(
    initEmptyObject<ProjectModel>()
  );

  // - UI state
  protected readonly selectedTab = signal<
    'frontend' | 'backend' | 'database' | 'deployment'
  >('frontend');
  protected readonly showAdvancedOptions = signal<boolean>(false);
  protected readonly selectedStylingPreferences = signal<string[]>([]);

  /**
   * Select a tab in the form
   * @param tab The tab to select
   */
  protected selectTab(
    tab: 'frontend' | 'backend' | 'database' | 'deployment'
  ): void {
    this.selectedTab.set(tab);
  }
  protected readonly formSubmitted = signal(false);
  protected readonly formHasErrors = signal(false);
  protected readonly errorMessages = signal<string[]>([]);

  // UI state
  protected readonly currentUser = signal<User | null>(null);
  protected readonly webgenUrl = environment.services.webgen.url;

  // Form groups for the different configuration sections
  protected readonly developmentForm: FormGroup;
  protected readonly frontendForm: FormGroup;
  protected readonly backendForm: FormGroup;
  protected readonly databaseForm: FormGroup;
  protected readonly deploymentForm: FormGroup;
  protected readonly projectConfigForm: FormGroup;
  protected readonly versionOptions = signal<{
    [key: string]: { [key: string]: string[] };
  }>({});

  /**
   * Redirects to the web generator application with the project ID
   * @param projectId The ID of the project to generate
   */
  protected redirectToWebGenerator(projectId: string): void {
    const generatorUrl = `${this.webgenUrl}/generate/${projectId}`;
    window.location.href = generatorUrl;
  }

  constructor() {
    // Initialize all form groups
    this.frontendForm = this.fb.group({
      framework: ['angular', Validators.required],
      frameworkVersion: ['latest', Validators.required],
      styling: [['tailwind'], Validators.required],
      features: this.fb.group({
        routing: [true],
        componentLibrary: [false],
        testing: [true],
        pwa: [false],
        seo: [true],
      }),
    });

    // Backend form with language first, then framework
    this.backendForm = this.fb.group({
      language: ['python', Validators.required],
      languageVersion: ['latest', Validators.required],
      framework: ['flask', Validators.required],
      frameworkVersion: ['latest', Validators.required],
      apiType: ['rest', Validators.required],
      apiVersion: ['latest', Validators.required],
      orm: ['sqlalchemy'],
      ormVersion: ['latest'],
      features: this.fb.group({
        authentication: [true],
        authorization: [true],
        documentation: [true],
        testing: [true],
        logging: [true],
      }),
    });

    this.databaseForm = this.fb.group({
      provider: ['firebase', Validators.required],
      version: ['latest', Validators.required],
      orm: ['prisma', Validators.required],
      ormVersion: ['latest', Validators.required],
      features: this.fb.group({
        migrations: [true],
        seeders: [true],
        caching: [false],
        replication: [false],
      }),
    });

    this.deploymentForm = this.fb.group({
      platform: ['aws', Validators.required],
      platformVersion: ['Latest', Validators.required],
      serviceType: ['container', Validators.required],
      cicd: ['github', Validators.required],
      cicdVersion: ['Latest'],
      // Advanced deployment options
      environment: ['development', Validators.required],
      scaling: ['horizontal', Validators.required],
      features: this.fb.group({
        monitoring: [true],
        continuousDeployment: [true],
        ssl: [true],
        backups: [false],
        logging: [false],
        scaling: [false],
      }),
    });

    this.projectConfigForm = this.fb.group({
      seoEnabled: [true],
      contactFormEnabled: [false],
      analyticsEnabled: [true],
      i18nEnabled: [false],
      performanceOptimized: [true],
      authentication: [true],
      authorization: [false],
      paymentIntegration: [false],
    });

    this.developmentForm = this.fb.group({
      backendStack: ['', Validators.required],
      frontendStack: ['', Validators.required],
      databaseStack: ['', Validators.required],
      additionalStacks: [[]],
      constraints: [[]],
      frontend: this.frontendForm,
      backend: this.backendForm,
      database: this.databaseForm,
      deployment: this.deploymentForm,
      projectConfig: this.projectConfigForm,
    });
  }

  selectedStackId: string | null = null;

  /**
   * Toggle advanced options visibility
   */
  protected toggleAdvancedOptions(): void {
    this.showAdvancedOptions.update((value) => !value);
  }

  /**
   * Toggle a styling preference in multi-select mode
   */
  protected toggleStylingPreference(style: string): void {
    const currentStyles = [...this.selectedStylingPreferences()];
    const index = currentStyles.indexOf(style);

    if (index === -1) {
      currentStyles.push(style);
    } else {
      currentStyles.splice(index, 1);
    }

    this.selectedStylingPreferences.set(currentStyles);
    this.frontendForm.get('styling')?.setValue(currentStyles);
  }

  /**
   * Update styling preferences from child component
   */
  protected updateStylingPreferences(styles: string[]): void {
    this.selectedStylingPreferences.set(styles);
  }

  /**
   * Check if a styling preference is selected
   */
  protected isStylingSelected(style: string): boolean {
    return this.selectedStylingPreferences().includes(style);
  }

  selectStack(id: string) {
    this.selectedStackId = this.selectedStackId === id ? null : id;
  }

  /**
   * Toggle a configuration option in the form
   */
  protected toggleOption(id: string): void {
    const control = this.projectConfigForm.get(id);
    if (control) {
      control.setValue(!control.value);
    }
  }

  /**
   * Get the current value of a configuration option
   */
  protected getOptionValue(id: string): boolean {
    return this.projectConfigForm.get(id)?.value || false;
  }

  /**
   * Save the development configurations and generate the application
   */
  protected async onSaveConfiguration(): Promise<void> {
    this.formSubmitted.set(true);
    this.errorMessages.set([]);

    // if (this.developmentForm.invalid) {
    //   this.formHasErrors.set(true);
    //   this.errorMessages.set([
    //     'Please complete all required fields in the form',
    //   ]);
    //   return;
    // }

    this.isLoaded.set(true);
    const projectId = this.projectId();

    if (!projectId) {
      this.errorMessages.set(['Project ID not found']);
      this.isLoaded.set(false);
      return;
    }

    try {
      // Get the current project
      const currentProject = this.project();

      // Create the development config from the form data
      const developmentConfig: DevelopmentConfigsModel =
        this.developmentForm.value;

      // Add the development config to the project
      if (!currentProject.analysisResultModel) {
        currentProject.analysisResultModel =
          initEmptyObject<AnalysisResultModel>();
      }

      // Update the project's development configuration
      currentProject.analysisResultModel.development = developmentConfig;

      console.log('Saving development configuration:', developmentConfig);

      // // Update the project in the backend
      // await this.projectService
      //   .updateProject(projectId, currentProject)
      //   .toPromise();

      // // Update local state
      // this.project.set(currentProject);

      // // Show success feedback
      // console.log('Development configuration saved successfully');

      // // Redirect to web generator
      // this.redirectToWebGenerator(projectId);
    } catch (error) {
      console.error('Error saving development configuration:', error);
      this.errorMessages.set(['Failed to save development configuration']);
    } finally {
      this.isLoaded.set(false);
    }
  }


  async ngOnInit(): Promise<void> {
    try {
      this.isLoaded.set(true);

      // Get current user
      const user = await this.auth.user$.pipe(first()).toPromise();
      this.currentUser.set(user!);

      if (!user) {
        console.log('User not logged in');
        return;
      }

      // Get project ID from cookie
      const projectId = this.cookieService.get('projectId');
      if (!projectId) {
        console.log('Project ID not found');
        this.isLoaded.set(false);
        return;
      }

      this.projectId.set(projectId);

      // Fetch project data
      this.projectService.getProjectById(projectId).subscribe({
        next: (project) => {
          if (!project) {
            console.log('Project not found');
            this.isLoaded.set(false);
            return;
          }

          // Initialize analysis result if not present
          if (!project.analysisResultModel) {
            project.analysisResultModel =
              initEmptyObject<AnalysisResultModel>();
          }

          this.project.set(project);

          // If the project already has development configuration, populate the form
          if (project.analysisResultModel?.development) {
            const developmentConfig = project.analysisResultModel.development;
            this.developmentForm.patchValue(developmentConfig);
            console.log(
              'Loaded existing development configuration:',
              developmentConfig
            );
          }

          this.isLoaded.set(false);
        },
        error: (err) => {
          console.error('Error retrieving project:', err);
          this.errorMessages.set(['Failed to load project data']);
          this.isLoaded.set(false);
        },
      });
    } catch (error) {
      console.error('Error loading project or user data:', error);
      this.errorMessages.set(['An unexpected error occurred']);
      this.isLoaded.set(false);
    }
  }
}
