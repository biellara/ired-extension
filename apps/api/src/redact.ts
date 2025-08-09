const patterns = [
  { rx: /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4})[-\s]?\d{4}\b/g, token: '[TEL]' },
  { rx: /[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}/g, token: '[EMAIL]' },
  { rx: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, token: '[CPF]' },
  { rx: /\b\d{2}\.?\d{3}\.?\d{3}\/??\d{4}-?\d{2}\b/g, token: '[CNPJ]' },
  { rx: /\b\d{5}-?\d{3}\b/g, token: '[CEP]' },
  { rx: /\b(?:\d[ -]*?){13,19}\b/g, token: '[PAN]' }
];

export function redactPII(text: string): string {
  return patterns.reduce((acc, { rx, token }) => acc.replace(rx, token), text);
}

export function redactTurns(turns: Array<{ text: string } & Record<string, any>>) {
  return turns.map(t => ({ ...t, text: redactPII(String(t.text ?? '')) }));
}
