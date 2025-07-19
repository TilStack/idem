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
      // Icône Node.js depuis Devicons
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      color: '#68a063',
      description: 'JavaScript runtime for server-side applications',
      badges: ['Express', 'NestJS', 'Fastify'],
      versions: ['20.x', '18.x (LTS)', '16.x', '14.x'],
    },
    {
      id: 'python',
      name: 'Python',
      // Icône Python depuis Devicons
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      color: '#3776AB',
      description: 'Versatile language with rich ecosystem',
      badges: ['Flask', 'Django', 'FastAPI'],
      versions: ['3.12', '3.11', '3.10', '3.9', '3.8'],
    },
    {
      id: 'java',
      name: 'Java',
      // Icône Java (OpenJDK) depuis Devicons
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      color: '#007396',
      description: 'Robust enterprise-grade framework',
      badges: ['Spring Boot', 'Jakarta EE', 'Quarkus'],
      versions: ['21 (LTS)', '17 (LTS)', '11 (LTS)', '8 (LTS)'],
    },
    {
      id: 'dotnet',
      name: '.NET',
      // Icône .NET Core depuis Devicons (représentant la plateforme .NET moderne)
      icon: 'https://dotnet.microsoft.com/blob-assets/images/dotnet-icons/square.png',
      color: '#512BD4',
      description: 'Modern cross-platform development',
      badges: ['ASP.NET Core', 'Entity Framework', 'Blazor'],
      versions: ['8.0 (LTS)', '7.0', '6.0 (LTS)', '5.0'],
    },
    {
      id: 'ruby',
      name: 'Ruby',
      // Icône Ruby depuis Devicons
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
      color: '#CC342D',
      description: 'Developer-friendly language with elegant syntax',
      badges: ['Rails', 'Sinatra', 'Hanami'],
      versions: ['3.3', '3.2', '3.1', '3.0', '2.7'],
    },
    {
      id: 'php',
      name: 'PHP',
      // Icône PHP depuis Devicons
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
      color: '#777BB3',
      description: 'Popular language for web development',
      badges: ['Laravel', 'Symfony', 'WordPress'],
      versions: ['8.3', '8.2', '8.1', '8.0', '7.4'],
    },
  ];

  /**
   * Framework-specific API types and frameworks
   */
  protected readonly frameworkSpecificApis: { [key: string]: any[] } = {
    // Node.js specific API frameworks
    nodejs: [
      {
        id: 'express',
        name: 'Express.js',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/ExpressJS.png',
        description: 'Fast, unopinionated web framework',
        badges: ['Middleware', 'Routing', 'Minimal'],
        versions: ['4.18.x', '4.17.x', '4.16.x'],
      },
      {
        id: 'nestjs',
        name: 'NestJS',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/NestJS.png',
        description: 'Progressive Node.js framework',
        badges: ['TypeScript', 'Angular-like', 'Enterprise'],
        versions: ['10.x', '9.x', '8.x', '7.x'],
      },
      {
        id: 'fastify',
        name: 'Fastify',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Fastify.png',
        description: 'Quick and low overhead web framework',
        badges: ['Performance', 'Schema-based', 'Plugins'],
        versions: ['4.x', '3.x', '2.x'],
      },
      {
        id: 'koa',
        name: 'Koa',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/KoaJS.png',
        description: 'Next generation Node.js framework',
        badges: ['Async/Await', 'Middleware', 'Express successor'],
        versions: ['2.14.x', '2.13.x', '2.12.x'],
      },
    ],

    // Python specific API frameworks
    python: [
      {
        id: 'django',
        name: 'Django',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Django.png',
        description: 'High-level Python web framework',
        badges: ['Batteries-included', 'ORM', 'Admin'],
        versions: ['5.0', '4.2 (LTS)', '3.2 (LTS)'],
      },
      {
        id: 'flask',
        name: 'Flask',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Flask.png',
        description: 'Lightweight WSGI web application framework',
        badges: ['Microframework', 'Extensible', 'Simple'],
        versions: ['2.3.x', '2.2.x', '2.0.x', '1.1.x'],
      },
      {
        id: 'fastapi',
        name: 'FastAPI',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/FastAPI.png',
        description: 'Modern, fast web framework',
        badges: ['High Performance', 'Type Hints', 'OpenAPI'],
        versions: ['0.100.x', '0.95.x', '0.90.x'],
      },
    ],

    // Java specific API frameworks
    java: [
      {
        id: 'spring',
        name: 'Spring Boot',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Spring.png',
        description: 'Java-based framework for microservices',
        badges: ['Enterprise', 'Dependency Injection', 'Opinionated'],
        versions: ['3.2', '3.1', '3.0', '2.7 (LTS)', '2.5'],
      },
      {
        id: 'quarkus',
        name: 'Quarkus',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Quarkus.png',
        description: 'Kubernetes Native Java stack',
        badges: ['Fast Startup', 'Low Memory', 'Container-First'],
        versions: ['3.2', '3.1', '3.0', '2.16'],
      },
      {
        id: 'micronaut',
        name: 'Micronaut',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Micronaut.png',
        description: 'Modern JVM-based framework',
        badges: ['Fast Startup', 'Low Memory', 'Microservices'],
        versions: ['4.1', '4.0', '3.10', '3.9'],
      },
    ],

    // .NET specific API frameworks
    dotnet: [
      {
        id: 'aspnet',
        name: 'ASP.NET Core',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/ASPNETCore.png',
        description: 'Cross-platform .NET framework',
        badges: ['MVC', 'Razor Pages', 'Blazor'],
        versions: ['8.0', '7.0', '6.0 (LTS)', '5.0'],
      },
      {
        id: 'minimal-api',
        name: 'Minimal APIs',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/ASPNET.png',
        description: 'Lightweight HTTP APIs in .NET',
        badges: ['Minimal', 'Fast', 'Low Ceremony'],
        versions: ['8.0', '7.0', '6.0'],
      },
    ],

    // Ruby specific API frameworks
    ruby: [
      {
        id: 'rails',
        name: 'Ruby on Rails',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/RubyOnRails.png',
        description: 'Convention over configuration framework',
        badges: ['Convention', 'Full-stack', 'Rapid Development'],
        versions: ['7.1', '7.0', '6.1', '6.0'],
      },
      {
        id: 'sinatra',
        name: 'Sinatra',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Sinatra.png',
        description: 'DSL for quick web applications',
        badges: ['Lightweight', 'Simple', 'Flexible'],
        versions: ['3.1', '3.0', '2.1', '2.0'],
      },
    ],

    // PHP specific API frameworks
    php: [
      {
        id: 'laravel',
        name: 'Laravel',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Laravel.png',
        description: 'PHP framework for web artisans',
        badges: ['Elegant', 'Expressive', 'Modern'],
        versions: ['11.x', '10.x (LTS)', '9.x', '8.x'],
      },
      {
        id: 'symfony',
        name: 'Symfony',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Symfony.png',
        description: 'Set of reusable PHP components',
        badges: ['Components', 'Flexible', 'Enterprise'],
        versions: ['7.0', '6.4 (LTS)', '6.3', '5.4 (LTS)'],
      },
    ],
  };

  /**
   * Common API types available for all frameworks
   */
  protected readonly commonApiTypes = [
    {
      id: 'rest',
      name: 'REST API',
      icon: 'https://www.opc-router.de/wp-content/uploads/2020/05/REST_socialmedia.jpg',
      description: 'Standard HTTP-based API architecture',
      badges: ['HTTP', 'Resource-based', 'CRUD'],
      versions: ['OpenAPI 3.1', 'OpenAPI 3.0', 'Swagger 2.0'],
    },
    {
      id: 'graphql',
      name: 'GraphQL',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/GraphQL.png',
      description: 'Query language for your API',
      badges: ['Schema', 'Query/Mutation', 'Single Endpoint'],
      versions: ['v16.x', 'v15.x', 'v14.x'],
    },
    {
      id: 'grpc',
      name: 'gRPC',
      icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrQZ7-LJwZI5r0oFtiqFABAfjyqw8bLmwV3g&s',
      description: 'High-performance RPC framework',
      badges: ['Protocol Buffers', 'HTTP/2', 'Streaming'],
      versions: ['v1.60', 'v1.59', 'v1.58'],
    },
    {
      id: 'websocket',
      name: 'WebSockets',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/WebSocket_colored_logo.svg/1200px-WebSocket_colored_logo.svg.png',
      description: 'Real-time bidirectional communication',
      badges: ['Persistent', 'Real-time', 'Low-latency'],
      versions: ['RFC 6455', 'v13', 'v8'],
    },
  ];

  /**
   * Get available API types and frameworks based on selected backend framework
   */
  protected get apiTypes() {
    const selectedFramework = this.backendForm()?.get('framework')?.value;
    const frameworkSpecific = selectedFramework
      ? this.frameworkSpecificApis[selectedFramework] || []
      : [];

    return [...this.commonApiTypes, ...frameworkSpecific];
  }

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

    if (selectedFramework) {
      // Find the selected framework object
      const framework = this.backendFrameworks.find(
        (f) => f.id === selectedFramework
      );
      if (framework && framework.versions && framework.versions.length > 0) {
        return framework.versions;
      }
    }
    return ['latest'];
  }

  /**
   * Get versions for the selected API type
   */
  protected getApiVersions(): string[] {
    const selectedApiType = this.backendForm()?.get('apiType')?.value;
    const selectedFramework = this.backendForm()?.get('framework')?.value;

    if (selectedApiType) {
      // First check in common API types
      let api = this.commonApiTypes.find((a) => a.id === selectedApiType);

      // If not found in common types and we have a framework selected, check framework-specific APIs
      if (
        !api &&
        selectedFramework &&
        this.frameworkSpecificApis[selectedFramework]
      ) {
        api = this.frameworkSpecificApis[selectedFramework].find(
          (a) => a.id === selectedApiType
        );
      }

      if (api && api.versions && api.versions.length > 0) {
        return api.versions;
      }
    }
    return ['latest'];
  }
}
