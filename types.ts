export type Tab = 'overview' | 'notes' | 'schedule' | 'analytics' | 'intelligence';

export interface Note {
  filename: string;
  content: string;
  mtime: string;
}

export interface AINewsItem {
  id: string;
  title: string;
  source: string;
  abstract: string[];
  timestamp: string;
  impactScore: number;
}

export interface EmailThread {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  time: string;
  urgent: boolean;
}
