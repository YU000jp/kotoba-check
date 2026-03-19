export enum IssueSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL'
}

export enum IssueCategory {
  GENDER = 'GENDER', // ジェンダー
  RACE = 'RACE', // 人種・民族
  ABILITY = 'ABILITY', // 障がい
  AGGRESSION = 'AGGRESSION', // 攻撃的・威圧的
  EXCLUSION = 'EXCLUSION', // 排他性
  OTHER = 'OTHER' // その他
}

export interface AnalysisIssue {
  originalText: string;
  suggestion: string;
  reason: string;
  category: IssueCategory;
  severity: IssueSeverity;
}

export interface AnalysisResult {
  issues: AnalysisIssue[];
}
