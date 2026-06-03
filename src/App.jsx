import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, FlaskConical, Save } from 'lucide-react';
import CompletedIdeaSummary from './components/CompletedIdeaSummary.jsx';
import IdeaIntakeScreen from './components/IdeaIntakeScreen.jsx';
import IdeaPreviewPanel from './components/IdeaPreviewPanel.jsx';
import ProposalBlueprintPanel from './components/ProposalBlueprintPanel.jsx';
import RelatedWorkPlanPanel from './components/RelatedWorkPlanPanel.jsx';
import WorkflowProgressRail from './components/WorkflowProgressRail.jsx';

const MEMORY_KEY = 'ai-proposal-studio-stage1-memory-v2';

const WORKFLOW_STEPS = [
  {
    id: 'idea-intake',
    title: 'Idea Intake',
    description: 'Collect the rough research idea in a structured format.'
  },
  {
    id: 'proposal-blueprint',
    title: 'Proposal Blueprint',
    description: 'Turn the intake into a structured scaffold for a stronger proposal.'
  },
  {
    id: 'related-work',
    title: 'Related Work',
    description: 'Use keywords, papers, and domain cues to anchor the proposal in prior work.'
  },
  {
    id: 'research-questions',
    title: 'Research Questions',
    description: 'Refine questions or hypotheses into a clearer research agenda.'
  },
  {
    id: 'method-plan',
    title: 'Method Plan',
    description: 'Convert the blueprint into a stronger method and technical approach.'
  },
  {
    id: 'evaluation-plan',
    title: 'Evaluation Plan',
    description: 'Define metrics, baselines, evidence, and success criteria.'
  },
  {
    id: 'broader-impacts',
    title: 'Broader Impacts',
    description: 'Capture significance, beneficiaries, and broader research value.'
  },
  {
    id: 'critique-revision',
    title: 'Critique & Revision',
    description: 'Run critic agents or review passes to improve weak sections.'
  },
  {
    id: 'version-history',
    title: 'Version History',
    description: 'Save proposal snapshots and accepted revisions over time.'
  }
];

const EMPTY_IDEA_INPUT = {
  topic: '',
  domain: '',
  problem: '',
  motivation: '',
  beneficiaries: '',
  keywords: '',
  methods: '',
  datasets: '',
  expectedContribution: '',
  uncertainties: ''
};

const SAMPLE_IDEA_INPUT = {
  topic: 'Citation-grounded proposal assistant for graduate students',
  domain: 'Human-AI interaction, NLP, and educational tools',
  problem:
    'Graduate students often start with vague research directions and struggle to turn them into structured, graduate-style proposal drafts with clear scope.',
  motivation:
    'Weak early framing leads to unclear methods, missing evaluation plans, and proposals that read like brainstorms instead of credible research arguments.',
  beneficiaries:
    'Graduate students writing proposals, advisors giving early feedback, and instructors evaluating research planning quality.',
  keywords:
    'proposal writing, citation grounding, literature review agents, human-AI collaboration, research planning',
  methods:
    'A staged proposal workflow that collects structured idea intake, surfaces missing information, and later passes the result to blueprint and critic agents.',
  datasets:
    'MIT Communication Lab proposal advice, annotated proposal examples, proposal rubrics, and curated course examples.',
  expectedContribution:
    'A proposal studio workflow that turns rough ideas into a clearer proposal blueprint with explicit gaps, stronger motivation, and revision targets.',
  uncertainties:
    'Need to define the primary student population, choose a baseline against a plain chatbot, and decide how proposal quality improvement will be measured.'
};

function App() {
  const [activeStep, setActiveStep] = useState('idea-intake');
  const [isEditingIdea, setIsEditingIdea] = useState(true);
  const [ideaInput, setIdeaInput] = useState(EMPTY_IDEA_INPUT);
  const [ideaPreview, setIdeaPreview] = useState(null);
  const [analysisMode, setAnalysisMode] = useState(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState('');
  const [errors, setErrors] = useState({});
  const [intakeStatus, setIntakeStatus] = useState('idle');
  const [proposalBlueprint, setProposalBlueprint] = useState(null);
  const [blueprintMode, setBlueprintMode] = useState(null);
  const [blueprintStatus, setBlueprintStatus] = useState('idle');
  const [blueprintError, setBlueprintError] = useState('');
  const [blueprintGeneratedAt, setBlueprintGeneratedAt] = useState('');
  const [blueprintStale, setBlueprintStale] = useState(false);
  const [relatedWorkPlan, setRelatedWorkPlan] = useState(null);
  const [relatedWorkMode, setRelatedWorkMode] = useState(null);
  const [relatedWorkStatus, setRelatedWorkStatus] = useState('idle');
  const [relatedWorkError, setRelatedWorkError] = useState('');
  const [relatedWorkGeneratedAt, setRelatedWorkGeneratedAt] = useState('');
  const [relatedWorkStale, setRelatedWorkStale] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [memoryReady, setMemoryReady] = useState(false);

  const completedFieldCount = useMemo(
    () => Object.values(ideaInput).filter((value) => Boolean(clean(value))).length,
    [ideaInput]
  );

  const completedSteps = useMemo(() => {
    const steps = new Set();

    if (ideaPreview) {
      steps.add('idea-intake');
    }

    if (proposalBlueprint && !blueprintStale) {
      steps.add('proposal-blueprint');
    }

    if (relatedWorkPlan && !relatedWorkStale) {
      steps.add('related-work');
    }

    return steps;
  }, [blueprintStale, ideaPreview, proposalBlueprint, relatedWorkPlan, relatedWorkStale]);

  const currentStepNumber = useMemo(() => {
    const index = WORKFLOW_STEPS.findIndex((step) => step.id === activeStep);
    return index >= 0 ? index + 1 : 1;
  }, [activeStep]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);

      if (!raw) {
        setMemoryReady(true);
        return;
      }

      const snapshot = JSON.parse(raw);
      setActiveStep(snapshot.activeStep || 'idea-intake');
      setIsEditingIdea(Boolean(snapshot.isEditingIdea));
      setIdeaInput({ ...EMPTY_IDEA_INPUT, ...(snapshot.ideaInput || {}) });
      setIdeaPreview(snapshot.ideaPreview || null);
      setAnalysisMode(snapshot.analysisMode || null);
      setLastAnalyzedAt(snapshot.lastAnalyzedAt || '');
      setProposalBlueprint(snapshot.proposalBlueprint || null);
      setBlueprintMode(snapshot.blueprintMode || null);
      setBlueprintGeneratedAt(snapshot.blueprintGeneratedAt || '');
      setBlueprintStale(Boolean(snapshot.blueprintStale));
      setRelatedWorkPlan(snapshot.relatedWorkPlan || null);
      setRelatedWorkMode(snapshot.relatedWorkMode || null);
      setRelatedWorkGeneratedAt(snapshot.relatedWorkGeneratedAt || '');
      setRelatedWorkStale(Boolean(snapshot.relatedWorkStale));
      setNotice(snapshot.notice || '');
      setError('');
    } catch {
      setError('Saved workspace data could not be loaded. Resetting to a clean workspace.');
      localStorage.removeItem(MEMORY_KEY);
    } finally {
      setMemoryReady(true);
    }
  }, []);

  useEffect(() => {
    if (!memoryReady) return;

    if (!hasWorkspaceContent(ideaInput, ideaPreview, proposalBlueprint, relatedWorkPlan)) {
      localStorage.removeItem(MEMORY_KEY);
      return;
    }

    const snapshot = {
      activeStep,
      isEditingIdea,
      ideaInput,
      ideaPreview,
      analysisMode,
      lastAnalyzedAt,
      proposalBlueprint,
      blueprintMode,
      blueprintGeneratedAt,
      blueprintStale,
      relatedWorkPlan,
      relatedWorkMode,
      relatedWorkGeneratedAt,
      relatedWorkStale,
      notice
    };

    localStorage.setItem(MEMORY_KEY, JSON.stringify(snapshot));
  }, [
    activeStep,
    analysisMode,
    blueprintGeneratedAt,
    blueprintMode,
    blueprintStale,
    ideaInput,
    ideaPreview,
    isEditingIdea,
    lastAnalyzedAt,
    memoryReady,
    notice,
    proposalBlueprint,
    relatedWorkGeneratedAt,
    relatedWorkMode,
    relatedWorkPlan,
    relatedWorkStale
  ]);

  function handleFieldChange(field, value) {
    setIdeaInput((current) => ({
      ...current,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }

    const hasBlueprint = Boolean(proposalBlueprint);
    const hasRelatedWork = Boolean(relatedWorkPlan);

    if (hasBlueprint && !blueprintStale) {
      setBlueprintStale(true);
    }

    if (hasRelatedWork && !relatedWorkStale) {
      setRelatedWorkStale(true);
    }

    if (hasBlueprint || hasRelatedWork) {
      setNotice(
        hasRelatedWork
          ? 'Step 1 changed. Regenerate the proposal blueprint and related work plan before using later workflow stages.'
          : 'Step 1 changed. Regenerate the proposal blueprint before using later workflow stages.'
      );
    }
  }

  function handleLoadSample() {
    setActiveStep('idea-intake');
    setIsEditingIdea(true);
    setIdeaInput(SAMPLE_IDEA_INPUT);
    setIdeaPreview(null);
    setAnalysisMode(null);
    setLastAnalyzedAt('');
    setProposalBlueprint(null);
    setBlueprintMode(null);
    setBlueprintStatus('idle');
    setBlueprintError('');
    setBlueprintGeneratedAt('');
    setBlueprintStale(false);
    setRelatedWorkPlan(null);
    setRelatedWorkMode(null);
    setRelatedWorkStatus('idle');
    setRelatedWorkError('');
    setRelatedWorkGeneratedAt('');
    setRelatedWorkStale(false);
    setErrors({});
    setError('');
    setNotice('Sample idea loaded. Analyze it to generate the Step 1 preview.');
  }

  function handleReset() {
    setActiveStep('idea-intake');
    setIsEditingIdea(true);
    setIdeaInput(EMPTY_IDEA_INPUT);
    setIdeaPreview(null);
    setAnalysisMode(null);
    setLastAnalyzedAt('');
    setProposalBlueprint(null);
    setBlueprintMode(null);
    setBlueprintStatus('idle');
    setBlueprintError('');
    setBlueprintGeneratedAt('');
    setBlueprintStale(false);
    setRelatedWorkPlan(null);
    setRelatedWorkMode(null);
    setRelatedWorkStatus('idle');
    setRelatedWorkError('');
    setRelatedWorkGeneratedAt('');
    setRelatedWorkStale(false);
    setErrors({});
    setError('');
    setNotice('');
    localStorage.removeItem(MEMORY_KEY);
  }

  function handleEditIdeaIntake() {
    setActiveStep('idea-intake');
    setIsEditingIdea(true);
    setBlueprintError('');
    setRelatedWorkError('');
    setNotice(
      relatedWorkPlan
        ? 'Edit the idea intake, then re-analyze Step 1 before regenerating Steps 2 and 3.'
        : proposalBlueprint
          ? 'Edit the idea intake, then re-analyze Step 1 before regenerating Step 2.'
          : ''
    );
  }

  function handleAnalyzeIdea() {
    const normalizedInput = normalizeIdeaInput(ideaInput);
    const validationErrors = validateIdeaInput(normalizedInput);

    setErrors(validationErrors);
    setError('');
    setBlueprintError('');

    if (Object.keys(validationErrors).length) {
      setIdeaPreview(null);
      setAnalysisMode(null);
      setActiveStep('idea-intake');
      setIsEditingIdea(true);
      setNotice('Fill the required research fields before generating the preview.');
      return;
    }

    const templatePreview = buildTemplatePreview(normalizedInput);
    const analyzedAt = new Date().toISOString();

    setIntakeStatus('analyzing');
    setIdeaInput(normalizedInput);
    setIdeaPreview(templatePreview);
    setAnalysisMode('template');
    setLastAnalyzedAt(analyzedAt);
    setActiveStep('idea-intake');
    setIsEditingIdea(false);
    setBlueprintStale(Boolean(proposalBlueprint));
    setRelatedWorkStale(Boolean(relatedWorkPlan));
    setNotice(
      relatedWorkPlan
        ? 'Step 1 updated. Regenerate the proposal blueprint and related work plan to sync Steps 2 and 3.'
        : proposalBlueprint
          ? 'Step 1 updated. Regenerate the proposal blueprint to sync Step 2 with the latest intake.'
          : 'Step 1 complete. Generate the proposal blueprint to move into Step 2.'
    );
    setIntakeStatus('idle');
  }

  async function handleGenerateProposalBlueprint() {
    if (!ideaPreview) {
      setNotice('Complete Step 1 first so the proposal blueprint has a validated intake summary.');
      return;
    }

    setActiveStep('proposal-blueprint');
    setIsEditingIdea(false);
    setBlueprintStatus('generating');
    setBlueprintError('');
    setRelatedWorkError('');
    setError('');

    try {
      const data = await postJson('/api/blueprint', {
        ideaInput,
        ideaPreview
      });

      setProposalBlueprint(data.blueprint || null);
      setBlueprintMode(data.mode === 'api' ? 'api' : 'template');
      setBlueprintGeneratedAt(new Date().toISOString());
      setBlueprintStale(false);
      setRelatedWorkStale(Boolean(relatedWorkPlan));
      setBlueprintStatus('idle');
      setNotice(
        relatedWorkPlan
          ? 'Proposal blueprint refreshed. Regenerate Step 3 so the related work plan matches the latest scaffold.'
          : data.mode === 'api'
            ? 'Proposal blueprint generated with Gemini and saved as Step 2.'
            : 'Proposal blueprint generated from the deterministic Stage 1 fallback.'
      );
    } catch (requestError) {
      const fallbackBlueprint = buildClientFallbackBlueprint(ideaInput, ideaPreview);

      setProposalBlueprint(fallbackBlueprint);
      setBlueprintMode('template');
      setBlueprintGeneratedAt(new Date().toISOString());
      setBlueprintStale(false);
      setRelatedWorkStale(Boolean(relatedWorkPlan));
      setBlueprintStatus('idle');
      setBlueprintError('');
      setNotice(
        `Blueprint API was unavailable, so the app used the deterministic demo fallback instead. ${readError(requestError)}`
      );
    }
  }

  async function handleGenerateRelatedWorkPlan() {
    if (!proposalBlueprint) {
      setNotice('Generate Step 2 first so the related work plan has a proposal scaffold to analyze.');
      return;
    }

    if (blueprintStale) {
      setNotice('Refresh Step 2 before generating Step 3 so the literature plan matches the latest blueprint.');
      return;
    }

    setActiveStep('related-work');
    setIsEditingIdea(false);
    setRelatedWorkStatus('generating');
    setRelatedWorkError('');
    setError('');

    try {
      const data = await postJson('/api/related-work', {
        ideaInput,
        proposalBlueprint
      });

      setRelatedWorkPlan(data.relatedWorkPlan || null);
      setRelatedWorkMode(data.mode === 'api' ? 'api' : 'template');
      setRelatedWorkGeneratedAt(new Date().toISOString());
      setRelatedWorkStale(false);
      setRelatedWorkStatus('idle');
      setNotice(
        data.mode === 'api'
          ? 'Related work plan generated with Gemini and saved as Step 3.'
          : 'Related work plan generated from the deterministic Stage 1 fallback.'
      );
    } catch (requestError) {
      const fallbackPlan = buildClientFallbackRelatedWorkPlan(ideaInput, proposalBlueprint);

      setRelatedWorkPlan(fallbackPlan);
      setRelatedWorkMode('template');
      setRelatedWorkGeneratedAt(new Date().toISOString());
      setRelatedWorkStale(false);
      setRelatedWorkStatus('idle');
      setRelatedWorkError('');
      setNotice(
        `Related-work API was unavailable, so the app used the deterministic demo fallback instead. ${readError(requestError)}`
      );
    }
  }

  const showingEditor = isEditingIdea || !ideaPreview;

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <div className="header-copy">
          <span className="eyebrow">Stage 1 Prototype</span>
          <h1>AI Proposal Studio</h1>
          <p>
            Guide a rough research idea into a stronger proposal workflow. This screen now carries the user from structured
            idea intake into a proposal blueprint scaffold.
          </p>
        </div>

        <div className="header-status-group">
          <span className="status-pill current-step">
            <FlaskConical size={16} aria-hidden="true" />
            Step {currentStepNumber} of {WORKFLOW_STEPS.length}
          </span>
          <span className="status-pill save-status">
            <Save size={16} aria-hidden="true" />
            Auto-saves locally
          </span>
        </div>
      </header>

      <section className="studio-body">
        <WorkflowProgressRail activeStep={activeStep} completedSteps={completedSteps} steps={WORKFLOW_STEPS} />

        <section className="studio-main">
          {(notice || error) && (
            <div className="banner-stack">
              {notice ? <p className="info-banner">{notice}</p> : null}
              {error ? (
                <p className="error-banner">
                  <AlertCircle size={16} aria-hidden="true" />
                  {error}
                </p>
              ) : null}
            </div>
          )}

          {showingEditor ? (
            <div className="workspace-grid">
              <IdeaIntakeScreen
                completedFieldCount={completedFieldCount}
                errors={errors}
                hasPreview={Boolean(ideaPreview)}
                ideaInput={ideaInput}
                onAnalyze={handleAnalyzeIdea}
                onFieldChange={handleFieldChange}
                onLoadSample={handleLoadSample}
                onReset={handleReset}
                status={intakeStatus}
              />

              <IdeaPreviewPanel
                analysisMode={analysisMode}
                ideaInput={ideaInput}
                ideaPreview={ideaPreview}
                lastAnalyzedAt={lastAnalyzedAt}
                status={intakeStatus}
              />
            </div>
          ) : activeStep === 'idea-intake' ? (
            <div className="workspace-grid summary-grid">
              <CompletedIdeaSummary
                blueprintExists={Boolean(proposalBlueprint)}
                blueprintStale={blueprintStale}
                blueprintStatus={blueprintStatus}
                ideaInput={ideaInput}
                ideaPreview={ideaPreview}
                lastAnalyzedAt={lastAnalyzedAt}
                onEdit={handleEditIdeaIntake}
                onGenerateBlueprint={handleGenerateProposalBlueprint}
              />

              <IdeaPreviewPanel
                analysisMode={analysisMode}
                ideaInput={ideaInput}
                ideaPreview={ideaPreview}
                lastAnalyzedAt={lastAnalyzedAt}
                status={intakeStatus}
              />
            </div>
          ) : (
            <div className="blueprint-workspace">
              <CompletedIdeaSummary
                blueprintExists={Boolean(proposalBlueprint)}
                blueprintStale={blueprintStale}
                blueprintStatus={blueprintStatus}
                ideaInput={ideaInput}
                ideaPreview={ideaPreview}
                lastAnalyzedAt={lastAnalyzedAt}
                onEdit={handleEditIdeaIntake}
                onGenerateBlueprint={handleGenerateProposalBlueprint}
              />

              <ProposalBlueprintPanel
                blueprint={proposalBlueprint}
                blueprintError={blueprintError}
                blueprintGeneratedAt={blueprintGeneratedAt}
                blueprintMode={blueprintMode}
                blueprintStatus={blueprintStatus}
                blueprintStale={blueprintStale}
                onGenerate={handleGenerateProposalBlueprint}
                onGenerateRelatedWork={handleGenerateRelatedWorkPlan}
                relatedWorkPlanExists={Boolean(relatedWorkPlan)}
                relatedWorkStale={relatedWorkStale}
                relatedWorkStatus={relatedWorkStatus}
              />

              {activeStep === 'related-work' || relatedWorkPlan || relatedWorkStatus !== 'idle' ? (
                <RelatedWorkPlanPanel
                  onGenerate={handleGenerateRelatedWorkPlan}
                  relatedWorkError={relatedWorkError}
                  relatedWorkGeneratedAt={relatedWorkGeneratedAt}
                  relatedWorkMode={relatedWorkMode}
                  relatedWorkPlan={relatedWorkPlan}
                  relatedWorkStale={relatedWorkStale}
                  relatedWorkStatus={relatedWorkStatus}
                />
              ) : null}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function buildTemplatePreview(ideaInput) {
  const missingInformation = collectMissingInformation(ideaInput);

  return {
    detectedTopic: joinSegments([ideaInput.topic, ideaInput.domain && `Domain: ${ideaInput.domain}`]),
    problem: ideaInput.problem,
    motivation: joinSegments([
      ideaInput.motivation,
      ideaInput.beneficiaries && `Primary beneficiaries: ${ideaInput.beneficiaries}`
    ]),
    possibleContribution: ideaInput.expectedContribution || inferContribution(ideaInput),
    missingInformation
  };
}

function validateIdeaInput(ideaInput) {
  const nextErrors = {};

  if (!ideaInput.topic) nextErrors.topic = 'Research topic is required.';
  if (!ideaInput.problem) nextErrors.problem = 'Problem framing is required.';
  if (!ideaInput.motivation) nextErrors.motivation = 'Why the problem matters is required.';

  return nextErrors;
}

function normalizeIdeaInput(ideaInput) {
  return Object.fromEntries(
    Object.entries(ideaInput).map(([key, value]) => [
      key,
      typeof value === 'string'
        ? value
            .split('\n')
            .map((line) => line.trim())
            .join('\n')
            .trim()
        : ''
    ])
  );
}

function collectMissingInformation(ideaInput) {
  const missing = [];

  if (!ideaInput.beneficiaries) missing.push('Identify the primary user or stakeholder group that benefits from solving the problem.');
  if (!ideaInput.keywords) missing.push('Add known papers, authors, or search keywords to support later related-work retrieval.');
  if (!ideaInput.methods) missing.push('Clarify the possible technical method or workflow the project will explore.');
  if (!ideaInput.datasets) missing.push('List candidate datasets, tools, systems, or reference materials that the workflow may rely on.');
  if (!ideaInput.expectedContribution) missing.push('State the expected research contribution or output of the project.');
  if (ideaInput.uncertainties) missing.push(`Open uncertainties: ${ideaInput.uncertainties}`);

  if (!missing.length) {
    missing.push('Define the evaluation rubric, comparison baseline, and student population in the next workflow stage.');
  }

  return missing;
}

function inferContribution(ideaInput) {
  if (ideaInput.methods) {
    return `A structured proposal blueprint built from ${ideaInput.methods.toLowerCase()} and used as the handoff to later planning and critique stages.`;
  }

  return `A stronger proposal blueprint for ${ideaInput.topic.toLowerCase()} with clearer motivation, scope, and missing-information flags.`;
}

function buildClientFallbackBlueprint(ideaInput, ideaPreview) {
  const contribution = clean(ideaInput.expectedContribution) || ideaPreview?.possibleContribution || inferContribution(ideaInput);
  const missingInformation = [...new Set([...(ideaPreview?.missingInformation || []), ...collectMissingInformation(ideaInput)])].slice(0, 6);

  return {
    workingTitle: titleCase(ideaInput.topic || 'Research Proposal Blueprint'),
    oneSentenceSummary: `${titleCase(ideaInput.topic || 'This project')} organizes the rough idea into a proposal scaffold for ${ideaInput.domain || 'the target research area'}.`,
    problemStatement:
      ideaInput.problem || 'The problem statement still needs a concrete user, context, and consequence before final drafting.',
    motivation:
      joinSegments([
        ideaInput.motivation,
        ideaInput.beneficiaries ? `Primary beneficiaries: ${ideaInput.beneficiaries}` : ''
      ]) || 'The proposal still needs a stronger explanation of why the problem matters.',
    researchGap: `Current support around ${ideaInput.keywords || ideaInput.domain || 'this topic'} does not yet clearly turn rough research ideas into structured proposal components with explicit evaluation and revision logic.`,
    proposedContribution: contribution,
    researchQuestions: [
      `How can ${ideaInput.topic || 'this workflow'} preserve the student's original intent while sharpening the proposal structure?`,
      'What information must be surfaced early so critique and revision stages can improve the proposal effectively?',
      'How should the workflow demonstrate that the blueprint is stronger than the original rough idea?'
    ],
    hypotheses: [
      'A structured blueprint stage will surface missing proposal components earlier than free-form drafting alone.',
      'Explicitly framing the research gap, contribution, and evaluation plan will make later revisions more focused and credible.'
    ],
    proposedMethod:
      ideaInput.methods ||
      'Use the intake data to draft a research-oriented scaffold, surface missing information, and pass the result into later critique and revision stages.',
    datasetsToolsSystems: ideaInput.datasets || 'Candidate datasets, tools, and systems still need to be selected for the method plan.',
    evaluationPlan:
      'Compare the original rough idea against the generated blueprint for clarity, proposal-section coverage, feasibility, and readiness for critique.',
    expectedResults: `${contribution} The expected result is a clearer proposal scaffold that is easier to critique and revise in later stages.`,
    intellectualMerit: `The blueprint sharpens the proposal logic in ${ideaInput.domain || 'the target domain'} and makes the contribution more explicit: ${contribution}`,
    broaderImpacts:
      ideaInput.beneficiaries
        ? `The work could benefit ${ideaInput.beneficiaries} by making early-stage proposal development more structured and easier to revise.`
        : 'The work could broaden access to stronger proposal development by helping students and advisors identify missing research logic earlier.',
    missingInformation,
    suggestedNextSteps: [
      'Confirm that the blueprint framing matches the original research intent.',
      'Gather related work using the topic, keywords, and research gap.',
      'Strengthen the evaluation plan with concrete metrics or comparison criteria.',
      'Run a critique pass focused on scope, novelty, and unsupported assumptions.'
    ]
  };
}

function buildClientFallbackRelatedWorkPlan(ideaInput, proposalBlueprint) {
  const keyConcepts = dedupeStrings(
    [
      ideaInput.topic,
      ideaInput.domain,
      ideaInput.keywords,
      ideaInput.methods,
      ideaInput.datasets,
      proposalBlueprint.proposedContribution,
      proposalBlueprint.researchGap,
      ...(proposalBlueprint.researchQuestions || [])
    ]
      .flatMap(splitKeywords)
      .filter(Boolean)
  ).slice(0, 12);

  const relatedWorkBuckets = [
    {
      title: `Problem framing in ${ideaInput.domain || 'the target domain'}`,
      description: `Look for papers that define the core problem, stakeholders, and failure modes around ${ideaInput.problem || ideaInput.topic || 'this research area'}.`,
      whyItMatters: 'This bucket gives the proposal a grounded motivation and reduces unsupported assumptions about the problem.',
      exampleSearchTerms: dedupeStrings([keyConcepts[0], keyConcepts[1], 'problem framing', ideaInput.domain]).slice(0, 4)
    },
    {
      title: 'Methods and workflow approaches',
      description: `Search for systems or methods related to ${ideaInput.methods || proposalBlueprint.proposedMethod || ideaInput.topic || 'the proposed approach'}.`,
      whyItMatters: 'This bucket helps compare the proposed method against adjacent technical patterns and prior workflows.',
      exampleSearchTerms: dedupeStrings(splitKeywords(ideaInput.methods || proposalBlueprint.proposedMethod).concat(['workflow', 'method'])).slice(0, 4)
    },
    {
      title: 'Evaluation and benchmark design',
      description: `Find work that evaluates similar systems, rubrics, or benchmarks connected to ${proposalBlueprint.evaluationPlan || ideaInput.topic || 'the proposal topic'}.`,
      whyItMatters: 'This bucket helps the proposal borrow credible metrics, baselines, and evidence patterns.',
      exampleSearchTerms: dedupeStrings(splitKeywords(proposalBlueprint.evaluationPlan).concat(['evaluation', 'benchmark', 'baseline'])).slice(0, 4)
    },
    {
      title: 'Contribution and novelty comparisons',
      description: `Gather papers making claims similar to ${proposalBlueprint.proposedContribution || ideaInput.expectedContribution || 'the proposed contribution'}.`,
      whyItMatters: 'This bucket helps test whether the contribution is actually distinct after real sources are reviewed.',
      exampleSearchTerms: dedupeStrings(splitKeywords(proposalBlueprint.proposedContribution || ideaInput.expectedContribution).concat(['novelty', 'comparison'])).slice(0, 4)
    }
  ];

  if (clean(ideaInput.datasets) || clean(proposalBlueprint.datasetsToolsSystems)) {
    relatedWorkBuckets.push({
      title: 'Datasets, tools, and systems',
      description: `Review source materials connected to ${ideaInput.datasets || proposalBlueprint.datasetsToolsSystems}.`,
      whyItMatters: 'This bucket grounds the method in concrete resources and reproducibility constraints.',
      exampleSearchTerms: dedupeStrings(splitKeywords(ideaInput.datasets || proposalBlueprint.datasetsToolsSystems).concat(['dataset', 'tool', 'system'])).slice(0, 4)
    });
  }

  return {
    searchQueries: dedupeStrings([
      joinSegments([ideaInput.topic, ideaInput.domain, 'related work']),
      joinSegments([keyConcepts[0], keyConcepts[1], 'survey']),
      joinSegments([ideaInput.topic, ideaInput.methods || proposalBlueprint.proposedMethod, 'evaluation']),
      joinSegments([proposalBlueprint.researchGap, 'search query']),
      joinSegments([proposalBlueprint.proposedContribution, 'baseline comparison']),
      joinSegments([ideaInput.topic, 'critique', 'revision', 'proposal'])
    ]).slice(0, 8),
    keyConcepts,
    relatedWorkBuckets,
    suggestedVenuesOrSources: buildSuggestedVenueHints(ideaInput.domain),
    literatureGapQuestions: [
      `What existing research already addresses problems close to ${ideaInput.topic || 'this proposal'}?`,
      `How do prior methods evaluate ideas similar to ${proposalBlueprint.proposedMethod || ideaInput.methods || 'the proposed method'}?`,
      'Where does the literature disagree on the best framing, metric, or baseline for this problem?',
      'Which claims in the proposal would remain weak without real literature support?'
    ],
    unsupportedClaimWarnings: [
      'Do not claim novelty until related work is retrieved and compared against the proposal contribution.',
      'Do not cite specific papers, authors, or venues until the sources are actually found and verified.',
      'Do not claim improvement over baselines before the evaluation plan and comparison targets are defined.',
      clean(ideaInput.datasets) || clean(proposalBlueprint.datasetsToolsSystems)
        ? 'Treat dataset or tool choices as provisional until real prior work shows they are appropriate.'
        : 'Avoid feasibility or reproducibility claims until candidate datasets, tools, or systems are identified.'
    ],
    nextSteps: [
      'Run each query in a real academic search tool and save promising sources by bucket.',
      'Find at least one survey, one methods paper, and one evaluation or benchmark paper.',
      'Map retrieved sources back to the proposal problem statement, research gap, and evaluation plan.',
      'Revise contribution or novelty language that the literature does not support.'
    ]
  };
}

function hasWorkspaceContent(ideaInput, ideaPreview, proposalBlueprint, relatedWorkPlan) {
  return (
    Object.values(ideaInput).some((value) => Boolean(clean(value))) ||
    Boolean(ideaPreview) ||
    Boolean(proposalBlueprint) ||
    Boolean(relatedWorkPlan)
  );
}

async function postJson(url, body) {
  const apiBases = getApiBaseCandidates();
  let lastError = new Error('Request failed.');

  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const text = await response.text();
      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          if (!response.ok) {
            throw new Error(extractResponseError(text));
          }

          throw new Error(text.slice(0, 180));
        }
      }

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Request failed.');
      }

      return data;
    } catch (requestError) {
      lastError = requestError instanceof Error ? requestError : new Error('Request failed.');
    }
  }

  throw lastError;
}

function joinSegments(parts) {
  return parts.filter(Boolean).join(' ');
}

function splitKeywords(value) {
  return clean(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeStrings(values) {
  const seen = new Set();

  return values.filter((value) => {
    const cleaned = clean(value);
    if (!cleaned) return false;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSuggestedVenueHints(domain) {
  const normalized = clean(domain).toLowerCase();
  const venues = ['Survey papers and literature reviews', 'Semantic Scholar keyword search', 'Google Scholar keyword search', 'arXiv for recent preprints'];

  if (/human-ai|hci|interaction|user/.test(normalized)) {
    venues.push('CHI, CSCW, and IUI venue families');
  }

  if (/nlp|language|llm|natural language/.test(normalized)) {
    venues.push('ACL, EMNLP, NAACL, and Findings venue families');
  }

  if (/machine learning|deep learning|ai|reasoning/.test(normalized)) {
    venues.push('NeurIPS, ICML, and ICLR venue families');
  }

  if (/education|learning|student|teaching/.test(normalized)) {
    venues.push('LAK, EDM, and AIED venue families');
  }

  venues.push('Annotated proposal examples and proposal guides for structure-only grounding');

  return dedupeStrings(venues).slice(0, 8);
}

function getApiBaseCandidates() {
  if (typeof window === 'undefined') {
    return [''];
  }

  const hostname = window.location.hostname;
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(hostname);
  const candidates = [''];

  if (import.meta.env.DEV || isLocalHost) {
    candidates.unshift(`http://${hostname || '127.0.0.1'}:8787`, 'http://127.0.0.1:8787', 'http://localhost:8787');
  }

  return dedupeStrings(candidates);
}

function extractResponseError(text) {
  const compact = text.replace(/\s+/g, ' ').trim();
  const preMatch = compact.match(/<pre>(.*?)<\/pre>/i);

  if (preMatch?.[1]) {
    return preMatch[1];
  }

  return compact.slice(0, 180) || 'Request failed.';
}

function titleCase(value) {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function readError(error) {
  return error instanceof Error ? error.message : 'Request failed.';
}

export default App;
