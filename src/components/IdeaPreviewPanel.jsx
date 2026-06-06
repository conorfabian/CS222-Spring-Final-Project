import { ArrowRight, BookCopy, CircleCheckBig, FileSearch, GitBranchPlus, Layers3, SearchCheck } from 'lucide-react';

const FUTURE_WORKFLOW_CARDS = [
  {
    title: 'Proposal Blueprint',
    description: 'Turn the intake object into a first structured proposal outline.'
  },
  {
    title: 'Related Work Planning',
    description: 'Turn the blueprint into search queries, literature buckets, and evidence warnings.'
  },
  {
    title: 'Critic Agents',
    description: 'Run review passes for clarity, scope, novelty, and evaluation quality.'
  },
  {
    title: 'Revision History',
    description: 'Save accepted changes and compare before/after proposal versions.'
  }
];

function IdeaPreviewPanel({ analysisMode, ideaInput, ideaPreview, lastAnalyzedAt, status }) {
  const modeLabel = analysisMode === 'api' ? 'API-enhanced preview' : analysisMode === 'template' ? 'Template preview' : 'Waiting';

  return (
    <section className="preview-column">
      <section className="preview-panel panel-card">
        <div className="panel-header-row">
          <div>
            <span className="eyebrow">Step 1 Output</span>
            <h2>Proposal Blueprint Preview</h2>
          </div>
          <span className={analysisMode ? 'mode-pill is-ready' : 'mode-pill'}>{modeLabel}</span>
        </div>

        {ideaPreview ? (
          <div className="preview-stack">
            <article className="preview-card">
              <div className="preview-label">
                <BookCopy size={16} aria-hidden="true" />
                <span>Detected topic</span>
              </div>
              <p>{ideaPreview.detectedTopic}</p>
            </article>

            <article className="preview-card">
              <div className="preview-label">
                <FileSearch size={16} aria-hidden="true" />
                <span>Problem</span>
              </div>
              <p>{ideaPreview.problem}</p>
            </article>

            <article className="preview-card">
              <div className="preview-label">
                <SearchCheck size={16} aria-hidden="true" />
                <span>Motivation</span>
              </div>
              <p>{ideaPreview.motivation}</p>
            </article>

            <article className="preview-card">
              <div className="preview-label">
                <CircleCheckBig size={16} aria-hidden="true" />
                <span>Possible contribution</span>
              </div>
              <p>{ideaPreview.possibleContribution}</p>
            </article>

            <article className="preview-card missing-card">
              <div className="preview-label">
                <Layers3 size={16} aria-hidden="true" />
                <span>Missing information</span>
              </div>
              <ul className="missing-list">
                {ideaPreview.missingInformation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="next-stage-note">
              <ArrowRight size={16} aria-hidden="true" />
              <p>Next stage will use this intake to draft a stronger problem framing and proposal blueprint.</p>
            </div>

            <div className="meta-row">
              <span>{lastAnalyzedAt ? `Last analyzed ${formatSavedAt(lastAnalyzedAt)}` : 'Not analyzed yet'}</span>
              <span>{status === 'analyzing' ? 'Updating preview...' : 'Saved for later workflow stages'}</span>
            </div>
          </div>
        ) : (
          <div className="preview-empty">
            <h3>Preview pending</h3>
            <p>
              Analyze the research idea to generate a mock blueprint preview that later stages can expand, critique, and
              revise.
            </p>
            <dl className="seed-list">
              <div>
                <dt>Topic seed</dt>
                <dd>{ideaInput.topic || 'Waiting for a research topic.'}</dd>
              </div>
              <div>
                <dt>Context seed</dt>
                <dd>{ideaInput.keywords || 'Keywords and papers will support later related-work retrieval.'}</dd>
              </div>
              <div>
                <dt>Method seed</dt>
                <dd>{ideaInput.methods || 'Method details will later feed the proposal blueprint generator.'}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <section className="future-panel panel-card">
        <div className="panel-header-row">
          <div>
            <span className="eyebrow">Future Workflow</span>
            <h2>What Step 1 unlocks next</h2>
          </div>
          <span className="mode-pill">Stage 2 ready</span>
        </div>

        <div className="future-card-grid">
          {FUTURE_WORKFLOW_CARDS.map((card) => (
            <article className="future-card" key={card.title}>
              <GitBranchPlus size={18} aria-hidden="true" />
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function formatSavedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'recently';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default IdeaPreviewPanel;
