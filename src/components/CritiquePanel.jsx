import { AlertTriangle, ArrowRight, ClipboardList, Loader2, RefreshCw, Sparkles, Target } from 'lucide-react';
import CriticReviewCard from './CriticReviewCard.jsx';

function CritiquePanel({
  critiqueError,
  critiqueGeneratedAt,
  critiqueMode,
  critiquePanelResult,
  critiqueStale,
  critiqueStatus,
  onGenerate,
  onStartRevisionPlanning,
  revisionPlanExists
}) {
  const modeLabel = critiqueMode === 'api' ? 'Gemini' : critiqueMode === 'template' ? 'Template' : 'Waiting';

  return (
    <section className="critique-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Step 4</span>
          <h2>Multi-Agent Critique</h2>
          <p>This step simulates multiple proposal reviewers. Each critic evaluates a different dimension and ranks revision priorities.</p>
        </div>
        <span className={critiqueMode ? 'mode-pill is-ready' : 'mode-pill'}>{modeLabel}</span>
      </div>

      <div className="action-row summary-actions">
        <button className="secondary" disabled={critiqueStatus === 'generating'} type="button" onClick={onGenerate}>
          {critiqueStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          {critiquePanelResult ? 'Run Critique Again' : 'Run Multi-Agent Critique'}
        </button>
        <button
          className="ghost"
          disabled={!critiquePanelResult || critiqueStale || critiqueStatus === 'generating'}
          type="button"
          onClick={onStartRevisionPlanning}
        >
          <ArrowRight size={16} aria-hidden="true" />
          {revisionPlanExists ? 'Continue Revision Planning' : 'Start Revision Planning'}
        </button>
      </div>

      {critiqueStale ? (
        <div className="stale-banner">This critique is based on an older proposal state. Regenerate it before using revision suggestions.</div>
      ) : null}

      {critiqueError ? (
        <p className="error-banner inline-banner">
          <AlertTriangle size={16} aria-hidden="true" />
          {critiqueError}
        </p>
      ) : null}

      {critiqueStatus === 'generating' && !critiquePanelResult ? (
        <div className="blueprint-empty-state">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <h3>Running proposal critics</h3>
          <p>The critique panel is evaluating the blueprint from multiple reviewer perspectives.</p>
        </div>
      ) : null}

      {critiqueStatus === 'error' && !critiquePanelResult ? (
        <div className="blueprint-empty-state">
          <AlertTriangle size={28} aria-hidden="true" />
          <h3>Critique generation failed</h3>
          <p>Try again or refresh the related work plan. Your earlier workflow stages are still saved.</p>
        </div>
      ) : null}

      {!critiquePanelResult && critiqueStatus === 'idle' ? (
        <div className="blueprint-empty-state">
          <ClipboardList size={28} aria-hidden="true" />
          <h3>Critique pending</h3>
          <p>Run the multi-agent critique to generate reviewer scores, prioritized issues, and revision guidance.</p>
        </div>
      ) : null}

      {critiquePanelResult ? (
        <>
          <div className="blueprint-meta-row">
            <span>
              <Target size={16} aria-hidden="true" />
              {critiqueGeneratedAt ? `Generated ${formatSavedAt(critiqueGeneratedAt)}` : 'Generated recently'}
            </span>
            <span>
              <Sparkles size={16} aria-hidden="true" />
              {critiqueStale
                ? 'Refresh required before revision planning'
                : revisionPlanExists
                  ? 'Revision planning already started'
                  : 'Ready for accept, reject, or defer decisions'}
            </span>
          </div>

          <div className="critique-summary-grid">
            <article className="critique-overview-card">
              <span className="eyebrow subtle-eyebrow">Overall Score</span>
              <h3>Overall Proposal Readiness</h3>
              <div className="critique-score-line">
                <strong>{critiquePanelResult.overallScore.toFixed(1)}</strong>
                <span>/ 10</span>
              </div>
              <p>The score summarizes the current proposal scaffold, not a final submission-ready draft.</p>
            </article>

            <article className="critique-priority-panel">
              <div className="preview-label">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>Highest-Priority Issues</span>
              </div>
              <div className="critique-priority-list">
                {critiquePanelResult.highestPriorityIssues.map((issue) => (
                  <article className="critique-priority-item" key={issue.id}>
                    <div className="critique-issue-topline">
                      <span className={`priority-badge ${priorityTone(issue.priority)}`}>{issue.priority}</span>
                      <span className="issue-critic-chip">{issue.criticName}</span>
                    </div>
                    <h4>{issue.issue}</h4>
                    <p>{issue.suggestedRevision}</p>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <article className="critique-revision-order-card">
            <div className="preview-label">
              <ArrowRight size={16} aria-hidden="true" />
              <span>Suggested Revision Order</span>
            </div>
            <ol className="revision-order-list">
              {critiquePanelResult.suggestedRevisionOrder.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <div className="critic-review-stack">
            {critiquePanelResult.reviews.map((review) => (
              <CriticReviewCard key={review.criticName} review={review} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function priorityTone(priority) {
  if (priority === 'High') return 'is-high';
  if (priority === 'Medium') return 'is-medium';
  return 'is-low';
}

function formatSavedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'recently';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default CritiquePanel;
