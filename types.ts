export interface AudioStreamConfig {
  sampleRate: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MessageLog {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type AvatarEmotion = 'idle' | 'listening' | 'speaking' | 'thinking' | 'laughing' | 'surprised';
