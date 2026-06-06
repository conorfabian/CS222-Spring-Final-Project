import { GitCompareArrows, Sparkles } from 'lucide-react';

function VersionComparisonPanel({ proposalVersions, versionComparison }) {
  const beforeVersion = proposalVersions.find((version) => version.id === versionComparison?.beforeVersionId) || null;
  const afterVersion = proposalVersions.find((version) => version.id === versionComparison?.afterVersionId) || null;

  return (
    <article className="version-comparison-panel">
      <div className="preview-label">
        <GitCompareArrows size={16} aria-hidden="true" />
        <span>Before / After Comparison</span>
      </div>

      {!versionComparison || !beforeVersion || !afterVersion ? (
        <div className="comparison-empty-state">
          <h3>Comparison pending</h3>
          <p>Apply accepted revisions to generate a saved before/after blueprint comparison.</p>
        </div>
      ) : (
        <div className="comparison-stack">
          <article className="apply-summary-card comparison-summary-card">
            <div className="comparison-version-row">
              <span className="issue-section-chip">{beforeVersion.label}</span>
              <span className="comparison-arrow" aria-hidden="true">
                →
              </span>
              <span className="issue-section-chip">{afterVersion.label}</span>
            </div>
            <div className="issue-revision-note">
              <Sparkles size={15} aria-hidden="true" />
              <span>{versionComparison.overallImprovementSummary}</span>
            </div>
          </article>

          {versionComparison.changedSections.length ? (
            <div className="comparison-section-list">
              {versionComparison.changedSections.map((section) => (
                <article className="comparison-section-card" key={section.sectionName}>
                  <div className="comparison-section-header">
                    <h3>{section.sectionName}</h3>
                    <span className="priority-badge is-medium">Changed</span>
                  </div>

                  <div className="comparison-columns">
                    <div className="comparison-column">
                      <h4>Before</h4>
                      <ComparisonValue value={section.before} />
                    </div>
                    <div className="comparison-column is-after">
                      <h4>After</h4>
                      <ComparisonValue value={section.after} />
                    </div>
                  </div>

                  <div className="comparison-explanation">
                    <strong>Why this changed:</strong> {section.explanation}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-plan-copy">No changed sections were detected between the selected versions.</p>
          )}
        </div>
      )}
    </article>
  );
}

function ComparisonValue({ value }) {
  if (Array.isArray(value)) {
    return value.length ? (
      <ul className="blueprint-list version-summary-list">
        {value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="empty-plan-copy">No content saved for this section.</p>
    );
  }

  return <p>{value || 'No content saved for this section.'}</p>;
}

export default VersionComparisonPanel;
