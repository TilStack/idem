/**
 * Generic SSE Step Event interface that can be used for all AI generation features
 */
export interface SSEStepEvent {
  type: 'started' | 'completed' | 'error' | 'steps_list' | 'progress' | 'completion' | 'complete';
  stepName?: string;
  data?: any;
  summary?: string;
  timestamp?: string;
  steps?: SSEStep[];
  diagram?: {
    sections: {
      name: string;
      type: string;
      data: string;
      summary: string;
    }[];
    id: string;
    createdAt: any;
    updatedAt: any;
  };
  parsedData?: {
    status?: string;
    stepName?: string;
    stepsInProgress?: string[];
    completedSteps?: string[];
    message?: string;
    totalSteps?: number;
    projectId?: string;
  };
}

/**
 * Generic SSE Step interface
 */
export interface SSEStep {
  stepName: string;
  status: 'progress' | 'completed' | 'pending';
  content?: string;
  timestamp: string;
  summary?: string;
  order?: number;
}

/**
 * Generic SSE Generation State interface
 */
export interface SSEGenerationState {
  steps: SSEStep[];
  currentStep: SSEStep | null;
  isGenerating: boolean;
  error: string | null;
  completed: boolean;
  totalSteps: number;
  completedSteps: number;
  stepsInProgress: string[];
  completedStepNames: string[];
  finalData?: any; // Store complete diagram/final payload data
}

/**
 * SSE Connection Configuration
 */
export interface SSEConnectionConfig {
  url: string;
  keepAlive?: boolean;
  reconnectionDelay?: number;
  maxRetries?: number;
}

/**
 * SSE Event types
 */
export type SSEEventType = 'progress' | 'completed' | 'completion' | 'steps_list' | 'started' | 'error';

/**
 * SSE Service Event Types
 */
export type SSEServiceEventType = 'diagram' | 'branding' | 'business-plan';
