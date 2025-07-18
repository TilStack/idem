import { 
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TechCardComponent, TechCardModel } from '../shared/tech-card';

@Component({
  selector: 'app-frontend-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, TechCardComponent],
  templateUrl: './frontend-config.html',
  styleUrls: ['./frontend-config.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrontendConfigComponent {
  // Input properties
  readonly frontendForm = input.required<FormGroup>();
  readonly versionOptions = input.required<{[key: string]: {[key: string]: string[]}}>();
  readonly showAdvancedOptions = input.required<boolean>();
  readonly selectedStylingPreferences = input.required<string[]>();
  
  // Output events
  @Output() readonly stylingPreferencesChange = new EventEmitter<string[]>();
  
  // State signals
  protected readonly advancedOptionsVisibleFor = signal<string | null>(null);
  
  // State signals
  
  /**
   * Available frontend frameworks
   */
  protected readonly frontendFrameworks = [
    {
      id: 'angular',
      name: 'Angular',
      icon: '🅰️',
      color: '#DD0031',
      description: 'Powerful framework with reactive programming',
      badges: ['TypeScript', 'RxJS', 'Standalone Components'],
    },
    {
      id: 'react',
      name: 'React',
      icon: '⚛️',
      color: '#61DAFB',
      description: 'Modern React with hooks and context API',
      badges: ['JSX', 'Virtual DOM', 'Component-Based'],
    },
    {
      id: 'nextjs',
      name: 'Next.js',
      icon: '▲',
      color: '#000000',
      description: 'Full-stack React framework with SSR/SSG',
      badges: ['App Router', 'API Routes', 'ISR'],
    },

    {
      id: 'vue',
      name: 'Vue.js',
      icon: '🟢',
      color: '#42b883',
      description: 'Progressive framework with intuitive API',
      badges: ['Composition API', 'SFCs', 'Pinia'],
    },
    {
      id: 'svelte',
      name: 'Svelte',
      icon: '🔥',
      color: '#FF3E00',
      description: 'Compiled framework with minimal runtime',
      badges: ['No Virtual DOM', 'Reactive', 'SvelteKit'],
    },
    {
      id: 'astro',
      name: 'Astro',
      icon: '🚀',
      color: '#FF5D01',
      description: 'Content-focused static site generator',
      badges: ['Island Architecture', 'MPA', 'Zero JS by default'],
    },
  ];

  /**
   * Available styling options
   */
  protected readonly stylingOptions = [
    {
      id: 'tailwind',
      name: 'Tailwind CSS',
      icon: '🌬️',
      description: 'Utility-first CSS framework'
    },
    {
      id: 'scss',
      name: 'SCSS',
      icon: '🎨',
      description: 'CSS with superpowers'
    },
    {
      id: 'styledComponents',
      name: 'Styled Components',
      icon: '💅',
      description: 'CSS-in-JS solution'
    },
    {
      id: 'bootstrap',
      name: 'Bootstrap',
      icon: '🅱️',
      description: 'Responsive component library'
    },
    {
      id: 'mui',
      name: 'Material UI',
      icon: '📦',
      description: 'React components for Material Design'
    },
    {
      id: 'chakra',
      name: 'Chakra UI',
      icon: '✨',
      description: 'Accessible component library'
    }
  ];

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
    
    this.stylingPreferencesChange.emit(currentStyles);
    this.frontendForm().get('styling')?.setValue(currentStyles);
  }
  
  /**
   * Toggle advanced options visibility for the specified framework
   */
  protected toggleAdvancedOptions(frameworkId: string): void {
    this.advancedOptionsVisibleFor.update(current => 
      current === frameworkId ? null : frameworkId
    );
  }
  
  /**
   * Check if advanced options are visible for a specific framework
   */
  protected isAdvancedOptionsVisible(frameworkId: string): boolean {
    return this.advancedOptionsVisibleFor() === frameworkId;
  }
  
  /**
   * Check if a styling preference is selected
   */
  protected isStylingSelected(style: string): boolean {
    return this.selectedStylingPreferences().includes(style);
  }

  /**
   * Get versions for the selected framework
   */
  protected getFrameworkVersions(): string[] {
    const selectedFramework = this.frontendForm().get('framework')?.value;
    // Handle nested structure of versionOptions
    if (selectedFramework && this.versionOptions()![selectedFramework]) {
      // Get versions from the first category key or return default
      const categories = Object.keys(this.versionOptions()[selectedFramework]);
      if (categories.length > 0) {
        return this.versionOptions()[selectedFramework][categories[0]] || ['latest'];
      }
    }
    return ['latest'];
  }
}
