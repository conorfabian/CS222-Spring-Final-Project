import { ArrowRight, CheckCircle2, CircleDot, LockKeyhole, Sparkles } from 'lucide-react';

function WorkflowProgressRail({ activeStep, completedSteps, steps }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  const activeStepData = activeIndex >= 0 ? steps[activeIndex] : steps[0];

  return (
    <aside className="workflow-rail">
      <div className="rail-header">
        <span className="eyebrow">Workflow</span>
        <h2>Proposal Pipeline</h2>
        <p>
          Step {activeIndex >= 0 ? activeIndex + 1 : 1} is active right now: {activeStepData?.title}. The later cards stay
          visible so the demo shows how each stage hands work to the next one.
        </p>
      </div>

      <ol className="workflow-step-list">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep;
          const isComplete = completedSteps.has(step.id) && !isActive;
          const isNext = !isActive && !isComplete && index === activeIndex + 1;
          const isUpcoming = !isActive && !isComplete && !isNext;

          return (
            <li
              className={[
                'workflow-step',
                isActive ? 'is-active' : '',
                isComplete ? 'is-complete' : '',
                isNext ? 'is-next' : '',
                isUpcoming ? 'is-upcoming' : ''
              ].join(' ')}
              key={step.id}
            >
              <div className="step-marker">
                <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="step-icon" aria-hidden="true">
                  {isActive ? <Sparkles size={16} /> : isComplete ? <CheckCircle2 size={16} /> : isNext ? <ArrowRight size={16} /> : <LockKeyhole size={16} />}
                </span>
              </div>

              <div className="step-content">
                <div className="step-topline">
                  <h3>{step.title}</h3>
                  <span className="step-status">
                    {isActive ? (
                      <>
                        <CircleDot size={14} aria-hidden="true" />
                        Current
                      </>
                    ) : isComplete ? (
                      'Complete'
                    ) : isNext ? (
                      'Next'
                    ) : (
                      'Upcoming'
                    )}
                  </span>
                </div>
                <p>{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default WorkflowProgressRail;
