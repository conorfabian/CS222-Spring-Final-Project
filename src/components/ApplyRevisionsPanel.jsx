import { AlertTriangle, ArrowRight, GitCompareArrows, History, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import VersionComparisonPanel from './VersionComparisonPanel.jsx';
import VersionHistoryPanel from './VersionHistoryPanel.jsx';

function ApplyRevisionsPanel({
  applyRevisionsError,
  applyRevisionsGeneratedAt,
  applyRevisionsMode,
  applyRevisionsStatus,
  currentVersionId,
  onApply,
  onGenerateProposalOutput,
  onSelectVersionComparison,
  proposalOutputExists,
  proposalOutputStatus,
  proposalOutputStale,
  proposalVersions,
  revisionApplicationStale,
  revisionPlan,
  selectedComparison,
  versionComparison
}) {
  const acceptedCount = revisionPlan?.acceptedSuggestions?.length || 0;
  const hasVersions = proposalVersions.length > 0;
  const hasComparison = Boolean(versionComparison);
  const modeLabel = applyRevisionsMode === 'api' ? 'Gemini' : applyRevisionsMode === 'template' ? 'Template' : 'Waiting';
  const latestVersion = proposalVersions[proposalVersions.length - 1] || null;
  const readyForNextStep =
    hasComparison &&
    !revisionApplicationStale &&
    applyRevisionsStatus !== 'applying' &&
    proposalOutputStatus !== 'generating';

  return (
    <section className="apply-revisions-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Step 6</span>
          <h2>Apply Revisions &amp; Version History</h2>
          <p>
            This step applies only the suggestions you accepted and saves a before/after version so you can track proposal
            improvement.
          </p>
        </div>
        <span className={applyRevisionsMode ? 'mode-pill is-ready' : 'mode-pill'}>{modeLabel}</span>
      </div>

      <div className="action-row summary-actions">
        <button
          className="secondary"
          disabled={!acceptedCount || applyRevisionsStatus === 'applying'}
          type="button"
          onClick={onApply}
        >
          {applyRevisionsStatus === 'applying' ? (
            <Loader2 className="spin" size={16} aria-hidden="true" />
          ) : (
            <RefreshCw size={16} aria-hidden="true" />
          )}
          {hasVersions ? 'Apply Revisions Again' : 'Apply Accepted Revisions'}
        </button>
        <button className="ghost" disabled={!readyForNextStep} type="button" onClick={onGenerateProposalOutput}>
          <ArrowRight size={16} aria-hidden="true" />
          {proposalOutputStatus === 'generating'
            ? 'Generating Proposal Output...'
            : proposalOutputExists
              ? proposalOutputStale
                ? 'Regenerate Proposal Output'
                : 'Continue Proposal Output'
              : 'Generate Proposal Output'}
        </button>
      </div>

      {!acceptedCount ? (
        <div className="stale-banner">Accept at least one revision suggestion before applying revisions.</div>
      ) : null}

      {revisionApplicationStale ? (
        <div className="stale-banner">
          Accepted suggestions changed after the latest revised blueprint was saved. Apply revisions again to create a fresh
          before/after version pair.
        </div>
      ) : null}

      {proposalOutputStale && !revisionApplicationStale ? (
        <div className="stale-banner">The current proposal output is based on an older revised draft. Generate Step 7 again after reviewing this version pair.</div>
      ) : null}

      {applyRevisionsError ? (
        <p className="error-banner inline-banner">
          <AlertTriangle size={16} aria-hidden="true" />
          {applyRevisionsError}
        </p>
      ) : null}

      {applyRevisionsStatus === 'applying' && !hasVersions ? (
        <div className="blueprint-empty-state">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <h3>Applying accepted revisions</h3>
          <p>The proposal blueprint is being revised from the student-approved suggestions and saved into version history.</p>
        </div>
      ) : null}

      {!hasVersions && applyRevisionsStatus === 'idle' ? (
        <div className="blueprint-empty-state">
          <History size={28} aria-hidden="true" />
          <h3>Revision application pending</h3>
          <p>Apply the accepted suggestions to save the initial and revised blueprint versions for before/after comparison.</p>
        </div>
      ) : null}

      {hasVersions ? (
        <>
          <div className="blueprint-meta-row">
            <span>
              <History size={16} aria-hidden="true" />
              {applyRevisionsGeneratedAt ? `Latest revision saved ${formatSavedAt(applyRevisionsGeneratedAt)}` : 'Versions saved recently'}
            </span>
            <span>
              <GitCompareArrows size={16} aria-hidden="true" />
              {revisionApplicationStale ? 'Apply the latest accepted plan again before using this comparison' : 'Before/after comparison is ready'}
            </span>
          </div>

          <div className="apply-revisions-summary-grid">
            <article className="apply-summary-card emphasis-card">
              <div className="preview-label">
                <Sparkles size={16} aria-hidden="true" />
                <span>Change Summary</span>
              </div>
              {latestVersion?.changeSummary?.length ? (
                <ul className="blueprint-list checklist-list is-checklist">
                  {latestVersion.changeSummary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-plan-copy">The revised blueprint will summarize the strongest accepted improvements here.</p>
              )}
            </article>

            <article className="apply-summary-card">
              <div className="preview-label">
                <ArrowRight size={16} aria-hidden="true" />
                <span>Applied Suggestion Scope</span>
              </div>
              <div className="chip-list compact">
                <span className="concept-tag">{acceptedCount} accepted</span>
                <span className="concept-tag">{revisionPlan?.rejectedSuggestions?.length || 0} rejected</span>
                <span className="concept-tag">{revisionPlan?.deferredSuggestions?.length || 0} deferred</span>
              </div>
              <p>
                Only accepted suggestions are applied to the revised blueprint. Rejected and deferred suggestions stay visible
                in Step 5 but are excluded from this version pair.
              </p>
            </article>
          </div>

          <div className="apply-revisions-layout">
            <VersionHistoryPanel
              currentVersionId={currentVersionId}
              onSelectVersionComparison={onSelectVersionComparison}
              proposalVersions={proposalVersions}
              selectedComparison={selectedComparison}
            />

            <VersionComparisonPanel proposalVersions={proposalVersions} versionComparison={versionComparison} />
          </div>
        </>
      ) : null}
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

export default ApplyRevisionsPanel;
