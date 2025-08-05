import { AnalysisResultModel } from './analysisResult.model';

export interface ProjectModel {
  id?: string;
  name: string;
  description: string;
  type: {
    code: string;
    name: string;
  };
  constraints: string[];
  teamSize: string;
  scope: {
    code: string;
    name: string;
  };
  budgetIntervals?: string;
  targets: {
    code: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  selectedPhases: string[];
  analysisResultModel: AnalysisResultModel;
}
