import { CheckCircle2, Edit3, FileText, Loader2, Sparkles, Target } from 'lucide-react';

function CompletedIdeaSummary({
  blueprintExists,
  blueprintStale,
  blueprintStatus,
  ideaInput,
  ideaPreview,
  lastAnalyzedAt,
  openQuestionCount,
  onEdit,
  onGenerateBlueprint,
  sourceLabel
}) {
  return (
    <section className="summary-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Completed Step 1</span>
          <h2>Idea Intake Summary</h2>
          <p>
            The intake is now structured enough to hand off into a proposal blueprint. Edit it if needed, or move into
            Step 2.
          </p>
        </div>
        <span className="mode-pill is-ready">
          <CheckCircle2 size={14} aria-hidden="true" />
          {sourceLabel}
        </span>
      </div>

      <div className="summary-card-grid">
        <article className="summary-card">
          <div className="preview-label">
            <Sparkles size={16} aria-hidden="true" />
            <span>Detected topic</span>
          </div>
          <p>{ideaPreview?.detectedTopic || ideaInput.topic}</p>
        </article>

        <article className="summary-card">
          <div className="preview-label">
            <FileText size={16} aria-hidden="true" />
            <span>Problem focus</span>
          </div>
          <p>{ideaPreview?.problem || ideaInput.problem}</p>
        </article>

        <article className="summary-card">
          <div className="preview-label">
            <Target size={16} aria-hidden="true" />
            <span>Possible contribution</span>
          </div>
          <p>{ideaPreview?.possibleContribution || ideaInput.expectedContribution || 'Contribution still needs to be sharpened.'}</p>
        </article>

        <article className="summary-card">
          <div className="preview-label">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Missing information</span>
          </div>
          <p>
            {ideaPreview?.missingInformation?.length
              ? `${ideaPreview.missingInformation.length} open detail${ideaPreview.missingInformation.length > 1 ? 's' : ''} remain for later stages.`
              : openQuestionCount
                ? `${openQuestionCount} clarifying question${openQuestionCount > 1 ? 's' : ''} still remain in the Step 1 agent session.`
                : 'No major missing information remains in the current Step 1 agent session.'}
          </p>
        </article>
      </div>

      {blueprintStale ? (
        <div className="stale-banner">Step 2 is stale. Regenerate the proposal blueprint after reviewing the updated intake.</div>
      ) : null}

      <div className="action-row summary-actions">
        <button className="ghost" type="button" onClick={onEdit}>
          <Edit3 size={16} aria-hidden="true" />
          Edit Idea Intake
        </button>
        <button className="primary" disabled={blueprintStatus === 'generating'} type="button" onClick={onGenerateBlueprint}>
          {blueprintStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
          {blueprintExists ? 'Regenerate Blueprint' : 'Generate Proposal Blueprint'}
        </button>
      </div>

      <div className="meta-row">
        <span>{lastAnalyzedAt ? `Step 1 analyzed ${formatSavedAt(lastAnalyzedAt)}` : 'Step 1 not analyzed yet'}</span>
        <span>{blueprintExists ? (blueprintStale ? 'Blueprint requires refresh' : 'Blueprint is current') : 'Blueprint not generated yet'}</span>
      </div>
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

export default CompletedIdeaSummary;
