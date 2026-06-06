import { ArrowRight, CheckCircle2, Clock3, History, Target } from 'lucide-react';

function VersionHistoryPanel({ currentVersionId, onSelectVersionComparison, proposalVersions, selectedComparison }) {
  return (
    <article className="version-history-panel">
      <div className="preview-label">
        <History size={16} aria-hidden="true" />
        <span>Version History</span>
      </div>

      {!proposalVersions.length ? (
        <p className="empty-plan-copy">No versions have been saved yet.</p>
      ) : (
        <div className="version-history-list">
          {proposalVersions.map((version, index) => {
            const isCurrent = version.id === currentVersionId;
            const canCompare = index > 0;
            const isSelected = selectedComparison?.afterVersionId === version.id;

            return (
              <article
                className={`version-history-item${isCurrent ? ' is-current' : ''}${isSelected ? ' is-selected' : ''}`}
                key={version.id}
              >
                <div className="version-history-topline">
                  <div>
                    <h3>{version.label}</h3>
                    <p>{formatVersionDate(version.createdAt)}</p>
                  </div>
                  {isCurrent ? (
                    <span className="issue-section-chip">
                      <CheckCircle2 size={14} aria-hidden="true" />
                      Current Version
                    </span>
                  ) : null}
                </div>

                <div className="version-history-meta">
                  <span>
                    <Target size={15} aria-hidden="true" />
                    {version.appliedSuggestions?.length || 0} applied suggestions
                  </span>
                  {typeof version.scoreBefore === 'number' ? (
                    <span>
                      <Clock3 size={15} aria-hidden="true" />
                      Prior critique score {version.scoreBefore.toFixed(1)} / 10
                    </span>
                  ) : null}
                </div>

                {version.changeSummary?.length ? (
                  <ul className="blueprint-list version-summary-list">
                    {version.changeSummary.slice(0, 2).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}

                <button className="ghost version-compare-button" disabled={!canCompare} type="button" onClick={() => onSelectVersionComparison(version.id)}>
                  <ArrowRight size={16} aria-hidden="true" />
                  {canCompare ? `Compare ${proposalVersions[index - 1].label.split(': ')[0]} -> ${version.label.split(': ')[0]}` : 'Baseline version'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </article>
  );
}

function formatVersionDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Saved recently';

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default VersionHistoryPanel;
