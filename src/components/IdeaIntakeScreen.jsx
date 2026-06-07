import { Loader2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';

const FIELD_SECTIONS = [
  {
    title: 'Idea Basics',
    description: 'Capture the rough research direction and disciplinary context.',
    fields: [
      ['topic', 'Research topic', 'Example: Citation-grounded proposal assistant for graduate students', 'input'],
      ['domain', 'Field or domain', 'Example: HCI, NLP, educational tools', 'input']
    ]
  },
  {
    title: 'Problem Framing',
    description: 'Explain what problem exists, why it matters, and who benefits if it is solved.',
    fields: [
      ['problem', 'What problem are you trying to solve?', 'Describe the concrete pain point or gap.', 'textarea'],
      ['motivation', 'Why does this problem matter?', 'Explain why the problem is important enough for research.', 'textarea'],
      ['beneficiaries', 'Who benefits from solving it?', 'Students, advisors, labs, researchers, communities, or systems.', 'textarea']
    ]
  },
  {
    title: 'Research Context',
    description: 'Seed later related-work and grounding stages with domain cues.',
    fields: [
      ['keywords', 'Known papers, authors, or keywords', 'Add references, authors, ideas, or search phrases.', 'textarea']
    ]
  },
  {
    title: 'Early Plan',
    description: 'Sketch the likely method, resources, and contribution without overcommitting.',
    fields: [
      ['methods', 'Possible methods or technical approach', 'Describe the workflow, method, or system direction.', 'textarea'],
      ['datasets', 'Possible datasets, tools, or systems', 'List datasets, APIs, documents, examples, or systems.', 'textarea'],
      ['expectedContribution', 'Expected contribution', 'What should the final proposal or system contribute?', 'textarea']
    ]
  },
  {
    title: 'Open Questions',
    description: 'Expose uncertainty so later agents can critique and refine the blueprint.',
    fields: [['uncertainties', 'Uncertainties or missing information', 'What are you still unsure about?', 'textarea']]
  }
];

function IdeaIntakeScreen({
  agentQuestionDrafts,
  agentSession,
  completedFieldCount,
  errors,
  hasPreview,
  ideaInput,
  onAnalyze,
  onApplyFieldSuggestion,
  onFieldChange,
  onLoadSample,
  onQuestionDraftChange,
  onReset,
  onSelectDecision,
  onSubmitQuestionAnswer,
  sourceLabel,
  status
}) {
  const isWorking = status === 'analyzing' || status === 'answering';

  return (
    <section className="intake-panel panel-card">
      <div className="panel-intro">
        <div>
          <span className="eyebrow">Step 1</span>
          <h2>Guided Research Idea Intake</h2>
          <p>
            The goal is not to write the full proposal yet. Capture enough structure now so later stages can build a
            proposal blueprint, critique it, and revise it.
          </p>
        </div>

        <div className="readiness-card">
          <strong>{completedFieldCount}/10 fields captured</strong>
          <span>Topic, problem, and motivation are required for the first blueprint preview.</span>
          <small>{sourceLabel}</small>
        </div>
      </div>

      <div className="action-row">
        <button className="secondary" type="button" onClick={onLoadSample}>
          <Sparkles size={16} aria-hidden="true" />
          Load Sample Idea
        </button>
        <button className="ghost" type="button" onClick={onReset}>
          <RefreshCw size={16} aria-hidden="true" />
          Reset
        </button>
      </div>

      <form
        className="intake-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAnalyze();
        }}
      >
        {FIELD_SECTIONS.map((section) => (
          <section className="form-section" key={section.title}>
            <div className="section-heading">
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>

            <div className="field-grid">
              {section.fields.map(([field, label, placeholder, element]) => (
                <label className={errors[field] ? 'field-label has-error' : 'field-label'} key={field}>
                  <span>{label}</span>
                  {element === 'textarea' ? (
                    <textarea
                      value={ideaInput[field]}
                      onChange={(event) => onFieldChange(field, event.target.value)}
                      placeholder={placeholder}
                    />
                  ) : (
                    <input
                      value={ideaInput[field]}
                      onChange={(event) => onFieldChange(field, event.target.value)}
                      placeholder={placeholder}
                    />
                  )}
                  {errors[field] ? <small>{errors[field]}</small> : null}
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="submit-row">
          <button className="primary" disabled={isWorking} type="submit">
            {isWorking ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />}
            {hasPreview ? 'Refresh Step 1 Agent' : 'Start Step 1 Agent'}
          </button>
          <p>
            {hasPreview
              ? 'The Step 1 agent session updates the saved intake state and keeps later stages in sync.'
              : 'Run the Step 1 agent to generate suggestions, decisions, and clarifying questions.'}
          </p>
        </div>
      </form>

      {agentSession ? (
        <div className="agent-guidance-stack">
          <section className="agent-guidance-card">
            <div className="section-heading">
              <h3>Suggested Field Values</h3>
              <p>Approve only the suggestions that match your intent. They update the same Step 1 agent session.</p>
            </div>

            <div className="agent-card-grid">
              {agentSession.fieldSuggestions.map((suggestion) => (
                <article className="agent-choice-card" key={`${suggestion.field}-${suggestion.label}`}>
                  <div className="agent-choice-header">
                    <div>
                      <strong>{suggestion.label}</strong>
                      <span className="confidence-chip">{suggestion.confidence}</span>
                    </div>
                    <button className="ghost" disabled={isWorking} type="button" onClick={() => onApplyFieldSuggestion(suggestion)}>
                      Use Suggestion
                    </button>
                  </div>
                  <p>{suggestion.value}</p>
                  <small>{suggestion.reason}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="agent-guidance-card">
            <div className="section-heading">
              <h3>Decision Cards</h3>
              <p>Pick the option that best matches the direction you want the proposal to take.</p>
            </div>

            <div className="decision-stack">
              {agentSession.decisions.map((decision) => (
                <article className="agent-choice-card" key={decision.id}>
                  <div className="section-heading compact-heading">
                    <h4>{decision.title}</h4>
                    <p>{decision.question}</p>
                  </div>
                  <div className="decision-option-stack">
                    {decision.options.map((option) => (
                      <button
                        className="decision-option-button"
                        disabled={isWorking}
                        key={`${decision.id}-${option.label}`}
                        type="button"
                        onClick={() => onSelectDecision(decision, option)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.value}</span>
                        <small>{option.rationale}</small>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="agent-guidance-card">
            <div className="section-heading">
              <h3>Remaining Clarifying Questions</h3>
              <p>Answer only the questions that still block a stronger blueprint or proposal draft.</p>
            </div>

            {agentSession.questions.length ? (
              <div className="question-stack">
                {agentSession.questions.map((question) => (
                  <article className="agent-choice-card" key={question.id}>
                    <div className="agent-choice-header">
                      <div>
                        <strong>{question.question}</strong>
                        <span className="confidence-chip">{question.priority}</span>
                      </div>
                    </div>
                    <p>{question.reason}</p>
                    <textarea
                      className="agent-answer-input"
                      placeholder="Type your answer for the Step 1 agent."
                      value={agentQuestionDrafts[question.id] || ''}
                      onChange={(event) => onQuestionDraftChange(question.id, event.target.value)}
                    />
                    <div className="agent-answer-actions">
                      <button
                        className="primary"
                        disabled={isWorking || !agentQuestionDrafts[question.id]?.trim()}
                        type="button"
                        onClick={() => onSubmitQuestionAnswer(question)}
                      >
                        {isWorking ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />}
                        Submit Answer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-plan-copy">No remaining clarifying questions. Step 1 is ready for Step 2.</p>
            )}
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default IdeaIntakeScreen;
