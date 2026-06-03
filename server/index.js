import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { proposalLatexToPdf } from './pdfExport.js';
import {
  answerAgentQuestion,
  generateProposal,
  generateProposalBlueprint,
  generateRelatedWorkPlan,
  startAgentSession
} from './proposalGenerator.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    mode: process.env.LLM_API_KEY ? 'api-ready' : 'local-fallback'
  });
});

app.post('/api/agent/start', async (request, response) => {
  try {
    const payload = request.body || {};
    const topic = String(payload.topic || payload.ideaInput?.topic || '').trim();

    if (!topic) {
      response.status(400).json({ error: 'Topic is required.' });
      return;
    }

    response.json(await startAgentSession(payload));
  } catch (error) {
    response.status(500).json({
      error: 'Agent start failed.',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/agent/answer', async (request, response) => {
  try {
    const payload = request.body || {};

    if (!String(payload.answer || '').trim()) {
      response.status(400).json({ error: 'Answer is required.' });
      return;
    }

    response.json(await answerAgentQuestion(payload));
  } catch (error) {
    response.status(500).json({
      error: 'Answer integration failed.',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/proposal', async (request, response) => {
  try {
    const payload = request.body || {};

    if (!String(payload.topic || '').trim()) {
      response.status(400).json({ error: 'Topic is required.' });
      return;
    }

    const result = await generateProposal(payload);
    response.json(result);
  } catch (error) {
    response.status(500).json({
      error: 'Proposal generation failed.',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/blueprint', async (request, response) => {
  try {
    const payload = request.body || {};
    const topic = String(payload.ideaInput?.topic || payload.topic || '').trim();

    if (!topic) {
      response.status(400).json({ error: 'ideaInput.topic is required.' });
      return;
    }

    response.json(await generateProposalBlueprint(payload));
  } catch (error) {
    response.status(500).json({
      error: 'Blueprint generation failed.',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/related-work', async (request, response) => {
  try {
    const payload = request.body || {};
    const topic = String(payload.ideaInput?.topic || payload.topic || '').trim();
    const proposalBlueprint = payload.proposalBlueprint || payload.blueprint;

    if (!topic) {
      response.status(400).json({ error: 'ideaInput.topic is required.' });
      return;
    }

    if (!proposalBlueprint || typeof proposalBlueprint !== 'object') {
      response.status(400).json({ error: 'proposalBlueprint is required.' });
      return;
    }

    response.json(await generateRelatedWorkPlan(payload));
  } catch (error) {
    response.status(500).json({
      error: 'Related work generation failed.',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post('/api/export/pdf', async (request, response) => {
  try {
    const payload = request.body || {};
    const latex = String(payload.proposalLatex || '').trim();

    if (!latex) {
      response.status(400).json({ error: 'proposalLatex is required.' });
      return;
    }

    const title = String(payload.title || 'proposal').trim();
    const pdf = await proposalLatexToPdf(latex, title);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="proposal.pdf"');
    response.send(pdf);
  } catch (error) {
    response.status(500).json({
      error: 'PDF export failed.',
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`Proposal API listening on http://127.0.0.1:${port}`);
});
