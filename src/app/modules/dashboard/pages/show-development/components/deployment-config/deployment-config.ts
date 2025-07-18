import { 
  ChangeDetectionStrategy,
  Component,
  input,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-deployment-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './deployment-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentConfigComponent {
  // Input properties
  readonly deploymentForm = input<FormGroup>();
  readonly showAdvancedOptions = input<boolean>();

  /**
   * Deployment options
   */
  protected readonly deploymentOptions = [
    {
      id: 'docker',
      name: 'Docker',
      icon: '🐳',
      color: '#2496ED',
      description: 'Container-based deployment',
      badges: ['Containerization', 'Portable', 'Scalable']
    },
    {
      id: 'kubernetes',
      name: 'Kubernetes',
      icon: '☸️',
      color: '#326CE5',
      description: 'Container orchestration platform',
      badges: ['Orchestration', 'Scalability', 'Self-healing']
    },
    {
      id: 'aws',
      name: 'AWS',
      icon: '☁️',
      color: '#FF9900',
      description: 'Amazon Web Services cloud',
      badges: ['EC2', 'Lambda', 'S3']
    },
    {
      id: 'azure',
      name: 'Azure',
      icon: '☁️',
      color: '#0078D4',
      description: 'Microsoft cloud platform',
      badges: ['App Service', 'Functions', 'Storage']
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: '▲',
      color: '#000000',
      description: 'Frontend deployment platform',
      badges: ['Edge Network', 'Serverless', 'Preview']
    },
    {
      id: 'netlify',
      name: 'Netlify',
      icon: '🌐',
      color: '#00C7B7',
      description: 'Frontend deployment platform',
      badges: ['Continuous Deployment', 'Forms', 'Functions']
    }
  ];

  /**
   * CI/CD options
   */
  protected readonly cicdOptions = [
    {
      id: 'github',
      name: 'GitHub Actions',
      icon: '⚙️',
      description: 'GitHub integrated CI/CD'
    },
    {
      id: 'gitlab',
      name: 'GitLab CI',
      icon: '🦊',
      description: 'GitLab integrated pipelines'
    },
    {
      id: 'jenkins',
      name: 'Jenkins',
      icon: '👨‍🔧',
      description: 'Self-hosted automation server'
    },
    {
      id: 'circleci',
      name: 'CircleCI',
      icon: '⚪',
      description: 'Cloud-based CI/CD service'
    }
  ];
}
