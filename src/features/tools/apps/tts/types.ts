export interface TTSDocument {
  id: string;
  name: string;
  text: string;
  format: 'txt' | 'md' | 'docx' | 'paste';
  wordCount: number;
  addedAt: number;
}

export interface ListeningRecord {
  id: string;
  documentName: string;
  durationSeconds: number;
  date: string; // YYYY-MM-DD
}

export interface VoicePreferences {
  lang: string;
  voiceName: string;
  speed: number;
}

export type TTSTab = 'reader' | 'upload' | 'voice' | 'library';
