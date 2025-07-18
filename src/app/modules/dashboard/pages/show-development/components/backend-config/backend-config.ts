import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TechCardComponent } from '../shared/tech-card';

@Component({
  selector: 'app-backend-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TechCardComponent],
  templateUrl: './backend-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendConfigComponent {
  // Input properties
  readonly backendForm = input.required<FormGroup>();
  readonly versionOptions = input.required<{
    [key: string]: { [key: string]: string[] };
  }>();
  readonly showAdvancedOptions = input.required<boolean>();

  // State signals
  protected readonly advancedOptionsVisibleFor = signal<string | null>(null);

  /**
   * Backend framework options
   */
  protected readonly backendFrameworks = [
    {
      id: 'nodejs',
      name: 'Node.js',
      icon: '🟢',
      color: '#68a063',
      description: 'JavaScript runtime for server-side applications',
      badges: ['Express', 'NestJS', 'Fastify'],
    },
    {
      id: 'python',
      name: 'Python',
      icon: '🐍',
      color: '#3776AB',
      description: 'Versatile language with rich ecosystem',
      badges: ['Flask', 'Django', 'FastAPI'],
    },
    {
      id: 'java',
      name: 'Java',
      icon: '☕',
      color: '#007396',
      description: 'Robust enterprise-grade framework',
      badges: ['Spring Boot', 'Jakarta EE', 'Quarkus'],
    },
    {
      id: 'dotnet',
      name: '.NET',
      icon: '🔷',
      color: '#512BD4',
      description: 'Modern cross-platform development',
      badges: ['ASP.NET Core', 'Entity Framework', 'Blazor'],
    },
    {
      id: 'ruby',
      name: 'Ruby',
      icon: '💎',
      color: '#CC342D',
      description: 'Developer-friendly language with elegant syntax',
      badges: ['Rails', 'Sinatra', 'Hanami'],
    },
    {
      id: 'php',
      name: 'PHP',
      icon: '🐘',
      color: '#777BB3',
      description: 'Popular language for web development',
      badges: ['Laravel', 'Symfony', 'WordPress'],
    },
  ];

  /**
   * API types
   */
  protected readonly apiTypes = [
    {
      id: 'rest',
      name: 'REST API',
      icon: '🔄',
      description: 'Standard HTTP-based API architecture',
    },
    {
      id: 'graphql',
      name: 'GraphQL',
      icon: '◢',
      description: 'Query language for your API',
    },
    {
      id: 'grpc',
      name: 'gRPC',
      icon: '📡',
      description: 'High-performance RPC framework',
    },
    {
      id: 'websocket',
      name: 'WebSockets',
      icon: '🔌',
      description: 'Real-time bidirectional communication',
    },
  ];

  /**
   * Toggle advanced options visibility for the specified framework
   */
  protected toggleAdvancedOptions(frameworkId: string): void {
    this.advancedOptionsVisibleFor.update((current) =>
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
   * Get versions for the selected framework
   */
  protected getFrameworkVersions(): string[] {
    const selectedFramework = this.backendForm()?.get('framework')?.value;
    // Handle nested structure of versionOptions
    if (selectedFramework && this.versionOptions()[selectedFramework]) {
      // Get versions from the first category key or return default
      const categories = Object.keys(this.versionOptions()[selectedFramework]);
      if (categories.length > 0) {
        return (
          this.versionOptions()[selectedFramework][categories[0]] || ['latest']
        );
      }
    }
    return ['latest'];
  }
}
