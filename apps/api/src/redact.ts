import { AnalysisReqZ } from './schemas.js';
import type { z } from 'zod';

type AnalysisReq = z.infer<typeof AnalysisReqZ>;
export type Turn = AnalysisReq['turns'][number];

// Emails, telefones (com DDI e BR), CPF, CEP — ajuste conforme sua necessidade
const PII_REGEX =
  /([\w.-]+@[\w.-]+\.\w{2,})|(\+\d{1,3}\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4})|(\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b)|(\b\d{5}-\d{3}\b)/g;

function redactText(s: string | undefined): string {
  if (!s) return '';
  return s.replace(PII_REGEX, '[redacted]');
}

export function redactTurns(turns: Turn[]): Turn[] {
  return turns.map((t) => ({
    ...t,
    text: redactText(t.text),
    attachments: t.attachments?.map((a) => ({
      ...a,
      transcript: a.transcript ? redactText(a.transcript) : a.transcript,
    })),
  }));
}
