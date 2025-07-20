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
    framework: string;
    version?: string;
    styling: string;
    stateManagement?: string;
    features: string[];
  };

  // Detailed backend configuration
  backend: {
    framework: string;
    version?: string;
    apiType: string;
    orm?: string;
    ormVersion?: string;
    features: string[];
  };

  // Database configuration
  database: {
    type: string;
    provider: string;
    features: string[];
  };

  // Deployment preferences
  deployment: {
    provider: string;
    containerized: boolean;
    cicd?: string;
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
