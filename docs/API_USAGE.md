# API Usage

## Required API Configuration

The proposal pipeline requires an external LLM API. Template proposal generation has been removed, so the server returns an error when API configuration is missing or when the provider fails after retries.

The client keeps only a PDF-rendering fallback for already-generated LaTeX when `/api/export/pdf` fails. That fallback does not create or revise proposal content.

## External API

Copy `.env.example` to `.env` and set all required values before starting the server:

```bash
LLM_PROVIDER=gemini
LLM_API_URL=https://generativelanguage.googleapis.com/v1beta
LLM_API_KEY=your_key_here
LLM_MODEL=gemini-2.5-flash
```

For an OpenAI-compatible chat completions endpoint, use:

```bash
LLM_PROVIDER=openai-compatible
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your_key_here
LLM_MODEL=your_model_here
```

API keys stay on the server and are not sent to the browser.

Gemini quota or temporary high-demand errors are retried automatically. If Gemini still rejects the request, the UI shows the API error and preserves the previously saved workflow state.

## API Endpoints

- `POST /api/agent/start`: Step 1 intake in, accepted project state, suggested fields, decision cards, clarifying questions, and transcript out.
- `POST /api/agent/answer`: current Step 1 state plus student answer in, updated project state and remaining questions out.
- `POST /api/blueprint`: Step 1 intake and preview in, proposal blueprint plus transcript out.
- `POST /api/related-work`: proposal blueprint in, related-work plan plus transcript out.
- `POST /api/critique`: proposal blueprint and related-work plan in, critique artifacts plus transcript out.
- `POST /api/apply-revisions`: proposal blueprint and accepted suggestions in, revised blueprint plus transcript out.
- `POST /api/proposal`: revised blueprint in, `proposalLatex`, compliance matrix, evaluation report, remaining questions, and transcript out.
- `POST /api/export/pdf`: `proposalLatex` in, compiled `proposal.pdf` out.

## Logged Data

The Step 1 session and later generation steps return `mode`, `provider`, and `transcript`. The app now persists these locally so Stage 2 evidence can be resumed after reload.

Each successful `transcript` object includes:

- structured prompt payload
- raw model response

For a real submission, save relevant transcripts separately and remove private data before sharing logs or screenshots.
