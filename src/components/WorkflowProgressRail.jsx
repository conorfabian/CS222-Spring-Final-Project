import { ArrowRight, CheckCircle2, CircleDot, LockKeyhole, Sparkles, TriangleAlert } from 'lucide-react';

function WorkflowProgressRail({ onSelectStep, selectedStep, stepMetaById, steps }) {
  const activeIndex = steps.findIndex((step) => step.id === selectedStep);
  const activeStepData = activeIndex >= 0 ? steps[activeIndex] : steps[0];

  return (
    <aside className="workflow-rail">
      <div className="rail-header">
        <span className="eyebrow">Workflow</span>
        <h2>Proposal Pipeline</h2>
        <p>
          Step {activeIndex >= 0 ? activeIndex + 1 : 1} is selected: {activeStepData?.title}. Completed earlier steps stay
          revisitable, while locked steps must be regenerated in order.
        </p>
      </div>

      <ol className="workflow-step-list">
        {steps.map((step, index) => {
          const meta = stepMetaById[step.id] || {};
          const stateClass = meta.isSelected
            ? 'is-selected'
            : meta.isLocked
              ? 'is-locked'
              : meta.isStale
                ? 'is-stale'
                : meta.isCompleted
                  ? 'is-complete'
                  : 'is-available';
          const statusLabel = meta.isSelected
            ? 'Selected'
            : meta.isLocked
              ? 'Locked'
              : meta.isStale
                ? 'Refresh next'
                : meta.isCompleted
                  ? 'Complete'
                  : 'Available';

          return (
            <li key={step.id}>
              <button
                aria-current={meta.isSelected ? 'step' : undefined}
                className={`workflow-step ${stateClass}`}
                disabled={meta.isLocked}
                type="button"
                onClick={() => onSelectStep(step.id)}
              >
                <div className="step-marker">
                  <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="step-icon" aria-hidden="true">
                    {meta.isSelected ? (
                      <Sparkles size={16} />
                    ) : meta.isLocked ? (
                      <LockKeyhole size={16} />
                    ) : meta.isStale ? (
                      <TriangleAlert size={16} />
                    ) : meta.isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                  </span>
                </div>

                <div className="step-content">
                  <div className="step-topline">
                    <h3>{step.title}</h3>
                    <span className="step-status">
                      {meta.isSelected ? (
                        <>
                          <CircleDot size={14} aria-hidden="true" />
                          {statusLabel}
                        </>
                      ) : (
                        statusLabel
                      )}
                    </span>
                  </div>
                  <p>{step.description}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default WorkflowProgressRail;
