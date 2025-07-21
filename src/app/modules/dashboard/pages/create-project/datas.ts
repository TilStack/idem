import { SelectItemGroup } from 'primeng/api';

export interface PhaseItem {
  label: string;
  tier: 'free' | 'standard' | 'premium'; // f, s, p
}

export interface DevelopmentPhase {
  id: string;
  label: string;
  tier: 'free' | 'standard' | 'premium'; // Niveau global de la phase
  subItems: PhaseItem[];
}
export interface SelectElement {
  name: string;
  code: string;
}

export default class CreateProjectDatas {

  static groupedProjectTypes: SelectElement[] = [
    { name: 'Application Web', code: 'web' },
    { name: 'Application Mobile', code: 'mobile' },
    { name: 'IoT', code: 'iot' },
    { name: 'Application Desktop', code: 'desktop' },
    { name: 'API/Backend', code: 'api' },
    { name: 'IA/ML', code: 'ai' },
    { name: 'Blockchain', code: 'blockchain' },
  ];

  static groupedTargets: SelectElement[] = [
    { name: 'Entreprises', code: 'business' },
    { name: 'Étudiants', code: 'students' },
    { name: 'Grand public', code: 'general-public' },
    { name: 'Administrations', code: 'government' },
    { name: 'Professionnels de santé', code: 'healthcare' },
  ];

  static groupedScopes: SelectElement[] = [
    { name: 'Locale', code: 'local' },
    { name: 'Départementale', code: 'departmental' },
    { name: 'Régionale', code: 'regional' },
    { name: 'Nationale', code: 'national' },
    { name: 'Internationale', code: 'international' },
  ];
}
