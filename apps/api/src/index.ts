import 'dotenv/config';
import Fastify from 'fastify';
import { AnalysisReqZ, AnalysisResZ } from './schemas.js';
import { redactTurns } from './redact.js';
import { analyzeWithGemini } from './providers.gemini.js';

const PORT = Number(process.env.API_PORT || 8787);
const TEAM_KEY = process.env.TEAM_KEY || 'dev-team-key';
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || '*' ;

const fastify = Fastify({
  logger: true
});

// CORS simples
fastify.addHook('onRequest', async (req, reply) => {
  reply.header('Access-Control-Allow-Origin', ALLOW_ORIGIN);
  reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Team-Key');
  if (req.method === 'OPTIONS') return reply.send();
});

fastify.get('/health', async () => ({ ok: true }));

fastify.post('/analyze', async (req, reply) => {
  try {
    // Auth simples via chave de equipe
    const key = req.headers['x-team-key'];
    if (!key || key !== TEAM_KEY) {
      reply.code(401);
      return { error: 'unauthorized' };
    }

    const parsed = AnalysisReqZ.parse(req.body);
    const safeTurns = parsed.settings.redactPII ? redactTurns(parsed.turns) : parsed.turns;

    const res = await analyzeWithGemini({ ...parsed, turns: safeTurns }, process.env.GEMINI_API_KEY);
    // valida saída
    const out = AnalysisResZ.parse(res);
    return out;
  } catch (err: any) {
    req.log.error(err);
    reply.code(400);
    return { error: 'bad_request', detail: String(err?.message || err) };
  }
});

fastify.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  fastify.log.info(`API listening on http://localhost:${PORT}`);
});
