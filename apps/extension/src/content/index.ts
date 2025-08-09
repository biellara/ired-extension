// Torna este arquivo um MÓDULO e evita globais que colidem com o background
export {};

type AnalysisResult = { suggested_reply?: string; [k: string]: any };

const API_DEFAULT = 'http://localhost:8787';

const state: {
  apiBase: string;
  teamKey: string;
  conversationId: string;
  lastResult: AnalysisResult | null;
} = {
  apiBase: API_DEFAULT,
  teamKey: 'dev-team-key',
  conversationId: '',
  lastResult: null
};

// Carrega config (tipa o callback)
chrome.storage.sync.get(
  ['apiBase', 'teamKey'],
  (cfg: { apiBase?: string; teamKey?: string }) => {
    if (cfg.apiBase) state.apiBase = cfg.apiBase;
    if (cfg.teamKey) state.teamKey = cfg.teamKey;
  }
);

// ----- Overlay mínimo -----
function ensureOverlay() {
  if (document.getElementById('ired-omni-overlay')) return;
  const root = document.createElement('div');
  root.id = 'ired-omni-overlay';
  root.style.cssText = `
    position: fixed; top: 0; right: 0; height: 100vh; width: 380px; z-index: 999999;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    background: #0f172a; color: #e2e8f0; box-shadow: -2px 0 12px rgba(0,0,0,.25);
    display: flex; flex-direction: column; border-left: 1px solid #1f2937;
  `;
  root.innerHTML = `
    <div style="padding:10px; display:flex; align-items:center; gap:8px; border-bottom:1px solid #1f2937;">
      <strong style="font-size:14px;">Ired AI Assistant</strong>
      <span id="ired-status" style="margin-left:auto; font-size:12px; opacity:.8;">pronto</span>
    </div>
    <div style="padding:10px; overflow:auto; flex:1;">
      <div id="ired-result" style="white-space:pre-wrap; font-size:12px; line-height:1.3"></div>
    </div>
    <div style="padding:10px; border-top:1px solid #1f2937; display:flex; gap:8px;">
      <button id="ired-copy" style="padding:6px 10px; background:#1d4ed8; border:none; color:#fff; border-radius:6px; cursor:pointer;">Copiar sugestão</button>
      <button id="ired-hide" style="padding:6px 10px; background:#334155; border:none; color:#fff; border-radius:6px; cursor:pointer; margin-left:auto;">Ocultar</button>
    </div>
  `;
  document.body.appendChild(root);
  document.getElementById('ired-hide')?.addEventListener('click', () => {
    (root as HTMLDivElement).style.display = 'none';
  });
  document.getElementById('ired-copy')?.addEventListener('click', () => {
    const s = state.lastResult?.suggested_reply || '';
    if (!s) return;
    navigator.clipboard.writeText(s);
    setStatus('copiado!');
    setTimeout(() => setStatus('pronto'), 1200);
  });
}

function setStatus(t: string) {
  const el = document.getElementById('ired-status');
  if (el) el.textContent = t;
}

function showResult(obj: AnalysisResult) {
  ensureOverlay();
  const el = document.getElementById('ired-result');
  if (!el) return;
  state.lastResult = obj;
  const short = JSON.stringify(obj, null, 2);
  el.textContent = short;
}

// ----- WS hook injection -----
const signalrHook = `
(function(){ 
  function parseSignalR(text){
    const RS='\\u001e'; const frames = text.split(RS).filter(Boolean);
    const out = { turns: [], conversationId: undefined, target: undefined };
    for (const f of frames){
      let o; try { o = JSON.parse(f); } catch { continue; }
      if (o && o.type === 1 && o.target){
        out.target = o.target;
        const a0 = o.arguments && o.arguments[0];
        if (!a0) continue;
        if (o.target === 'RoomHistory'){
          const list = Array.isArray(a0.data) ? a0.data : [];
          for (const m of list){ 
            if (!out.conversationId && m.roomId) out.conversationId = m.roomId;
            out.turns.push(norm(m));
          }
        }
        if (o.target === 'ReceiveMessage'){
          const m = a0;
          if (m && m.roomId && !out.conversationId) out.conversationId = m.roomId;
          out.turns.push(norm(m));
        }
      }
    }
    return out;
    function norm(m){
      const who = m.origin === 1 ? 'client' : (m.isInternal ? 'bot' : 'agent');
      return { id:m.id, who, text: String(m.message || ''), ts: Date.parse(m.createdAt || new Date().toISOString()) };
    }
  }
  const emit = (d) => window.dispatchEvent(new CustomEvent('omni:net:message', { detail: d }));
  const _WS = window.WebSocket;
  window.WebSocket = function(url, protocols){
    const ws = new _WS(url, protocols);
    ws.addEventListener('message', async (ev) => {
      let text;
      if (typeof ev.data === 'string') text = ev.data;
      else if (ev.data instanceof Blob) text = await ev.data.text();
      else if (ev.data instanceof ArrayBuffer) text = new TextDecoder().decode(ev.data);
      if (!text) return;
      const parsed = parseSignalR(text);
      if (parsed.turns && parsed.turns.length){
        emit({ source:'ws', url, conversationId: parsed.conversationId, turns: parsed.turns });
      }
    });
    return ws;
  };
})();`;

function injectPageScript(code: string) {
  const s = document.createElement('script');
  s.textContent = code;
  (document.head || document.documentElement).appendChild(s);
  s.remove();
}

// escuta eventos do hook (tipa como CustomEvent)
window.addEventListener('omni:net:message', (ev) => {
  const detail = (ev as CustomEvent<any>).detail || {};
  if (detail.conversationId) state.conversationId = detail.conversationId as string;
  const turns = (detail.turns || []).filter((t: any) => t.who === 'client');
  if (!turns.length) return;
  ensureOverlay();
  setStatus('analisando...');
  chrome.runtime.sendMessage({
    type: 'NEW_TURNS',
    payload: {
      conversationId: state.conversationId || 'unknown',
      channel: 'whatsapp',
      org: 'ired',
      locale: 'pt-BR',
      settings: { redactPII: true, maxContext: 12 },
      turns
    }
  });
});

// recebe resultado do background (tipa msg)
chrome.runtime.onMessage.addListener((msg: { type?: string; payload?: AnalysisResult }) => {
  if (msg?.type === 'ANALYSIS_RESULT' && msg.payload) {
    showResult(msg.payload);
    setStatus('pronto');
  }
});

// inicializa
injectPageScript(signalrHook);
ensureOverlay();
