export type Attachment = {
  type: 'image' | 'audio' | 'video' | 'file';
  mime?: string;
  size?: number;
  url?: string;
  transcript?: string;
};

export type ChatTurn = {
  id?: string;
  who: 'client' | 'bot' | 'agent';
  text: string;
  ts: number;
  attachments?: Attachment[];
};

export type AnalysisRequest = {
  conversationId: string;
  channel: 'whatsapp' | 'telegram' | 'instagram' | 'web';
  org: 'ired';
  locale: 'pt-BR';
  settings: { redactPII: boolean; maxContext: number };
  turns: ChatTurn[];
};

export type AnalysisResponse = {
  sentiment: { label: 'negativo'|'neutro'|'positivo'|'misto'; score: number };
  summary: string;
  issue_hypothesis: string[];
  clarifying_questions: string[];
  openers: string[];
  suggested_reply: string;
  citations?: Array<{ source: 'procedure'|'article'; id: string; snippet: string }>;
};
