export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface VoiceOption {
  name: VoiceName;
  gender: 'Female' | 'Male';
  tone: string;
  description: string;
}

export type StyleToneId =
  | 'natural'
  | 'cheerful'
  | 'calm'
  | 'dramatic'
  | 'professional'
  | 'whispering';

export interface StyleOption {
  id: StyleToneId;
  label: string;
  promptPrefix: string;
}

export type SynthesisMode = 'single' | 'multi';

export interface MultiSpeakerConfig {
  speaker1Name: string;
  speaker1Voice: VoiceName;
  speaker2Name: string;
  speaker2Voice: VoiceName;
}

export interface TTSRequest {
  text: string;
  mode: SynthesisMode;
  voice: VoiceName;
  style: StyleToneId;
  customPromptPrefix?: string;
  speaker1Name?: string;
  speaker1Voice?: VoiceName;
  speaker2Name?: string;
  speaker2Voice?: VoiceName;
}

export interface TTSResponse {
  success: boolean;
  model: string;
  audioData: string;
  audioBase64: string;
  format: string;
  sampleRate: number;
  estimatedDuration: number;
  mode: SynthesisMode;
  voice: string;
  text: string;
  createdAt: string;
  error?: string;
  isHighDemand?: boolean;
}

export interface HistoryItem {
  id: string;
  text: string;
  mode: SynthesisMode;
  voice: string;
  style: StyleToneId;
  audioData: string;
  duration: number;
  createdAt: string;
}
