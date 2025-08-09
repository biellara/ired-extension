// Background: encaminha para API /analyze com chave de equipe
type TurnsPayload = {
  conversationId: string;
  channel: 'whatsapp'|'telegram'|'instagram'|'web';
  org: 'ired';
  locale: 'pt-BR';
  settings: { redactPII: boolean; maxContext: number };
  turns: Array<{ id?: string; who: 'client'|'bot'|'agent'; text: string; ts: number }>;
};

const API_DEFAULT = 'http://localhost:8787';
let apiBase = API_DEFAULT;
let teamKey = 'dev-team-key';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ apiBase, teamKey });
});

chrome.storage.sync.get(['apiBase','teamKey'], (cfg) => {
  if (cfg.apiBase) apiBase = cfg.apiBase;
  if (cfg.teamKey) teamKey = cfg.teamKey;
});

chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg?.type === 'NEW_TURNS') {
    const payload: TurnsPayload = msg.payload;
    fetch(`${apiBase}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Team-Key': teamKey
      },
      body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId) chrome.tabs.sendMessage(tabId, { type: 'ANALYSIS_RESULT', payload: data });
      });
    })
    .catch(err => {
      console.error('API error', err);
    });
  }
});
