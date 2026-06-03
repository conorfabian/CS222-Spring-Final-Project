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
  completedFieldCount,
  errors,
  hasPreview,
  ideaInput,
  onAnalyze,
  onFieldChange,
  onLoadSample,
  onReset,
  status
}) {
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
          <button className="primary" disabled={status === 'analyzing'} type="submit">
            {status === 'analyzing' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Wand2 size={16} aria-hidden="true" />}
            Analyze Research Idea
          </button>
          <p>{hasPreview ? 'The preview updates the saved Step 1 blueprint.' : 'Generate a preview to see how Stage 2 will use this intake.'}</p>
        </div>
      </form>
    </section>
  );
}

export default IdeaIntakeScreen;
