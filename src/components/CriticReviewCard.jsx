import { AlertTriangle, CheckCircle2, MessageSquareQuote, Sparkles } from 'lucide-react';

function CriticReviewCard({ review }) {
  return (
    <article className="critic-review-card">
      <div className="critic-review-header">
        <div>
          <span className="eyebrow subtle-eyebrow">Critic Review</span>
          <h3>{review.criticName}</h3>
          <p>{review.criticRole}</p>
        </div>

        <div className={`score-badge ${scoreTone(review.score)}`}>
          <span className="score-value">{review.score.toFixed(1)}</span>
          <span className="score-scale">/ 10</span>
        </div>
      </div>

      <div className="critic-summary">
        <div className="preview-label">
          <MessageSquareQuote size={16} aria-hidden="true" />
          <span>Summary</span>
        </div>
        <p>{review.summary}</p>
      </div>

      <div className="critic-review-grid">
        <section className="critic-subsection">
          <div className="preview-label">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>Strengths</span>
          </div>
          <ul className="blueprint-list checklist-list">
            {review.strengths.map((strength) => (
              <li key={`${review.criticName}-${strength}`}>{strength}</li>
            ))}
          </ul>
        </section>

        <section className="critic-subsection critic-issues-section">
          <div className="preview-label">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>Prioritized Issues</span>
          </div>
          <div className="critique-issue-list">
            {review.issues.map((issue) => (
              <article className="critique-issue-card" key={issue.id}>
                <div className="critique-issue-topline">
                  <span className={`priority-badge ${priorityTone(issue.priority)}`}>{issue.priority}</span>
                  {issue.relatedSection ? <span className="issue-section-chip">{issue.relatedSection}</span> : null}
                </div>
                <h4>{issue.issue}</h4>
                <p>{issue.whyItMatters}</p>
                <div className="issue-revision-note">
                  <Sparkles size={15} aria-hidden="true" />
                  <span>{issue.suggestedRevision}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="recommendation-note">
        <strong>Recommendation:</strong> {review.overallRecommendation}
      </div>
    </article>
  );
}

function priorityTone(priority) {
  if (priority === 'High') return 'is-high';
  if (priority === 'Medium') return 'is-medium';
  return 'is-low';
}

function scoreTone(score) {
  if (score >= 7.5) return 'is-strong';
  if (score >= 5.5) return 'is-mixed';
  return 'is-weak';
}

export default CriticReviewCard;
