import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TechCardComponent, TechCardModel } from '../shared/tech-card';

@Component({
  selector: 'app-database-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TechCardComponent],
  templateUrl: './database-config.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseConfigComponent {
  // Input properties
  readonly databaseForm = input<FormGroup>();
  readonly versionOptions = input<{
    [key: string]: { [key: string]: string[] };
  }>();
  readonly showAdvancedOptions = input<boolean>();

  /**
   * Database options
   */
  protected readonly databases: TechCardModel[] = [
    {
      id: 'mongodb',
      name: 'MongoDB',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/MongoDB.png',
      color: '#4DB33D',
      description: 'NoSQL document database',
      badges: ['Document Store', 'Flexible Schema', 'JSON'],
      versions: ['6.0', '5.0', '4.4', '4.2'],
    },
    {
      id: 'postgres',
      name: 'PostgreSQL',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg',
      color: '#336791',
      description: 'Advanced open-source SQL database',
      badges: ['ACID', 'JSON Support', 'Extensible'],
      versions: ['15', '14', '13', '12', '11'],
    },
    {
      id: 'mysql',
      name: 'MySQL',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/MySQL.png',
      color: '#4479A1',
      description: 'Popular relational database',
      badges: ['Relational', 'ACID', 'Mature'],
      versions: ['8.0', '5.7', '5.6'],
    },
    {
      id: 'redis',
      name: 'Redis',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Redis.png',
      color: '#DC382D',
      description: 'In-memory data structure store',
      badges: ['Key-Value', 'In-Memory', 'Caching'],
      versions: ['7.0', '6.2', '6.0', '5.0'],
    },
    {
      id: 'firebase',
      name: 'Firebase',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Firebase.png',
      color: '#FFCA28',
      description: 'Realtime NoSQL cloud database',
      badges: ['Realtime', 'NoSQL', 'Cloud'],
      versions: ['9.x', '8.x', '7.x'],
    },
    {
      id: 'sqlite',
      name: 'SQLite',
      icon: 'https://icon.icepanel.io/Technology/png-shadow-512/SQLite.png',
      color: '#003B57',
      description: 'Lightweight file-based database',
      badges: ['Serverless', 'File-based', 'Embedded'],
      versions: ['3.41', '3.39', '3.37', '3.35'],
    },
  ];

  /**
   * Database-specific ORM/ODM mappings
   */
  protected readonly databaseOrmMapping: { [key: string]: TechCardModel[] } = {
    // MongoDB specific ODMs
    mongodb: [
      {
        id: 'mongoose',
        name: 'Mongoose',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Mongoose-ODM.png',
        description: 'MongoDB object modeling',
        color: '#800',
        badges: ['MongoDB', 'Schema-based', 'Validation'],
        versions: ['7.x', '6.x', '5.x'],
      },
      {
        id: 'mongodb-native',
        name: 'MongoDB Native',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/MongoDB.png',
        description: 'Official MongoDB driver for Node.js',
        color: '#4DB33D',
        badges: ['Native Driver', 'Performance', 'Full API'],
        versions: ['6.x', '5.x', '4.x'],
      },
    ],

    // PostgreSQL specific ORMs
    postgres: [
      {
        id: 'typeorm',
        name: 'TypeORM',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/TypeORM.png',
        description: 'TypeScript ORM for any database',
        color: '#FE0A5A',
        badges: ['TypeScript', 'Multi-database', 'Decorators'],
        versions: ['0.3.x', '0.2.x', '0.1.x'],
      },
      {
        id: 'sequelize',
        name: 'Sequelize',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Sequelize.png',
        description: 'ORM for SQL databases',
        color: '#3A98CB',
        badges: ['SQL', 'Node.js', 'Promise-based'],
        versions: ['6.x', '5.x', '4.x'],
      },
      {
        id: 'prisma',
        name: 'Prisma',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Prisma.png',
        description: 'Next-generation ORM',
        color: '#5A67D8',
        badges: ['Type-safe', 'Auto-migration', 'PostgreSQL'],
        versions: ['5.x', '4.x', '3.x'],
      },
      {
        id: 'pg',
        name: 'Node-Postgres',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/PostgreSQL.png',
        description: 'Native PostgreSQL client',
        color: '#336791',
        badges: ['Native', 'Performance', 'Lightweight'],
        versions: ['8.x', '7.x', '6.x'],
      },
    ],

    // MySQL specific ORMs
    mysql: [
      {
        id: 'sequelize',
        name: 'Sequelize',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Sequelize.png',
        description: 'ORM for SQL databases',
        color: '#3A98CB',
        badges: ['SQL', 'Node.js', 'Promise-based'],
        versions: ['6.x', '5.x', '4.x'],
      },
      {
        id: 'typeorm',
        name: 'TypeORM',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/TypeORM.png',
        description: 'TypeScript ORM for any database',
        color: '#FE0A5A',
        badges: ['TypeScript', 'Multi-database', 'Decorators'],
        versions: ['0.3.x', '0.2.x', '0.1.x'],
      },
      {
        id: 'prisma',
        name: 'Prisma',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Prisma.png',
        description: 'Next-generation ORM',
        color: '#5A67D8',
        badges: ['Type-safe', 'Auto-migration', 'MySQL'],
        versions: ['5.x', '4.x', '3.x'],
      },
    ],

    // Redis specific clients
    redis: [
      {
        id: 'node-redis',
        name: 'Node Redis',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Redis.png',
        description: 'Redis client for Node.js',
        color: '#DC382D',
        badges: ['Official', 'Promise API', 'Pipelining'],
        versions: ['4.x', '3.x', '2.x'],
      },
      {
        id: 'ioredis',
        name: 'ioredis',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Redis.png',
        description: 'Robust Redis client',
        color: '#DC382D',
        badges: ['Cluster', 'Sentinel', 'High-performance'],
        versions: ['5.x', '4.x', '3.x'],
      },
    ],

    // Firebase specific tools
    firebase: [
      {
        id: 'firebase-admin',
        name: 'Firebase Admin SDK',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Firebase.png',
        description: 'Server-side Firebase SDK',
        color: '#FFCA28',
        badges: ['Admin Access', 'Full API', 'Server-side'],
        versions: ['12.x', '11.x', '10.x'],
      },
      {
        id: 'firebase-js',
        name: 'Firebase JS SDK',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Firebase.png',
        description: 'Client-side Firebase SDK',
        color: '#FFCA28',
        badges: ['Client API', 'Authentication', 'Realtime'],
        versions: ['10.x', '9.x', '8.x'],
      },
    ],

    // SQLite specific ORMs
    sqlite: [
      {
        id: 'sequelize',
        name: 'Sequelize',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/Sequelize.png',
        description: 'ORM for SQL databases',
        color: '#3A98CB',
        badges: ['SQL', 'Node.js', 'Promise-based'],
        versions: ['6.x', '5.x', '4.x'],
      },
      {
        id: 'typeorm',
        name: 'TypeORM',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/TypeORM.png',
        description: 'TypeScript ORM for any database',
        color: '#FE0A5A',
        badges: ['TypeScript', 'Multi-database', 'Decorators'],
        versions: ['0.3.x', '0.2.x', '0.1.x'],
      },
      {
        id: 'better-sqlite3',
        name: 'better-sqlite3',
        icon: 'https://icon.icepanel.io/Technology/png-shadow-512/SQLite.png',
        description: 'High-performance SQLite3 driver',
        color: '#003B57',
        badges: ['Synchronous API', 'Fast', 'Transactions'],
        versions: ['8.x', '7.x', '6.x'],
      },
    ],
  };

  /**
   * Common ORM options available for all databases
   */
  protected readonly commonOrmOptions: TechCardModel[] = [
    {
      id: 'prisma',
      name: 'Prisma',
      icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDqVqDZrMh3s_EcZ1RQTdU2n7lx5yZS53DLQ&s',
      description: 'Next-generation ORM',
      color: '#5A67D8',
      badges: ['Type-safe', 'Auto-migration', 'Multi-database'],
      versions: ['5.x', '4.x', '3.x'],
    },
  ];

  /**
   * Get available ORM options based on selected database
   */
  protected get ormOptions(): TechCardModel[] {
    const selectedDatabase = this.databaseForm()?.get('database')?.value;
    const databaseSpecificOrms = selectedDatabase
      ? this.databaseOrmMapping[selectedDatabase] || []
      : [];

    return [...databaseSpecificOrms, ...this.commonOrmOptions];
  }

  /**
   * Get versions for the selected database
   */
  protected getDatabaseVersions(): string[] {
    const selectedDatabase = this.databaseForm()!.get('database')?.value;
    // Find the selected database in our databases array
    const database = this.databases.find((db) => db.id === selectedDatabase);
    // Use its versions if available, otherwise fall back to versionOptions input
    if (database?.versions) {
      return database.versions;
    } else if (
      selectedDatabase &&
      this.versionOptions() &&
      this.versionOptions()![selectedDatabase]
    ) {
      // Handle nested structure of versionOptions
      const categories = Object.keys(this.versionOptions()![selectedDatabase]);
      if (categories.length > 0) {
        return (
          this.versionOptions()![selectedDatabase][categories[0]] || ['latest']
        );
      }
    }
    return ['latest'];
  }

  /**
   * Get versions for the selected ORM
   */
  protected getOrmVersions(): string[] {
    const selectedOrm = this.databaseForm()!.get('orm')?.value;
    const selectedDatabase = this.databaseForm()!.get('database')?.value;

    if (selectedOrm) {
      // First check if it's in the database-specific ORMs
      if (selectedDatabase && this.databaseOrmMapping[selectedDatabase]) {
        const orm = this.databaseOrmMapping[selectedDatabase].find(
          (o) => o.id === selectedOrm
        );
        if (orm?.versions && orm.versions.length > 0) {
          return orm.versions;
        }
      }

      // Then check common ORM options
      const commonOrm = this.commonOrmOptions.find((o) => o.id === selectedOrm);
      if (commonOrm?.versions && commonOrm.versions.length > 0) {
        return commonOrm.versions;
      }
    }

    return ['latest'];
  }
}
