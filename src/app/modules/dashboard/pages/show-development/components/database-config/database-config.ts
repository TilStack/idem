import { 
  ChangeDetectionStrategy,
  Component,
  input,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-database-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './database-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseConfigComponent {
  // Input properties
  readonly databaseForm = input<FormGroup>();
  readonly versionOptions = input<{[key: string]: {[key: string]: string[]}}>();
  readonly showAdvancedOptions = input<boolean>();

  /**
   * Database options
   */
  protected readonly databases = [
    {
      id: 'mongodb',
      name: 'MongoDB',
      icon: '🍃',
      color: '#4DB33D',
      description: 'NoSQL document database',
      badges: ['Document Store', 'Flexible Schema', 'JSON']
    },
    {
      id: 'postgres',
      name: 'PostgreSQL',
      icon: '🐘',
      color: '#336791',
      description: 'Advanced open-source SQL database',
      badges: ['ACID', 'JSON Support', 'Extensible']
    },
    {
      id: 'mysql',
      name: 'MySQL',
      icon: '🐬',
      color: '#4479A1',
      description: 'Popular relational database',
      badges: ['Relational', 'ACID', 'Mature']
    },
    {
      id: 'redis',
      name: 'Redis',
      icon: '🔴',
      color: '#DC382D',
      description: 'In-memory data structure store',
      badges: ['Key-Value', 'In-Memory', 'Caching']
    },
    {
      id: 'firebase',
      name: 'Firebase',
      icon: '🔥',
      color: '#FFCA28',
      description: 'Realtime NoSQL cloud database',
      badges: ['Realtime', 'NoSQL', 'Cloud']
    },
    {
      id: 'sqlite',
      name: 'SQLite',
      icon: '📁',
      color: '#003B57',
      description: 'Lightweight file-based database',
      badges: ['Serverless', 'File-based', 'Embedded']
    }
  ];

  /**
   * ORM/ODM options
   */
  protected readonly ormOptions = [
    {
      id: 'sequelize',
      name: 'Sequelize',
      icon: '🧬',
      description: 'ORM for SQL databases'
    },
    {
      id: 'typeorm',
      name: 'TypeORM',
      icon: '📊',
      description: 'TypeScript ORM for any database'
    },
    {
      id: 'mongoose',
      name: 'Mongoose',
      icon: '🌱',
      description: 'MongoDB object modeling'
    },
    {
      id: 'prisma',
      name: 'Prisma',
      icon: '⬡',
      description: 'Next-generation ORM'
    }
  ];

  /**
   * Get versions for the selected database
   */
  protected getDatabaseVersions(): string[] {
    const selectedDatabase = this.databaseForm()!.get('database')?.value;
    // Handle nested structure of versionOptions
    if (selectedDatabase && this.versionOptions()![selectedDatabase]) {
      // Get versions from the first category key or return default
      const categories = Object.keys(this.versionOptions()![selectedDatabase]);
      if (categories.length > 0) {
        return this.versionOptions()![selectedDatabase][categories[0]] || ['latest'];
      }
    }
    return ['latest'];
  }
}
