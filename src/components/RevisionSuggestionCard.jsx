import { Check, Clock3, MessageSquareText, Sparkles, X } from 'lucide-react';

function RevisionSuggestionCard({ suggestion, onNoteChange, onStatusChange }) {
  return (
    <article className={`revision-suggestion-card is-${suggestion.status}`}>
      <div className="revision-suggestion-header">
        <div className="revision-suggestion-topline">
          <span className={`priority-badge ${priorityTone(suggestion.priority)}`}>{suggestion.priority}</span>
          <span className="issue-critic-chip">{suggestion.sourceCritic}</span>
          {suggestion.relatedSection ? <span className="issue-section-chip">{suggestion.relatedSection}</span> : null}
        </div>
        <span className={`suggestion-status-pill is-${suggestion.status}`}>{statusLabel(suggestion.status)}</span>
      </div>

      <div className="revision-suggestion-body">
        <div className="blueprint-field">
          <h4>Issue</h4>
          <p>{suggestion.issue}</p>
        </div>

        <div className="blueprint-field">
          <h4>Why It Matters</h4>
          <p>{suggestion.whyItMatters}</p>
        </div>

        <div className="issue-revision-note">
          <Sparkles size={15} aria-hidden="true" />
          <span>{suggestion.suggestedRevision}</span>
        </div>
      </div>

      <div className="revision-decision-row">
        <button
          className={suggestion.status === 'accepted' ? 'primary is-compact' : 'secondary is-compact'}
          type="button"
          onClick={() => onStatusChange(suggestion.id, 'accepted')}
        >
          <Check size={16} aria-hidden="true" />
          Accept
        </button>
        <button
          className={suggestion.status === 'rejected' ? 'secondary is-danger is-compact' : 'ghost is-danger is-compact'}
          type="button"
          onClick={() => onStatusChange(suggestion.id, 'rejected')}
        >
          <X size={16} aria-hidden="true" />
          Reject
        </button>
        <button
          className={suggestion.status === 'deferred' ? 'secondary is-compact' : 'ghost is-compact'}
          type="button"
          onClick={() => onStatusChange(suggestion.id, 'deferred')}
        >
          <Clock3 size={16} aria-hidden="true" />
          Defer
        </button>
      </div>

      <label className="field-label note-field">
        <span>
          <MessageSquareText size={15} aria-hidden="true" />
          Optional Student Note
        </span>
        <textarea
          placeholder="Add a note about why you accepted, rejected, or deferred this revision."
          rows={3}
          value={suggestion.userNote || ''}
          onChange={(event) => onNoteChange(suggestion.id, event.target.value)}
        />
      </label>
    </article>
  );
}

function priorityTone(priority) {
  if (priority === 'High') return 'is-high';
  if (priority === 'Medium') return 'is-medium';
  return 'is-low';
}

function statusLabel(status) {
  if (status === 'accepted') return 'Accepted';
  if (status === 'rejected') return 'Rejected';
  return 'Deferred';
}

export default RevisionSuggestionCard;
