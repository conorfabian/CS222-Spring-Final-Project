import { AlertTriangle, ArrowRight, BookOpenCheck, Loader2, RefreshCw, Search, ShieldAlert, Sparkles, Tags } from 'lucide-react';
import RelatedWorkBucketCard from './RelatedWorkBucketCard.jsx';

function RelatedWorkPlanPanel({
  critiquePanelExists,
  critiqueStale,
  critiqueStatus,
  onGenerate,
  onRunCritique,
  relatedWorkError,
  relatedWorkGeneratedAt,
  relatedWorkMode,
  relatedWorkPlan,
  relatedWorkStale,
  relatedWorkStatus
}) {
  const modeLabel = relatedWorkMode === 'api' ? 'Gemini' : relatedWorkMode === 'template' ? 'Template' : 'Waiting';

  return (
    <section className="related-work-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Step 3</span>
          <h2>Related Work Planning</h2>
          <p>
            This step turns the proposal blueprint into literature search directions. These are not verified citations yet;
            they are search plans for finding real sources.
          </p>
        </div>
        <span className={relatedWorkMode ? 'mode-pill is-ready' : 'mode-pill'}>{modeLabel}</span>
      </div>

      <div className="action-row summary-actions">
        <button className="secondary" disabled={relatedWorkStatus === 'generating'} type="button" onClick={onGenerate}>
          {relatedWorkStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          {relatedWorkPlan ? 'Regenerate Related Work Plan' : 'Generate Related Work Plan'}
        </button>
        <button
          className="ghost"
          disabled={!relatedWorkPlan || relatedWorkStale || critiqueStatus === 'generating'}
          type="button"
          onClick={onRunCritique}
        >
          {critiqueStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
          {critiquePanelExists ? 'Run Critique Again' : 'Run Multi-Agent Critique'}
        </button>
        <button className="ghost" disabled={!critiquePanelExists || critiqueStale} type="button">
          <ArrowRight size={16} aria-hidden="true" />
          Next: Accept or Reject Suggestions
        </button>
      </div>

      <div className="warning-banner">
        <ShieldAlert size={16} aria-hidden="true" />
        These outputs are search directions only. Verify sources before making novelty claims or adding citations.
      </div>

      {relatedWorkStale ? (
        <div className="stale-banner">
          This related work plan is based on an older blueprint. Regenerate it before using later critique or revision stages.
        </div>
      ) : null}

      {relatedWorkError ? (
        <p className="error-banner inline-banner">
          <AlertTriangle size={16} aria-hidden="true" />
          {relatedWorkError}
        </p>
      ) : null}

      {relatedWorkStatus === 'generating' && !relatedWorkPlan ? (
        <div className="blueprint-empty-state">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <h3>Generating literature search directions</h3>
          <p>Analyzing the proposal blueprint and organizing the next related-work search plan.</p>
        </div>
      ) : null}

      {relatedWorkStatus === 'error' && !relatedWorkPlan ? (
        <div className="blueprint-empty-state">
          <AlertTriangle size={28} aria-hidden="true" />
          <h3>Related work plan failed</h3>
          <p>Try again or refresh the proposal blueprint. Your earlier workflow stages are still saved.</p>
        </div>
      ) : null}

      {!relatedWorkPlan && relatedWorkStatus === 'idle' ? (
        <div className="blueprint-empty-state">
          <BookOpenCheck size={28} aria-hidden="true" />
          <h3>Related work planning pending</h3>
          <p>Generate the Step 3 plan to organize search queries, literature buckets, gap questions, and evidence warnings.</p>
        </div>
      ) : null}

      {relatedWorkPlan ? (
        <>
          <div className="blueprint-meta-row">
            <span>
              <Search size={16} aria-hidden="true" />
              {relatedWorkGeneratedAt ? `Generated ${formatSavedAt(relatedWorkGeneratedAt)}` : 'Generated recently'}
            </span>
            <span>
              <Sparkles size={16} aria-hidden="true" />
              {relatedWorkStale
                ? 'Refresh required before critique agents'
                : critiquePanelExists && !critiqueStale
                  ? 'Critique is current'
                  : 'Ready for critique planning'}
            </span>
          </div>

          <div className="related-work-layout">
            <div className="related-work-top-grid">
              <article className="related-card emphasis-card">
                <div className="preview-label">
                  <Search size={16} aria-hidden="true" />
                  <span>Search Queries</span>
                </div>
                <div className="chip-list">
                  {relatedWorkPlan.searchQueries.map((query) => (
                    <span className="query-chip" key={query}>
                      {query}
                    </span>
                  ))}
                </div>
              </article>

              <article className="related-card">
                <div className="preview-label">
                  <Tags size={16} aria-hidden="true" />
                  <span>Key Concepts</span>
                </div>
                <div className="chip-list">
                  {relatedWorkPlan.keyConcepts.map((concept) => (
                    <span className="concept-tag" key={concept}>
                      {concept}
                    </span>
                  ))}
                </div>
              </article>
            </div>

            <section className="related-section">
              <div className="panel-header-row">
                <div>
                  <h3>Related Work Buckets</h3>
                  <p>Use these buckets to organize the eventual literature review and avoid unsupported novelty claims.</p>
                </div>
              </div>

              <div className="related-bucket-grid">
                {relatedWorkPlan.relatedWorkBuckets.map((bucket) => (
                  <RelatedWorkBucketCard bucket={bucket} key={bucket.title} />
                ))}
              </div>
            </section>

            <div className="related-work-bottom-grid">
              <article className="related-card">
                <div className="preview-label">
                  <BookOpenCheck size={16} aria-hidden="true" />
                  <span>Suggested Venues or Sources</span>
                </div>
                <ul className="blueprint-list checklist-list">
                  {relatedWorkPlan.suggestedVenuesOrSources.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="related-card">
                <div className="preview-label">
                  <Search size={16} aria-hidden="true" />
                  <span>Gap-Finding Questions</span>
                </div>
                <ul className="blueprint-list checklist-list">
                  {relatedWorkPlan.literatureGapQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <article className="related-card warning-panel">
              <div className="preview-label">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>Unsupported Claim Warnings</span>
              </div>
              <ul className="blueprint-list checklist-list">
                {relatedWorkPlan.unsupportedClaimWarnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="related-card">
              <div className="preview-label">
                <ArrowRight size={16} aria-hidden="true" />
                <span>Next Steps</span>
              </div>
              <ul className="blueprint-list checklist-list is-checklist">
                {relatedWorkPlan.nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
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

export default RelatedWorkPlanPanel;
