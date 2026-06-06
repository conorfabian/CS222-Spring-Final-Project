import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Clock3, Loader2, MessageSquareQuote, NotebookPen, XCircle } from 'lucide-react';
import RevisionSuggestionCard from './RevisionSuggestionCard.jsx';

function RevisionPlanningPanel({
  applyRevisionsStatus,
  critiqueGeneratedAt,
  critiqueStale,
  onApplyAcceptedRevisions,
  onSuggestionNoteChange,
  onSuggestionStatusChange,
  proposalVersionsCount,
  revisionApplicationStale,
  revisionPlan,
  revisionPlanStale,
  revisionPlanUpdatedAt,
  revisionSuggestions
}) {
  const acceptedCount = revisionPlan?.acceptedSuggestions.length || 0;
  const rejectedCount = revisionPlan?.rejectedSuggestions.length || 0;
  const deferredCount = revisionPlan?.deferredSuggestions.length || 0;
  const readyForNextStep = acceptedCount > 0 && !revisionPlanStale && !critiqueStale && applyRevisionsStatus !== 'applying';

  return (
    <section className="revision-planning-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Step 5</span>
          <h2>Revision Planning</h2>
          <p>
            This step lets the student choose which critic suggestions to use. Accepted suggestions become the revision
            plan for the next proposal update.
          </p>
        </div>
      </div>

      <div className="blueprint-meta-row">
        <span>
          <NotebookPen size={16} aria-hidden="true" />
          {revisionPlanUpdatedAt
            ? `Plan updated ${formatSavedAt(revisionPlanUpdatedAt)}`
            : critiqueGeneratedAt
              ? `Critique generated ${formatSavedAt(critiqueGeneratedAt)}`
              : 'Waiting for critique decisions'}
        </span>
        <span>
          <MessageSquareQuote size={16} aria-hidden="true" />
          Live revision decisions update the plan instantly
        </span>
      </div>

      {revisionPlanStale || critiqueStale ? (
        <div className="stale-banner">
          Upstream proposal inputs changed after this revision plan was built. Regenerate the critique before using these
          suggestions for the next stage.
        </div>
      ) : null}

      {revisionApplicationStale ? (
        <div className="stale-banner">
          Accepted suggestions changed after the latest revised blueprint was saved. Apply revisions again to create a fresh
          before/after version pair.
        </div>
      ) : null}

      {!revisionSuggestions.length ? (
        <div className="blueprint-empty-state">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <h3>Preparing revision suggestions</h3>
          <p>The critique issues are being converted into student-controlled revision decisions.</p>
        </div>
      ) : (
        <div className="revision-planning-layout">
          <div className="revision-suggestion-stack">
            {revisionSuggestions.map((suggestion) => (
              <RevisionSuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onNoteChange={onSuggestionNoteChange}
                onStatusChange={onSuggestionStatusChange}
              />
            ))}
          </div>

          <aside className="revision-plan-sidebar">
            <article className="revision-plan-card emphasis-card">
              <div className="preview-label">
                <ClipboardList size={16} aria-hidden="true" />
                <span>Revision Plan</span>
              </div>
              <p>{revisionPlan?.summary}</p>
            </article>

            <div className="revision-count-grid">
              <article className="revision-count-card is-accepted">
                <CheckCircle2 size={18} aria-hidden="true" />
                <strong>{acceptedCount}</strong>
                <span>Accepted</span>
              </article>
              <article className="revision-count-card is-rejected">
                <XCircle size={18} aria-hidden="true" />
                <strong>{rejectedCount}</strong>
                <span>Rejected</span>
              </article>
              <article className="revision-count-card is-deferred">
                <Clock3 size={18} aria-hidden="true" />
                <strong>{deferredCount}</strong>
                <span>Deferred</span>
              </article>
            </div>

            <article className="revision-plan-card">
              <div className="preview-label">
                <ArrowRight size={16} aria-hidden="true" />
                <span>Suggested Order</span>
              </div>
              {revisionPlan?.revisionOrder.length ? (
                <ol className="revision-order-list">
                  {revisionPlan.revisionOrder.map((suggestion) => (
                    <li key={suggestion.id}>
                      <strong>{suggestion.relatedSection || suggestion.sourceCritic}:</strong> {suggestion.suggestedRevision}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="empty-plan-copy">Accept one or more suggestions to create the ordered revision plan.</p>
              )}
            </article>

            <article className="revision-plan-card">
              <div className="preview-label">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>Sections To Revise</span>
              </div>
              {revisionPlan?.sectionsToRevise.length ? (
                <div className="chip-list compact">
                  {revisionPlan.sectionsToRevise.map((section) => (
                    <span className="concept-tag" key={section}>
                      {section}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="empty-plan-copy">Accepted suggestions will surface the proposal sections that need revision next.</p>
              )}
            </article>

            <article className="revision-plan-card">
              <div className="preview-label">
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>Accepted Suggestions</span>
              </div>
              {revisionPlan?.acceptedSuggestions.length ? (
                <ul className="blueprint-list checklist-list">
                  {revisionPlan.acceptedSuggestions.map((suggestion) => (
                    <li key={suggestion.id}>{suggestion.suggestedRevision}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-plan-copy">No accepted suggestions yet.</p>
              )}
            </article>

            <button className="ghost next-step-button" disabled={!readyForNextStep} type="button" onClick={onApplyAcceptedRevisions}>
              <ArrowRight size={16} aria-hidden="true" />
              {applyRevisionsStatus === 'applying'
                ? 'Applying Accepted Revisions...'
                : proposalVersionsCount
                  ? 'Apply Revisions Again'
                  : 'Apply Accepted Revisions'}
            </button>
            {!acceptedCount ? <p className="empty-plan-copy">Accept at least one revision suggestion before applying revisions.</p> : null}
          </aside>
        </div>
      )}
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

export default RevisionPlanningPanel;
