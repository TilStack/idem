/**
 * Model for development configurations that will be sent to the backend
 */
export interface DevelopmentConfigsModel {
  // Core stack selections
  backendStack: string;
  frontendStack: string;
  databaseStack: string;
  additionalStacks: string[];
  
  // Project constraints
  constraints: string[];
  
  // Detailed frontend configuration
  frontend: {
    framework: string;       // 'react', 'angular', 'vue', 'nextjs', 'astro', 'html'
    version?: string;       // Framework version
    styling: string;        // 'tailwind', 'scss', 'css', 'styled-components', etc.
    stateManagement?: string; // 'redux', 'context', 'signals', 'pinia', etc.
    features: string[];     // Selected frontend features
  };
  
  // Detailed backend configuration
  backend: {
    framework: string;      // 'express', 'nestjs', 'django', 'spring', etc.
    version?: string;       // Framework version
    apiType: string;        // 'rest', 'graphql', 'grpc', etc.
    features: string[];     // Selected backend features
  };
  
  // Database configuration
  database: {
    type: string;           // 'sql', 'nosql'
    provider: string;       // 'postgresql', 'mongodb', 'mysql', etc.
    orm?: string;           // 'prisma', 'sequelize', 'mongoose', etc.
    features: string[];     // Selected database features
  };
  
  // Deployment preferences
  deployment: {
    provider: string;       // 'aws', 'gcp', 'azure', 'vercel', 'netlify', etc.
    containerized: boolean; // Whether to use Docker
    cicd?: string;         // CI/CD pipeline preference
  };
  
  // Project configuration options
  projectConfig: {
    seoEnabled: boolean;
    contactFormEnabled: boolean;
    analyticsEnabled: boolean;
    i18nEnabled: boolean;
    performanceOptimized: boolean;
    authentication: boolean;
    authorization: boolean;
    paymentIntegration?: boolean;
    customOptions?: Record<string, any>;
  };
}