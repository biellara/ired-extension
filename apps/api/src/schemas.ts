import { z } from 'zod';

export const AttachmentZ = z.object({
  type: z.enum(['image','audio','video','file']),
  mime: z.string().optional(),
  size: z.number().optional(),
  url: z.string().url().optional(),
  transcript: z.string().optional()
});

export const ChatTurnZ = z.object({
  id: z.string().optional(),
  who: z.enum(['client','bot','agent']),
  text: z.string(),
  ts: z.number(),
  attachments: z.array(AttachmentZ).optional()
});

export const AnalysisReqZ = z.object({
  conversationId: z.string(),
  channel: z.enum(['whatsapp','telegram','instagram','web']),
  org: z.literal('ired'),
  locale: z.literal('pt-BR'),
  settings: z.object({ redactPII: z.boolean(), maxContext: z.number() }),
  turns: z.array(ChatTurnZ).min(1)
});

export const AnalysisResZ = z.object({
  sentiment: z.object({ label: z.enum(['negativo','neutro','positivo','misto']), score: z.number().min(0).max(1) }),
  summary: z.string(),
  issue_hypothesis: z.array(z.string()),
  clarifying_questions: z.array(z.string()),
  openers: z.array(z.string()),
  suggested_reply: z.string(),
  citations: z.array(z.object({ source: z.enum(['procedure','article']), id: z.string(), snippet: z.string() })).optional()
});

export type AnalysisRequest = z.infer<typeof AnalysisReqZ>;
export type AnalysisResponse = z.infer<typeof AnalysisResZ>;
