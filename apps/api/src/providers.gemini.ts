// Stub de Gemini — retorna resposta fake se GEMINI_API_KEY ausente
import type { AnalysisRequest, AnalysisResponse } from './schemas.js';

export async function analyzeWithGemini(
  input: AnalysisRequest,
  apiKey?: string
): Promise<AnalysisResponse> {
  const lastClient =
    [...input.turns].reverse().find(t => t.who === 'client') ||
    input.turns[input.turns.length - 1];
  const text = lastClient?.text ?? '';

  const isNegative = /caiu|lento|ruim|nao funciona|não funciona|reclama|problema|pior/i.test(text);
  const score = isNegative
    ? 0.78
    : /obrigado|valeu|perfeito|ótimo|bom/i.test(text)
    ? 0.82
    : 0.5;

  // TODO: integrar SDK Gemini quando apiKey estiver presente
  return {
    sentiment: {
      label: isNegative ? 'negativo' : score > 0.7 ? 'positivo' : 'neutro',
      score
    },
    summary: text
      ? `Cliente: ${text.slice(0, 120)}`
      : 'Sem texto do cliente.',
    issue_hypothesis: isNegative
      ? ['Queda de conexão', 'Intermitência de link', 'Problema no modem/ONT']
      : ['Dúvida geral'],
    clarifying_questions: [
      'Os LEDs do modem/ONT estão acesos? Qual cor e status?',
      'Você testou via cabo para comparar com o Wi-Fi?',
      'Qual o horário aproximado em que o problema começou?'
    ],
    openers: [
      'Entendo a situação, vamos resolver juntos.',
      'Obrigado por avisar, vou verificar agora.',
      'Vamos conferir alguns pontos rápidos para agilizar.'
    ],
    suggested_reply:
      'Entendo a frustração. Vamos conferir: 1) Como estão os LEDs do modem/ONT? 2) Você testou via cabo? 3) Se possível, me diga quando começou. Com essas infos já avanço os próximos passos.',
    citations: []
  };
}
