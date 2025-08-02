/**
 * Generic SSE Step Event interface that can be used for all AI generation features
 */
export interface SSEStepEvent {
  type: 'started' | 'completed' | 'steps_list';
  stepName?: string;
  data: string;
  summary?: string;
  timestamp: string;
  parsedData?: {
    status: string;
    stepName: string;
  };
  // New property to handle list of steps from backend
  steps?: SSEStep[];
}

/**
 * Generic SSE Step interface
 */
export interface SSEStep {
  stepName: string;
  status: 'in-progress' | 'completed' | 'pending';
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
 * SSE Service Event Types
 */
export type SSEServiceEventType = 'diagram' | 'branding' | 'business-plan';
