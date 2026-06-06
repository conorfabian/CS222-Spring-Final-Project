import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, FlaskConical, Save } from 'lucide-react';
import CompletedIdeaSummary from './components/CompletedIdeaSummary.jsx';
import ApplyRevisionsPanel from './components/ApplyRevisionsPanel.jsx';
import CritiquePanel from './components/CritiquePanel.jsx';
import IdeaIntakeScreen from './components/IdeaIntakeScreen.jsx';
import IdeaPreviewPanel from './components/IdeaPreviewPanel.jsx';
import ProposalBlueprintPanel from './components/ProposalBlueprintPanel.jsx';
import ProposalOutputPanel from './components/ProposalOutputPanel.jsx';
import RelatedWorkPlanPanel from './components/RelatedWorkPlanPanel.jsx';
import RevisionPlanningPanel from './components/RevisionPlanningPanel.jsx';
import WorkflowProgressRail from './components/WorkflowProgressRail.jsx';
import { renderProposalPdfBytes } from '../shared/proposalPdfRenderer.js';

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
    id: 'multi-agent-critique',
    title: 'Multi-Agent Critique',
    description: 'Run multiple proposal critics to score weaknesses and prioritize revisions.'
  },
  {
    id: 'revision-planning',
    title: 'Revision Planning',
    description: 'Accept, reject, or defer critique suggestions and turn them into a student-controlled revision plan.'
  },
  {
    id: 'apply-revisions',
    title: 'Apply Revisions & Version History',
    description: 'Apply accepted suggestions, save before/after blueprint versions, and compare proposal improvement.'
  },
  {
    id: 'proposal-output',
    title: 'Proposal Output',
    description: 'Show the current proposal artifact as a compile-ready PDF and LaTeX document.'
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

const PROPOSAL_BLUEPRINT_FIELDS = [
  { key: 'workingTitle', label: 'Working Title' },
  { key: 'oneSentenceSummary', label: 'One-Sentence Summary' },
  { key: 'problemStatement', label: 'Problem Statement' },
  { key: 'motivation', label: 'Motivation / Why This Matters' },
  { key: 'researchGap', label: 'Research Gap' },
  { key: 'proposedContribution', label: 'Proposed Contribution' },
  { key: 'researchQuestions', label: 'Research Questions' },
  { key: 'hypotheses', label: 'Hypotheses' },
  { key: 'proposedMethod', label: 'Proposed Method / Technical Approach' },
  { key: 'datasetsToolsSystems', label: 'Possible Datasets, Tools, or Systems' },
  { key: 'evaluationPlan', label: 'Evaluation Plan' },
  { key: 'expectedResults', label: 'Expected Results' },
  { key: 'intellectualMerit', label: 'Intellectual Merit' },
  { key: 'broaderImpacts', label: 'Broader Impacts' },
  { key: 'missingInformation', label: 'Missing Information / Clarifying Questions' },
  { key: 'suggestedNextSteps', label: 'Suggested Next Steps' }
];

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
  const [critiquePanelResult, setCritiquePanelResult] = useState(null);
  const [critiqueMode, setCritiqueMode] = useState(null);
  const [critiqueStatus, setCritiqueStatus] = useState('idle');
  const [critiqueError, setCritiqueError] = useState('');
  const [critiqueGeneratedAt, setCritiqueGeneratedAt] = useState('');
  const [critiqueStale, setCritiqueStale] = useState(false);
  const [revisionSuggestions, setRevisionSuggestions] = useState([]);
  const [revisionPlan, setRevisionPlan] = useState(null);
  const [revisionPlanStale, setRevisionPlanStale] = useState(false);
  const [revisionPlanUpdatedAt, setRevisionPlanUpdatedAt] = useState('');
  const [proposalVersions, setProposalVersions] = useState([]);
  const [currentVersionId, setCurrentVersionId] = useState('');
  const [versionComparison, setVersionComparison] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState(null);
  const [applyRevisionsStatus, setApplyRevisionsStatus] = useState('idle');
  const [applyRevisionsError, setApplyRevisionsError] = useState('');
  const [applyRevisionsMode, setApplyRevisionsMode] = useState(null);
  const [applyRevisionsGeneratedAt, setApplyRevisionsGeneratedAt] = useState('');
  const [revisionApplicationStale, setRevisionApplicationStale] = useState(false);
  const [proposalOutput, setProposalOutput] = useState(null);
  const [proposalOutputStatus, setProposalOutputStatus] = useState('idle');
  const [proposalOutputError, setProposalOutputError] = useState('');
  const [proposalOutputMode, setProposalOutputMode] = useState(null);
  const [proposalOutputGeneratedAt, setProposalOutputGeneratedAt] = useState('');
  const [proposalOutputStale, setProposalOutputStale] = useState(false);
  const [proposalOutputTab, setProposalOutputTab] = useState('pdf');
  const [proposalPdfUrl, setProposalPdfUrl] = useState('');
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

    if (proposalBlueprint) {
      steps.add('proposal-blueprint');
    }

    if (relatedWorkPlan) {
      steps.add('related-work');
    }

    if (critiquePanelResult) {
      steps.add('multi-agent-critique');
    }

    if (revisionSuggestions.length || revisionPlan) {
      steps.add('revision-planning');
    }

    if (proposalVersions.length >= 2) {
      steps.add('apply-revisions');
    }

    if (proposalOutput) {
      steps.add('proposal-output');
    }

    return steps;
  }, [
    critiquePanelResult,
    ideaPreview,
    proposalBlueprint,
    proposalOutput,
    relatedWorkPlan,
    revisionSuggestions,
    revisionPlan,
    proposalVersions.length
  ]);

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
      setActiveStep(normalizeActiveStep(snapshot.activeStep));
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
      setCritiquePanelResult(snapshot.critiquePanelResult || null);
      setCritiqueMode(snapshot.critiqueMode || null);
      setCritiqueGeneratedAt(snapshot.critiqueGeneratedAt || '');
      setCritiqueStale(Boolean(snapshot.critiqueStale));
      setRevisionSuggestions(Array.isArray(snapshot.revisionSuggestions) ? snapshot.revisionSuggestions : []);
      setRevisionPlan(snapshot.revisionPlan || null);
      setRevisionPlanStale(Boolean(snapshot.revisionPlanStale));
      setRevisionPlanUpdatedAt(snapshot.revisionPlanUpdatedAt || '');
      setProposalVersions(Array.isArray(snapshot.proposalVersions) ? snapshot.proposalVersions : []);
      setCurrentVersionId(snapshot.currentVersionId || '');
      setVersionComparison(snapshot.versionComparison || null);
      setSelectedComparison(snapshot.selectedComparison || null);
      setApplyRevisionsMode(snapshot.applyRevisionsMode || null);
      setApplyRevisionsGeneratedAt(snapshot.applyRevisionsGeneratedAt || '');
      setRevisionApplicationStale(Boolean(snapshot.revisionApplicationStale));
      setProposalOutput(snapshot.proposalOutput || null);
      setProposalOutputMode(snapshot.proposalOutputMode || null);
      setProposalOutputGeneratedAt(snapshot.proposalOutputGeneratedAt || '');
      setProposalOutputStale(Boolean(snapshot.proposalOutputStale));
      setProposalOutputTab(snapshot.proposalOutputTab === 'latex' ? 'latex' : 'pdf');
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

    if (
      !hasWorkspaceContent(
        ideaInput,
        ideaPreview,
        proposalBlueprint,
        relatedWorkPlan,
        critiquePanelResult,
        revisionSuggestions,
        revisionPlan,
        proposalVersions,
        versionComparison,
        proposalOutput
      )
    ) {
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
      critiquePanelResult,
      critiqueMode,
      critiqueGeneratedAt,
      critiqueStale,
      revisionSuggestions,
      revisionPlan,
      revisionPlanStale,
      revisionPlanUpdatedAt,
      proposalVersions,
      currentVersionId,
      versionComparison,
      selectedComparison,
      applyRevisionsMode,
      applyRevisionsGeneratedAt,
      revisionApplicationStale,
      proposalOutput,
      proposalOutputMode,
      proposalOutputGeneratedAt,
      proposalOutputStale,
      proposalOutputTab,
      notice
    };

    localStorage.setItem(MEMORY_KEY, JSON.stringify(snapshot));
  }, [
    activeStep,
    analysisMode,
    blueprintGeneratedAt,
    blueprintMode,
    blueprintStale,
    critiqueGeneratedAt,
    critiqueMode,
    critiquePanelResult,
    critiqueStale,
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
    relatedWorkStale,
    applyRevisionsGeneratedAt,
    applyRevisionsMode,
    currentVersionId,
    proposalOutput,
    proposalOutputGeneratedAt,
    proposalOutputMode,
    proposalOutputStale,
    proposalOutputTab,
    revisionPlan,
    revisionApplicationStale,
    revisionPlanStale,
    revisionPlanUpdatedAt,
    revisionSuggestions,
    proposalVersions,
    selectedComparison,
    versionComparison
  ]);

  useEffect(() => {
    return () => {
      if (proposalPdfUrl) {
        URL.revokeObjectURL(proposalPdfUrl);
      }
    };
  }, [proposalPdfUrl]);

  useEffect(() => {
    if (!memoryReady) return;
    if (!proposalOutput?.proposalLatex) return;
    if (proposalPdfUrl) return;
    if (proposalOutputStatus === 'generating') return;
    if (proposalOutputError) return;

    let cancelled = false;

    (async () => {
      try {
        const pdfBlob = await postBinary('/api/export/pdf', {
          proposalLatex: proposalOutput.proposalLatex,
          title: proposalOutput.title || proposalBlueprint?.workingTitle || ideaInput.topic || 'proposal'
        });

        if (cancelled) return;

        const nextUrl = URL.createObjectURL(pdfBlob);
        setProposalPdfUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }

          return nextUrl;
        });
      } catch (pdfError) {
        if (cancelled) return;

        setProposalOutputError((current) => current || `PDF preview could not be rebuilt. ${readError(pdfError)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ideaInput.topic, memoryReady, proposalBlueprint, proposalOutput, proposalOutputError, proposalOutputStatus, proposalPdfUrl]);

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
    const hasCritique = Boolean(critiquePanelResult);
    const hasRevisionPlanning = Boolean(revisionSuggestions.length || revisionPlan);
    const hasRevisionApplication = Boolean(proposalVersions.length || versionComparison);
    const hasProposalOutput = Boolean(proposalOutput);

    if (hasBlueprint && !blueprintStale) {
      setBlueprintStale(true);
    }

    if (hasRelatedWork && !relatedWorkStale) {
      setRelatedWorkStale(true);
    }

    if (hasCritique && !critiqueStale) {
      setCritiqueStale(true);
    }

    if (hasRevisionPlanning && !revisionPlanStale) {
      setRevisionPlanStale(true);
    }

    if (hasRevisionApplication && !revisionApplicationStale) {
      setRevisionApplicationStale(true);
    }

    if (hasProposalOutput && !proposalOutputStale) {
      setProposalOutputStale(true);
    }

    if (hasBlueprint || hasRelatedWork || hasCritique || hasRevisionPlanning || hasRevisionApplication || hasProposalOutput) {
      setNotice(
        hasProposalOutput
          ? 'Step 1 changed. Regenerate the proposal blueprint, related work plan, critique, revision plan, revised version, and final proposal output before using later workflow stages.'
          : hasRevisionApplication
            ? 'Step 1 changed. Regenerate the proposal blueprint, related work plan, critique, revision plan, and revised version before using later workflow stages.'
            : hasRevisionPlanning
              ? 'Step 1 changed. Regenerate the proposal blueprint, related work plan, critique, and revision plan before using later workflow stages.'
              : hasCritique
                ? 'Step 1 changed. Regenerate the proposal blueprint, related work plan, and critique before using later workflow stages.'
                : hasRelatedWork
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
    setCritiquePanelResult(null);
    setCritiqueMode(null);
    setCritiqueStatus('idle');
    setCritiqueError('');
    setCritiqueGeneratedAt('');
    setCritiqueStale(false);
    setRevisionSuggestions([]);
    setRevisionPlan(null);
    setRevisionPlanStale(false);
    setRevisionPlanUpdatedAt('');
    setProposalVersions([]);
    setCurrentVersionId('');
    setVersionComparison(null);
    setSelectedComparison(null);
    setApplyRevisionsStatus('idle');
    setApplyRevisionsError('');
    setApplyRevisionsMode(null);
    setApplyRevisionsGeneratedAt('');
    setRevisionApplicationStale(false);
    setProposalOutput(null);
    setProposalOutputStatus('idle');
    setProposalOutputError('');
    setProposalOutputMode(null);
    setProposalOutputGeneratedAt('');
    setProposalOutputStale(false);
    setProposalOutputTab('pdf');
    setProposalPdfUrl('');
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
    setCritiquePanelResult(null);
    setCritiqueMode(null);
    setCritiqueStatus('idle');
    setCritiqueError('');
    setCritiqueGeneratedAt('');
    setCritiqueStale(false);
    setRevisionSuggestions([]);
    setRevisionPlan(null);
    setRevisionPlanStale(false);
    setRevisionPlanUpdatedAt('');
    setProposalVersions([]);
    setCurrentVersionId('');
    setVersionComparison(null);
    setSelectedComparison(null);
    setApplyRevisionsStatus('idle');
    setApplyRevisionsError('');
    setApplyRevisionsMode(null);
    setApplyRevisionsGeneratedAt('');
    setRevisionApplicationStale(false);
    setProposalOutput(null);
    setProposalOutputStatus('idle');
    setProposalOutputError('');
    setProposalOutputMode(null);
    setProposalOutputGeneratedAt('');
    setProposalOutputStale(false);
    setProposalOutputTab('pdf');
    setProposalPdfUrl('');
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
    setCritiqueError('');
    setApplyRevisionsError('');
    setProposalOutputError('');
    setNotice(
      proposalOutput
        ? 'Edit the idea intake, then re-analyze Step 1 before regenerating Steps 2, 3, 4, 5, 6, and 7.'
        : proposalVersions.length || versionComparison
          ? 'Edit the idea intake, then re-analyze Step 1 before regenerating Steps 2, 3, 4, 5, and 6.'
          : revisionSuggestions.length || revisionPlan
            ? 'Edit the idea intake, then re-analyze Step 1 before regenerating Steps 2, 3, 4, and 5.'
            : critiquePanelResult
              ? 'Edit the idea intake, then re-analyze Step 1 before regenerating Steps 2, 3, and 4.'
              : relatedWorkPlan
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
    setRelatedWorkError('');
    setCritiqueError('');

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
    setCritiqueStale(Boolean(critiquePanelResult));
    setRevisionPlanStale(Boolean(revisionSuggestions.length || revisionPlan));
    setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
    setProposalOutputStale(Boolean(proposalOutput));
    setNotice(
      proposalOutput
        ? 'Step 1 updated. Regenerate the proposal blueprint, related work plan, critique, revision plan, revised version, and proposal output to sync Steps 2 through 7.'
        : proposalVersions.length || versionComparison
          ? 'Step 1 updated. Regenerate the proposal blueprint, related work plan, critique, revision plan, and revised version to sync Steps 2 through 6.'
          : revisionSuggestions.length || revisionPlan
            ? 'Step 1 updated. Regenerate the proposal blueprint, related work plan, critique, and revision plan to sync Steps 2 through 5.'
            : critiquePanelResult
              ? 'Step 1 updated. Regenerate the proposal blueprint, related work plan, and critique to sync Steps 2, 3, and 4.'
              : relatedWorkPlan
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
    setCritiqueError('');
    setApplyRevisionsError('');
    setProposalOutputError('');
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
      setCritiqueStale(Boolean(critiquePanelResult));
      setRevisionPlanStale(Boolean(revisionSuggestions.length || revisionPlan));
      setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
      setProposalOutputStale(Boolean(proposalOutput));
      setBlueprintStatus('idle');
      setNotice(
        proposalOutput
          ? 'Proposal blueprint refreshed. Regenerate Steps 3, 4, 5, 6, and 7 so the later workflow matches the latest scaffold.'
          : proposalVersions.length || versionComparison
            ? 'Proposal blueprint refreshed. Regenerate Steps 3, 4, 5, and 6 so the later workflow matches the latest scaffold.'
            : revisionSuggestions.length || revisionPlan
              ? 'Proposal blueprint refreshed. Regenerate Steps 3, 4, and 5 so the later workflow matches the latest scaffold.'
              : critiquePanelResult
                ? 'Proposal blueprint refreshed. Regenerate Steps 3 and 4 so the literature plan and critique match the latest scaffold.'
                : relatedWorkPlan
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
      setCritiqueStale(Boolean(critiquePanelResult));
      setRevisionPlanStale(Boolean(revisionSuggestions.length || revisionPlan));
      setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
      setProposalOutputStale(Boolean(proposalOutput));
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
    setCritiqueError('');
    setApplyRevisionsError('');
    setProposalOutputError('');
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
      setCritiqueStale(Boolean(critiquePanelResult));
      setRevisionPlanStale(Boolean(revisionSuggestions.length || revisionPlan));
      setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
      setProposalOutputStale(Boolean(proposalOutput));
      setRelatedWorkStatus('idle');
      setNotice(
        proposalOutput
          ? 'Related work plan refreshed. Regenerate Steps 4, 5, 6, and 7 so the later workflow matches the latest literature plan.'
          : proposalVersions.length || versionComparison
            ? 'Related work plan refreshed. Regenerate Steps 4, 5, and 6 so the critique, revision plan, and revised version match the latest literature plan.'
            : revisionSuggestions.length || revisionPlan
              ? 'Related work plan refreshed. Regenerate Steps 4 and 5 so the critique and revision plan match the latest literature plan.'
              : critiquePanelResult
                ? 'Related work plan refreshed. Regenerate Step 4 so the critique matches the latest literature plan.'
                : data.mode === 'api'
                  ? 'Related work plan generated with Gemini and saved as Step 3.'
                  : 'Related work plan generated from the deterministic Stage 1 fallback.'
      );
    } catch (requestError) {
      const fallbackPlan = buildClientFallbackRelatedWorkPlan(ideaInput, proposalBlueprint);

      setRelatedWorkPlan(fallbackPlan);
      setRelatedWorkMode('template');
      setRelatedWorkGeneratedAt(new Date().toISOString());
      setRelatedWorkStale(false);
      setCritiqueStale(Boolean(critiquePanelResult));
      setRevisionPlanStale(Boolean(revisionSuggestions.length || revisionPlan));
      setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
      setProposalOutputStale(Boolean(proposalOutput));
      setRelatedWorkStatus('idle');
      setRelatedWorkError('');
      setNotice(
        `Related-work API was unavailable, so the app used the deterministic demo fallback instead. ${readError(requestError)}`
      );
    }
  }

  async function handleRunCritique() {
    if (!proposalBlueprint) {
      setNotice('Generate Step 2 first so the critique has a proposal scaffold to evaluate.');
      return;
    }

    if (!relatedWorkPlan) {
      setNotice('Generate Step 3 first so the critique can use the related work plan.');
      return;
    }

    if (blueprintStale || relatedWorkStale) {
      setNotice('Refresh Steps 2 and 3 before generating Step 4 so the critique matches the latest proposal state.');
      return;
    }

    setActiveStep('multi-agent-critique');
    setIsEditingIdea(false);
    setCritiqueStatus('generating');
    setCritiqueError('');
    setApplyRevisionsError('');
    setProposalOutputError('');
    setError('');

    try {
      const data = await postJson('/api/critique', {
        ideaInput,
        proposalBlueprint,
        relatedWorkPlan
      });
      const generatedAt = new Date().toISOString();
      const nextCritique = data.critiquePanelResult || null;
      const nextSuggestions = buildRevisionSuggestionsFromCritique(nextCritique);

      setCritiquePanelResult(nextCritique);
      setCritiqueMode(data.mode === 'api' ? 'api' : 'template');
      setCritiqueGeneratedAt(generatedAt);
      setCritiqueStale(false);
      setRevisionSuggestions(nextSuggestions);
      setRevisionPlan(buildRevisionPlan(nextSuggestions));
      setRevisionPlanStale(false);
      setRevisionPlanUpdatedAt(generatedAt);
      setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
      setProposalOutputStale(Boolean(proposalOutput));
      setCritiqueStatus('idle');
      setNotice(
        data.mode === 'api'
          ? 'Multi-agent critique generated with Gemini and saved as Step 4. Step 5 is ready for accept, reject, or defer decisions.'
          : 'Multi-agent critique generated from the deterministic Stage 1 fallback. Step 5 is ready for revision decisions.'
      );
    } catch (requestError) {
      const fallbackCritique = buildClientFallbackCritiquePanelResult(ideaInput, proposalBlueprint, relatedWorkPlan);
      const generatedAt = new Date().toISOString();
      const nextSuggestions = buildRevisionSuggestionsFromCritique(fallbackCritique);

      setCritiquePanelResult(fallbackCritique);
      setCritiqueMode('template');
      setCritiqueGeneratedAt(generatedAt);
      setCritiqueStale(false);
      setRevisionSuggestions(nextSuggestions);
      setRevisionPlan(buildRevisionPlan(nextSuggestions));
      setRevisionPlanStale(false);
      setRevisionPlanUpdatedAt(generatedAt);
      setRevisionApplicationStale(Boolean(proposalVersions.length || versionComparison));
      setProposalOutputStale(Boolean(proposalOutput));
      setCritiqueStatus('idle');
      setCritiqueError('');
      setNotice(
        `Critique API was unavailable, so the app used the deterministic demo fallback instead. ${readError(requestError)}`
      );
    }
  }

  function handleStartRevisionPlanning() {
    if (!critiquePanelResult) {
      setNotice('Run Step 4 first so Step 5 has critique suggestions to sort and prioritize.');
      return;
    }

    if (critiqueStale) {
      setNotice('Refresh Step 4 before starting revision planning so the suggestions match the latest proposal state.');
      return;
    }

    const nextSuggestions =
      revisionSuggestions.length > 0 ? revisionSuggestions : buildRevisionSuggestionsFromCritique(critiquePanelResult);
    const updatedAt = revisionPlanUpdatedAt || critiqueGeneratedAt || new Date().toISOString();

    setRevisionSuggestions(nextSuggestions);
    setRevisionPlan(buildRevisionPlan(nextSuggestions));
    setRevisionPlanStale(false);
    setRevisionPlanUpdatedAt(updatedAt);
    setActiveStep('revision-planning');
    setIsEditingIdea(false);
    setNotice('Step 5 ready. Accept, reject, or defer each critic suggestion to build the revision plan.');
  }

  function handleSuggestionStatusChange(suggestionId, status) {
    let changed = false;
    const nextSuggestions = revisionSuggestions.map((suggestion) => {
      if (suggestion.id !== suggestionId) return suggestion;
      if (suggestion.status === status) return suggestion;

      changed = true;
      return {
        ...suggestion,
        status
      };
    });

    setRevisionSuggestions(nextSuggestions);
    setRevisionPlan(buildRevisionPlan(nextSuggestions));
    setRevisionPlanStale(false);
    setRevisionPlanUpdatedAt(new Date().toISOString());
    if (changed && (proposalVersions.length || versionComparison)) {
      setRevisionApplicationStale(true);
    }
    if (changed && proposalOutput) {
      setProposalOutputStale(true);
    }
  }

  function handleSuggestionNoteChange(suggestionId, userNote) {
    const nextSuggestions = revisionSuggestions.map((suggestion) =>
      suggestion.id === suggestionId
        ? {
            ...suggestion,
            userNote
          }
        : suggestion
    );

    setRevisionSuggestions(nextSuggestions);
    setRevisionPlan(buildRevisionPlan(nextSuggestions));
    setRevisionPlanStale(false);
    setRevisionPlanUpdatedAt(new Date().toISOString());
  }

  async function handleApplyAcceptedRevisions() {
    if (!proposalBlueprint) {
      setNotice('Generate or restore a proposal blueprint before applying accepted revisions.');
      return;
    }

    if (!revisionPlan?.acceptedSuggestions?.length) {
      setNotice('Accept at least one revision suggestion before applying revisions.');
      return;
    }

    if (revisionPlanStale || critiqueStale) {
      setNotice('Refresh the critique and revision plan before applying revisions so the accepted suggestions match the current draft.');
      return;
    }

    setActiveStep('apply-revisions');
    setIsEditingIdea(false);
    setApplyRevisionsStatus('applying');
    setApplyRevisionsError('');
    setProposalOutputError('');
    setError('');

    try {
      const data = await postJson('/api/apply-revisions', {
        proposalBlueprint,
        revisionPlan
      });

      applyRevisionResultToState(data.applyRevisionResult || null, data.mode === 'api' ? 'api' : 'template');
    } catch (requestError) {
      const fallbackResult = buildClientFallbackApplyRevisionResult(proposalBlueprint, revisionPlan);
      applyRevisionResultToState(fallbackResult, 'template');
      setNotice(
        `Revision API was unavailable, so the app used the deterministic demo fallback instead. ${readError(requestError)}`
      );
    }
  }

  function applyRevisionResultToState(applyRevisionResult, mode) {
    if (!applyRevisionResult?.revisedBlueprint) {
      setApplyRevisionsStatus('error');
      setApplyRevisionsError('No revised blueprint was returned.');
      return;
    }

    const generatedAt = new Date().toISOString();
    const nextVersionSet = createVersionSet({
      currentBlueprint: proposalBlueprint,
      currentVersionId,
      critiquePanelResult,
      existingVersions: proposalVersions,
      generatedAt,
      revisionPlan,
      result: applyRevisionResult
    });

    setProposalBlueprint(applyRevisionResult.revisedBlueprint);
    setBlueprintGeneratedAt(generatedAt);
    setBlueprintMode(mode);
    setBlueprintStale(false);
    setRelatedWorkStale(Boolean(relatedWorkPlan));
    setCritiqueStale(Boolean(critiquePanelResult));
    setRevisionPlanStale(true);
    setRelatedWorkError('');
    setCritiqueError('');
    setProposalVersions(nextVersionSet.versions);
    setCurrentVersionId(nextVersionSet.currentVersionId);
    setVersionComparison(nextVersionSet.versionComparison);
    setSelectedComparison(nextVersionSet.selectedComparison);
    setApplyRevisionsMode(mode);
    setApplyRevisionsGeneratedAt(generatedAt);
    setRevisionApplicationStale(false);
    setProposalOutputStale(Boolean(proposalOutput));
    setApplyRevisionsStatus('idle');
    setApplyRevisionsError('');
    setNotice(
      mode === 'api'
        ? 'Accepted revisions applied with Gemini. The revised blueprint is now the current working draft and Version 2 has been saved.'
        : 'Accepted revisions applied from the deterministic Stage 1 fallback. The revised blueprint is now the current working draft and a new version has been saved.'
    );
  }

  async function handleGenerateProposalOutput() {
    if (!proposalBlueprint) {
      setNotice('Generate or restore a proposal blueprint before creating the final proposal output.');
      return;
    }

    if (proposalVersions.length < 2) {
      setNotice('Apply accepted revisions first so Step 7 is built from a saved current draft.');
      return;
    }

    if (revisionApplicationStale) {
      setNotice('Apply revisions again before generating the proposal output so Step 7 matches the latest accepted revision plan.');
      return;
    }

    if (proposalOutput && !proposalOutputStale && activeStep !== 'proposal-output') {
      setActiveStep('proposal-output');
      setNotice('Step 7 is ready. Review the current PDF and LaTeX proposal artifact.');
      return;
    }

    setActiveStep('proposal-output');
    setIsEditingIdea(false);
    setProposalOutputStatus('generating');
    setProposalOutputError('');
    setError('');

    try {
      const payload = buildProposalRequestPayload({
        currentVersionId,
        ideaInput,
        proposalBlueprint,
        proposalVersions
      });
      const data = await postJson('/api/proposal', payload);
      const normalizedOutput = normalizeProposalOutputResult(data, ideaInput, proposalBlueprint, payload.title);
      const nextOutput = normalizedOutput.output;

      setProposalOutput(nextOutput);
      setProposalOutputMode(normalizedOutput.mode);
      setProposalOutputGeneratedAt(new Date().toISOString());
      setProposalOutputStale(false);
      setProposalOutputTab('pdf');
      try {
        await refreshProposalPdf(nextOutput.proposalLatex, nextOutput.title, true);
      } catch {
        setProposalOutputTab('latex');
      }
      setProposalOutputStatus('idle');
      setNotice(
        data.mode === 'api'
          ? 'Proposal output generated with Gemini. Step 7 now shows the current PDF and LaTeX draft.'
          : 'Proposal output generated from the deterministic fallback. Step 7 now shows the current PDF and LaTeX draft.'
      );
    } catch (requestError) {
      const fallbackOutput = buildClientFallbackProposalOutput(ideaInput, proposalBlueprint);

      setProposalOutput(fallbackOutput);
      setProposalOutputMode('template');
      setProposalOutputGeneratedAt(new Date().toISOString());
      setProposalOutputStale(false);
      setProposalOutputTab('latex');

      try {
        await refreshProposalPdf(fallbackOutput.proposalLatex, fallbackOutput.title, true);
      } catch {
        setProposalOutputTab('latex');
      }

      setProposalOutputStatus('idle');
      setNotice(
        `Proposal generation API was unavailable, so the app used the deterministic document fallback instead. ${readError(requestError)}`
      );
    }
  }

  async function refreshProposalPdf(proposalLatex, title, preferPdfTab = false) {
    if (!clean(proposalLatex)) {
      throw new Error('No LaTeX source was available for PDF export.');
    }

    try {
      const pdfBlob = await postBinary('/api/export/pdf', {
        proposalLatex,
        title: clean(title) || 'proposal'
      });
      const nextUrl = URL.createObjectURL(pdfBlob);

      setProposalPdfUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return nextUrl;
      });
      setProposalOutputError('');
      if (preferPdfTab) {
        setProposalOutputTab('pdf');
      }
      return nextUrl;
    } catch (pdfError) {
      try {
        const fallbackBlob = buildClientFallbackPdfBlob(proposalLatex, title);
        const nextUrl = URL.createObjectURL(fallbackBlob);

        setProposalPdfUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }

          return nextUrl;
        });
        setProposalOutputError('');
        if (preferPdfTab) {
          setProposalOutputTab('pdf');
        }
        return nextUrl;
      } catch (fallbackError) {
        const finalError = fallbackError instanceof Error ? fallbackError : pdfError;

        setProposalPdfUrl((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }

          return '';
        });
        setProposalOutputError(`PDF preview could not be generated. ${readError(finalError)}`);
        throw finalError;
      }
    }
  }

  function handleSelectVersionComparison(afterVersionId) {
    const nextSelection = buildSelectedComparison(proposalVersions, afterVersionId);

    if (!nextSelection) {
      return;
    }

    setSelectedComparison(nextSelection);
    setVersionComparison(
      buildVersionComparison(
        proposalVersions.find((version) => version.id === nextSelection.beforeVersionId),
        proposalVersions.find((version) => version.id === nextSelection.afterVersionId)
      )
    );
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
                  critiquePanelExists={Boolean(critiquePanelResult)}
                  critiqueStale={critiqueStale}
                  critiqueStatus={critiqueStatus}
                  onGenerate={handleGenerateRelatedWorkPlan}
                  onRunCritique={handleRunCritique}
                  relatedWorkError={relatedWorkError}
                  relatedWorkGeneratedAt={relatedWorkGeneratedAt}
                  relatedWorkMode={relatedWorkMode}
                  relatedWorkPlan={relatedWorkPlan}
                  relatedWorkStale={relatedWorkStale}
                  relatedWorkStatus={relatedWorkStatus}
                />
              ) : null}

              {activeStep === 'multi-agent-critique' || critiquePanelResult || critiqueStatus !== 'idle' ? (
                <CritiquePanel
                  critiqueError={critiqueError}
                  critiqueGeneratedAt={critiqueGeneratedAt}
                  critiqueMode={critiqueMode}
                  critiquePanelResult={critiquePanelResult}
                  critiqueStale={critiqueStale}
                  critiqueStatus={critiqueStatus}
                  onGenerate={handleRunCritique}
                  onStartRevisionPlanning={handleStartRevisionPlanning}
                  revisionPlanExists={Boolean(revisionSuggestions.length)}
                />
              ) : null}

              {activeStep === 'revision-planning' ? (
                <RevisionPlanningPanel
                  applyRevisionsStatus={applyRevisionsStatus}
                  critiqueGeneratedAt={critiqueGeneratedAt}
                  critiqueStale={critiqueStale}
                  onApplyAcceptedRevisions={handleApplyAcceptedRevisions}
                  onSuggestionNoteChange={handleSuggestionNoteChange}
                  onSuggestionStatusChange={handleSuggestionStatusChange}
                  proposalVersionsCount={proposalVersions.length}
                  revisionApplicationStale={revisionApplicationStale}
                  revisionPlan={revisionPlan}
                  revisionPlanStale={revisionPlanStale}
                  revisionPlanUpdatedAt={revisionPlanUpdatedAt}
                  revisionSuggestions={revisionSuggestions}
                />
              ) : null}

              {activeStep === 'apply-revisions' || proposalVersions.length || applyRevisionsStatus !== 'idle' ? (
                <ApplyRevisionsPanel
                  applyRevisionsError={applyRevisionsError}
                  applyRevisionsGeneratedAt={applyRevisionsGeneratedAt}
                  applyRevisionsMode={applyRevisionsMode}
                  applyRevisionsStatus={applyRevisionsStatus}
                  currentVersionId={currentVersionId}
                  onApply={handleApplyAcceptedRevisions}
                  onGenerateProposalOutput={handleGenerateProposalOutput}
                  onSelectVersionComparison={handleSelectVersionComparison}
                  proposalOutputExists={Boolean(proposalOutput)}
                  proposalOutputStatus={proposalOutputStatus}
                  proposalOutputStale={proposalOutputStale}
                  proposalVersions={proposalVersions}
                  revisionApplicationStale={revisionApplicationStale}
                  revisionPlan={revisionPlan}
                  selectedComparison={selectedComparison}
                  versionComparison={versionComparison}
                />
              ) : null}

              {activeStep === 'proposal-output' || proposalOutput || proposalOutputStatus !== 'idle' ? (
                <ProposalOutputPanel
                  currentVersionId={currentVersionId}
                  onGenerate={handleGenerateProposalOutput}
                  onTabChange={setProposalOutputTab}
                  proposalOutput={proposalOutput}
                  proposalOutputError={proposalOutputError}
                  proposalOutputGeneratedAt={proposalOutputGeneratedAt}
                  proposalOutputMode={proposalOutputMode}
                  proposalOutputStale={proposalOutputStale}
                  proposalOutputStatus={proposalOutputStatus}
                  proposalOutputTab={proposalOutputTab}
                  proposalPdfUrl={proposalPdfUrl}
                  proposalVersions={proposalVersions}
                  revisionApplicationStale={revisionApplicationStale}
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

function buildClientFallbackCritiquePanelResult(ideaInput, proposalBlueprint, relatedWorkPlan) {
  const reviews = [
    buildFallbackProblemReview(ideaInput, proposalBlueprint),
    buildFallbackNoveltyReview(proposalBlueprint, relatedWorkPlan),
    buildFallbackMethodsReview(ideaInput, proposalBlueprint),
    buildFallbackEvaluationReview(ideaInput, proposalBlueprint),
    buildFallbackSignificanceReview(ideaInput, proposalBlueprint)
  ];
  const highestPriorityIssues = collectTopIssues(reviews);

  return {
    overallScore: Number((reviews.reduce((total, review) => total + review.score, 0) / reviews.length).toFixed(1)),
    reviews,
    highestPriorityIssues,
    suggestedRevisionOrder: highestPriorityIssues.map((issue) =>
      issue.relatedSection ? `${issue.relatedSection}: ${issue.suggestedRevision}` : `${issue.criticName}: ${issue.suggestedRevision}`
    )
  };
}

function buildFallbackProblemReview(ideaInput, proposalBlueprint) {
  const criticName = 'Problem & Motivation Critic';
  const issues = [];

  if (!isSpecific(proposalBlueprint.problemStatement, 90)) {
    issues.push(
      createFallbackIssue(criticName, 0, 'High', 'Problem framing is still too broad.', 'Reviewers need a clear research pain point to judge whether the proposal solves an important problem.', 'Rewrite the problem statement around a specific user, pain point, and consequence of not solving it.', 'Problem Statement')
    );
  }

  if (!isSpecific(proposalBlueprint.motivation, 120)) {
    issues.push(
      createFallbackIssue(criticName, 1, 'High', 'Motivation does not fully explain the stakes.', 'Weak stakes make the project sound interesting but not yet compelling.', 'Add concrete stakes, harms, or missed opportunities that show why the problem matters now.', 'Motivation')
    );
  }

  if (!clean(ideaInput.beneficiaries)) {
    issues.push(
      createFallbackIssue(criticName, 2, 'Medium', 'Beneficiaries are not explicit enough.', 'Specific beneficiaries help justify significance and broader impacts.', 'Name the primary student, advisor, researcher, or user group that benefits from the work.', 'Broader Impacts')
    );
  }

  issues.push(
    createFallbackIssue(criticName, 3, 'Low', 'Working title could be more specific.', 'A sharper title helps reviewers understand the proposal angle quickly.', 'Tighten the title so it names the technical focus and intended outcome.', 'Working Title')
  );

  return buildFallbackReview(
    criticName,
    'Checks whether the proposal clearly frames an important, motivated problem.',
    6.4,
    'The proposal points at a credible problem, but the stakes and target beneficiaries still need to be made more concrete.',
    ['The blueprint already separates the problem statement from the motivation section.'],
    issues,
    'Strengthen problem framing and stakes before expanding the rest of the proposal.'
  );
}

function buildFallbackNoveltyReview(proposalBlueprint, relatedWorkPlan) {
  const criticName = 'Novelty & Related Work Critic';
  const issues = [
    createFallbackIssue(criticName, 0, 'High', 'Novelty claims still depend on unverified related work.', 'Reviewers will not trust a novelty argument until real prior work is gathered and compared.', 'Use the related work plan to retrieve and verify sources before making stronger novelty claims.', 'Research Gap'),
    createFallbackIssue(criticName, 1, 'Medium', 'Research gap is still broader than it should be.', 'A broad gap can sound generic and makes the contribution harder to defend.', 'Rewrite the gap in terms of one narrower limitation in current approaches.', 'Research Gap')
  ];

  if ((relatedWorkPlan.unsupportedClaimWarnings || []).length > 1) {
    issues.push(
      createFallbackIssue(criticName, 2, 'Medium', 'Unsupported claim warnings should be resolved before drafting final proposal language.', 'Leaving these warnings unresolved weakens the contribution framing.', 'Translate the warnings into concrete citation or comparison tasks in the next revision pass.', 'Related Work Planning')
    );
  }

  return buildFallbackReview(
    criticName,
    'Checks whether the proposal gap is specific, grounded, and honest about unsupported claims.',
    5.9,
    'The related-work plan is useful, but the proposal is not ready to make strong novelty claims until the literature is verified.',
    ['The blueprint already names a research gap instead of only restating the topic.', 'The related work plan includes buckets and warnings that can support a better novelty review.'],
    issues,
    'Verify related work first, then tighten the gap and contribution language.'
  );
}

function buildFallbackMethodsReview(ideaInput, proposalBlueprint) {
  const criticName = 'Methods & Feasibility Critic';
  const issues = [
    createFallbackIssue(criticName, 0, 'High', 'Method needs clearer workflow detail.', 'Feasibility is hard to judge when the method does not specify what each stage or component actually does.', 'Spell out the main workflow stages, inputs, and outputs for the method.', 'Proposed Method / Technical Approach')
  ];

  if (!clean(ideaInput.datasets) || /still need|candidate/i.test(proposalBlueprint.datasetsToolsSystems || '')) {
    issues.push(
      createFallbackIssue(criticName, 1, 'High', 'Datasets, tools, or systems are still underspecified.', 'Implementation risk stays high until the proposal names what resources it can realistically use.', 'List the datasets, tools, or systems that make the method concrete and feasible.', 'Possible Datasets, Tools, or Systems')
    );
  }

  issues.push(
    createFallbackIssue(criticName, 2, 'Medium', 'Agent or component roles could be clearer.', 'Reviewers need to understand which parts of the workflow generate, critique, or verify proposal content.', 'Define the roles of the main system components or agents in one concise method paragraph.', 'Proposed Method / Technical Approach')
  );

  return buildFallbackReview(
    criticName,
    'Checks whether the proposed technical approach is realistic, scoped, and implementable.',
    6.1,
    'The method is plausible, but the implementation path and resource plan still need sharper detail.',
    ['The blueprint already proposes a staged workflow instead of leaving the method blank.'],
    issues,
    'Clarify the method architecture and concrete resources before expanding scope.'
  );
}

function buildFallbackEvaluationReview(ideaInput, proposalBlueprint) {
  const criticName = 'Evaluation Plan Critic';
  const issues = [
    createFallbackIssue(criticName, 0, 'High', 'Evaluation plan needs explicit benchmarks, metrics, or rubric dimensions.', 'Strong proposals must define measurable success rather than only saying the result will be better.', 'Name the benchmarks, rubric criteria, or metrics that will be used to evaluate success.', 'Evaluation Plan'),
    createFallbackIssue(criticName, 1, 'High', 'Baselines or comparison conditions are not specific enough.', 'Without baselines, the proposal cannot convincingly show improvement or contribution.', 'Add a baseline comparison such as a plain chatbot, a weaker workflow, or a before/after proposal comparison.', 'Evaluation Plan')
  ];

  if (!clean(ideaInput.datasets)) {
    issues.push(
      createFallbackIssue(criticName, 2, 'Medium', 'Evaluation is not yet tied to concrete datasets or source materials.', 'Reviewers may treat vague evaluation resources as a feasibility gap.', 'Connect the evaluation plan to specific datasets, examples, or benchmark tasks.', 'Possible Datasets, Tools, or Systems')
    );
  }

  return buildFallbackReview(
    criticName,
    'Checks whether the proposal defines measurable success, baselines, and evidence quality.',
    5.4,
    'Evaluation is currently the weakest part of the blueprint because it still lacks concrete benchmarks and comparison logic.',
    ['The blueprint already reserves a dedicated evaluation section, which makes revision easier.'],
    issues,
    'Fix evaluation detail before making stronger contribution claims.'
  );
}

function buildFallbackSignificanceReview(ideaInput, proposalBlueprint) {
  const criticName = 'Significance / Broader Impacts Critic';
  const issues = [
    createFallbackIssue(criticName, 0, 'Medium', 'Broader impacts should be more concrete.', 'Generic impact language makes the proposal sound formulaic instead of well-justified.', 'Name the specific student, educational, or research communities that benefit and how they benefit.', 'Broader Impacts'),
    createFallbackIssue(criticName, 1, 'Medium', 'Intellectual merit could better explain the research insight.', 'Reviewers need to know what new knowledge or capability the project contributes beyond building a tool.', 'Rewrite intellectual merit around the research insight, capability, or evaluation contribution.', 'Intellectual Merit')
  ];

  return buildFallbackReview(
    criticName,
    'Checks whether the proposal explains why the work matters beyond the immediate technical idea.',
    6.8,
    'The proposal has a plausible significance story, but the broader impact and intellectual merit language still need to be more concrete.',
    ['The blueprint already mentions beneficiaries and broader value instead of ignoring significance entirely.'],
    issues,
    'Tie broader impacts and intellectual merit to named beneficiaries and research outcomes.'
  );
}

function buildFallbackReview(criticName, criticRole, score, summary, strengths, issues, overallRecommendation) {
  return {
    criticName,
    criticRole,
    score,
    summary,
    strengths,
    issues: sortIssues(issues),
    overallRecommendation
  };
}

function createFallbackIssue(criticName, index, priority, issue, whyItMatters, suggestedRevision, relatedSection = '') {
  return {
    id: `${toKebab(criticName)}-${index + 1}`,
    priority,
    issue,
    whyItMatters,
    suggestedRevision,
    relatedSection,
    criticName
  };
}

function collectTopIssues(reviews) {
  return reviews.flatMap((review) => review.issues).sort(compareIssues).slice(0, 5);
}

function buildRevisionSuggestionsFromCritique(critiquePanelResult) {
  if (!critiquePanelResult?.reviews) return [];

  return critiquePanelResult.reviews
    .flatMap((review) =>
      (review.issues || []).map((issue) => ({
        id: issue.id,
        sourceCritic: issue.criticName || review.criticName,
        priority: issue.priority,
        relatedSection: issue.relatedSection || '',
        issue: issue.issue,
        whyItMatters: issue.whyItMatters,
        suggestedRevision: issue.suggestedRevision,
        status: 'deferred',
        userNote: ''
      }))
    )
    .sort(compareRevisionSuggestions);
}

function buildRevisionPlan(suggestions) {
  const acceptedSuggestions = suggestions.filter((suggestion) => suggestion.status === 'accepted');
  const rejectedSuggestions = suggestions.filter((suggestion) => suggestion.status === 'rejected');
  const deferredSuggestions = suggestions.filter((suggestion) => suggestion.status === 'deferred');
  const revisionOrder = [...acceptedSuggestions].sort(compareRevisionSuggestions);
  const sectionsToRevise = dedupeStrings(acceptedSuggestions.map((suggestion) => suggestion.relatedSection));
  const summary = buildRevisionPlanSummary(acceptedSuggestions, sectionsToRevise);

  return {
    acceptedSuggestions,
    rejectedSuggestions,
    deferredSuggestions,
    revisionOrder,
    summary,
    sectionsToRevise
  };
}

function buildRevisionPlanSummary(acceptedSuggestions, sectionsToRevise) {
  if (!acceptedSuggestions.length) {
    return 'No accepted suggestions yet. Choose the critique revisions that should shape the next blueprint update.';
  }

  if (sectionsToRevise.length) {
    return `This revision plan focuses on improving ${toReadableList(sectionsToRevise)} based on ${acceptedSuggestions.length} accepted critic suggestion${acceptedSuggestions.length === 1 ? '' : 's'}.`;
  }

  return `This revision plan collects ${acceptedSuggestions.length} accepted critic suggestion${acceptedSuggestions.length === 1 ? '' : 's'} for the next proposal update.`;
}

function buildClientFallbackApplyRevisionResult(proposalBlueprint, revisionPlan) {
  const acceptedSuggestions = revisionPlan?.acceptedSuggestions || [];
  const revisedBlueprint = {
    ...proposalBlueprint,
    researchQuestions: [...(proposalBlueprint.researchQuestions || [])],
    hypotheses: [...(proposalBlueprint.hypotheses || [])],
    missingInformation: [...(proposalBlueprint.missingInformation || [])],
    suggestedNextSteps: [...(proposalBlueprint.suggestedNextSteps || [])]
  };
  const groupedSuggestions = groupRevisionSuggestionsByField(acceptedSuggestions);
  const changedSections = [];

  groupedSuggestions.forEach(({ fieldKey, label, suggestions }) => {
    const before = cloneBlueprintFieldValue(revisedBlueprint[fieldKey]);
    const after = reviseClientBlueprintField(fieldKey, before, suggestions);

    if (!blueprintFieldValuesEqual(before, after)) {
      revisedBlueprint[fieldKey] = after;
      changedSections.push({
        sectionName: label,
        beforeSummary: summarizeBlueprintFieldValue(before),
        afterSummary: summarizeBlueprintFieldValue(after),
        reasonForChange: summarizeAcceptedSuggestionReasons(suggestions)
      });
    }
  });

  if (acceptedSuggestions.some((suggestion) => /citation|literature|verified|novelty|related work/i.test(clean(suggestion.suggestedRevision)))) {
    revisedBlueprint.missingInformation = dedupeStrings([
      ...(revisedBlueprint.missingInformation || []),
      'Related-work support still needs to be verified with real literature before final novelty claims are made.'
    ]);
  }

  revisedBlueprint.suggestedNextSteps = dedupeStrings([
    ...(revisedBlueprint.suggestedNextSteps || []),
    'Rerun critique on the revised blueprint to measure how the accepted changes improved the proposal.',
    'Use the saved versions as workflow evidence for the Stage 1 demo.'
  ]).slice(0, 8);

  return {
    revisedBlueprint,
    changeSummary: buildRevisionChangeSummary(acceptedSuggestions, changedSections),
    changedSections
  };
}

function createVersionSet({ currentBlueprint, currentVersionId, critiquePanelResult, existingVersions, generatedAt, revisionPlan, result }) {
  const nextVersions = [...existingVersions];
  let beforeVersion = findExistingVersionForBlueprint(nextVersions, currentVersionId, currentBlueprint);

  if (!beforeVersion) {
    beforeVersion = createProposalVersion({
      versionNumber: nextVersions.length + 1,
      label: nextVersions.length ? 'Current Blueprint' : 'Initial Blueprint',
      createdAt: generatedAt,
      blueprint: currentBlueprint,
      appliedSuggestions: [],
      changeSummary: [
        nextVersions.length
          ? 'Saved the current working blueprint before applying a new revision pass.'
          : 'Saved the initial blueprint before accepted revisions were applied.'
      ],
      scoreBefore: critiquePanelResult?.overallScore
    });
    nextVersions.push(beforeVersion);
  }

  const afterVersion = createProposalVersion({
    versionNumber: nextVersions.length + 1,
    label: 'Revised Blueprint',
    createdAt: generatedAt,
    blueprint: result.revisedBlueprint,
    appliedSuggestions: revisionPlan.acceptedSuggestions || [],
    changeSummary: result.changeSummary || []
  });

  nextVersions.push(afterVersion);

  return {
    versions: nextVersions,
    currentVersionId: afterVersion.id,
    selectedComparison: {
      beforeVersionId: beforeVersion.id,
      afterVersionId: afterVersion.id
    },
    versionComparison: buildVersionComparison(beforeVersion, afterVersion, result.changedSections || [])
  };
}

function createProposalVersion({ versionNumber, label, createdAt, blueprint, appliedSuggestions, changeSummary, scoreBefore, scoreAfter }) {
  return {
    id: `proposal-version-${versionNumber}-${createdAt}`,
    versionNumber,
    label: `Version ${versionNumber}: ${label}`,
    createdAt,
    blueprint,
    appliedSuggestions,
    changeSummary,
    scoreBefore,
    scoreAfter
  };
}

function findExistingVersionForBlueprint(versions, currentVersionId, blueprint) {
  const currentVersion = versions.find((version) => version.id === currentVersionId);

  if (currentVersion && blueprintFieldValuesEqual(currentVersion.blueprint, blueprint)) {
    return currentVersion;
  }

  return versions.find((version) => blueprintFieldValuesEqual(version.blueprint, blueprint)) || null;
}

function buildSelectedComparison(versions, afterVersionId) {
  const index = versions.findIndex((version) => version.id === afterVersionId);

  if (index <= 0) {
    return null;
  }

  return {
    beforeVersionId: versions[index - 1].id,
    afterVersionId: versions[index].id
  };
}

function buildVersionComparison(beforeVersion, afterVersion, apiChangedSections = []) {
  if (!beforeVersion || !afterVersion) return null;

  const sectionReasonMap = new Map(
    apiChangedSections.map((section) => [normalizeComparisonSectionName(section.sectionName), clean(section.reasonForChange)])
  );
  const changedSections = PROPOSAL_BLUEPRINT_FIELDS.flatMap(({ key, label }) => {
    const before = beforeVersion.blueprint?.[key];
    const after = afterVersion.blueprint?.[key];

    if (blueprintFieldValuesEqual(before, after)) {
      return [];
    }

    return [
      {
        sectionName: label,
        before,
        after,
        explanation:
          sectionReasonMap.get(normalizeComparisonSectionName(label)) ||
          deriveComparisonExplanation(label, afterVersion.appliedSuggestions || [])
      }
    ];
  });

  return {
    beforeVersionId: beforeVersion.id,
    afterVersionId: afterVersion.id,
    changedSections,
    overallImprovementSummary:
      clean((afterVersion.changeSummary || []).join(' ')) ||
      `Applied ${afterVersion.appliedSuggestions?.length || 0} accepted suggestion(s) across ${changedSections.length} proposal section(s).`
  };
}

function groupRevisionSuggestionsByField(suggestions) {
  const grouped = new Map();

  suggestions.forEach((suggestion) => {
    const fieldKey = mapRevisionSuggestionToField(suggestion);
    const existing = grouped.get(fieldKey);

    if (existing) {
      existing.suggestions.push(suggestion);
      return;
    }

    grouped.set(fieldKey, {
      fieldKey,
      label: proposalBlueprintFieldLabel(fieldKey),
      suggestions: [suggestion]
    });
  });

  return Array.from(grouped.values());
}

function mapRevisionSuggestionToField(suggestion) {
  const section = clean(suggestion.relatedSection).toLowerCase();
  const issue = `${clean(suggestion.issue)} ${clean(suggestion.suggestedRevision)}`.toLowerCase();

  if (/working title|title/.test(section) || /^title\b/.test(issue)) return 'workingTitle';
  if (/one-sentence summary|summary/.test(section)) return 'oneSentenceSummary';
  if (/problem/.test(section) || /problem framing/.test(issue)) return 'problemStatement';
  if (/motivation/.test(section) || /stakes|urgency/.test(issue)) return 'motivation';
  if (/research gap|related work planning/.test(section) || /novelty|gap|related work/.test(issue)) return 'researchGap';
  if (/contribution/.test(section)) return 'proposedContribution';
  if (/research questions/.test(section)) return 'researchQuestions';
  if (/hypotheses/.test(section)) return 'hypotheses';
  if (/method|technical approach/.test(section) || /workflow|agent roles|feasibility/.test(issue)) return 'proposedMethod';
  if (/datasets|tools|systems/.test(section) || /dataset|tool|system|benchmark resources/.test(issue)) return 'datasetsToolsSystems';
  if (/evaluation/.test(section) || /baseline|metric|benchmark|ablation/.test(issue)) return 'evaluationPlan';
  if (/expected results/.test(section)) return 'expectedResults';
  if (/intellectual merit/.test(section)) return 'intellectualMerit';
  if (/broader impacts/.test(section) || /beneficiaries|significance/.test(issue)) return 'broaderImpacts';
  if (/missing information/.test(section)) return 'missingInformation';
  if (/next steps/.test(section)) return 'suggestedNextSteps';

  return 'proposedMethod';
}

function proposalBlueprintFieldLabel(fieldKey) {
  return PROPOSAL_BLUEPRINT_FIELDS.find((field) => field.key === fieldKey)?.label || titleCase(fieldKey);
}

function reviseClientBlueprintField(fieldKey, value, suggestions) {
  if (Array.isArray(value)) {
    return reviseClientBlueprintArrayField(fieldKey, value, suggestions);
  }

  return reviseClientBlueprintStringField(fieldKey, value, suggestions);
}

function reviseClientBlueprintStringField(fieldKey, value, suggestions) {
  const base = clean(value);

  if (fieldKey === 'evaluationPlan') {
    return appendUniqueSentences(
      base,
      'Candidate success criteria should now include explicit benchmarks, rubric dimensions, baseline comparisons, and measurable proposal-quality metrics.'
    );
  }

  if (fieldKey === 'researchGap') {
    return appendUniqueSentences(
      base,
      'The revised gap distinguishes this staged, student-in-the-loop proposal workflow from generic AI writing support and treats novelty as provisional until related work is verified.'
    );
  }

  if (fieldKey === 'proposedMethod') {
    return appendUniqueSentences(
      base,
      'The revised method now defines the roles of generation, critique, verification, and student decision-making within the workflow.'
    );
  }

  if (fieldKey === 'broaderImpacts') {
    return appendUniqueSentences(
      base,
      'The revised broader-impact framing identifies concrete beneficiaries such as graduate students, advisors, and lower-resource educational settings.'
    );
  }

  if (fieldKey === 'datasetsToolsSystems') {
    return appendUniqueSentences(
      base,
      'The revision adds candidate benchmark tasks, proposal examples, and evaluation resources that make feasibility and comparison more concrete.'
    );
  }

  if (fieldKey === 'intellectualMerit') {
    return appendUniqueSentences(
      base,
      'The revised intellectual-merit framing emphasizes the research insight gained from structuring critique, revision, and evaluation into one workflow rather than only describing a tool.'
    );
  }

  return appendUniqueSentences(
    base,
    suggestions
      .map((suggestion) => `Revised based on accepted critique: ${clean(suggestion.suggestedRevision)}`)
      .join(' ')
  );
}

function reviseClientBlueprintArrayField(fieldKey, value, suggestions) {
  const existing = Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
  const extras = suggestions.map((suggestion) => {
    if (fieldKey === 'researchQuestions') {
      return `How should the proposal address this revision priority: ${clean(suggestion.suggestedRevision)}?`;
    }

    if (fieldKey === 'hypotheses') {
      return `Revised assumption: ${clean(suggestion.suggestedRevision)}`;
    }

    if (fieldKey === 'missingInformation') {
      return `Still needs verification: ${clean(suggestion.suggestedRevision)}`;
    }

    return clean(suggestion.suggestedRevision);
  });

  return dedupeStrings(existing.concat(extras)).slice(0, fieldKey === 'suggestedNextSteps' ? 8 : 6);
}

function buildRevisionChangeSummary(acceptedSuggestions, changedSections) {
  const summaries = changedSections.map((section) => {
    const lower = section.sectionName.toLowerCase();

    if (lower.includes('evaluation')) return 'Strengthened the evaluation plan with clearer benchmarks, metrics, and baselines.';
    if (lower.includes('research gap')) return 'Clarified the research gap and reduced unsupported novelty language.';
    if (lower.includes('method')) return 'Improved method feasibility by defining generator, critic, and verifier roles more clearly.';
    if (lower.includes('broader impacts')) return 'Made broader impacts more concrete by naming beneficiaries and outcomes.';

    return `Revised ${section.sectionName.toLowerCase()} based on accepted critique suggestions.`;
  });

  return dedupeStrings(
    summaries.concat(
      acceptedSuggestions.map((suggestion) => clean(suggestion.suggestedRevision)).filter(Boolean).slice(0, 2)
    )
  ).slice(0, 6);
}

function summarizeAcceptedSuggestionReasons(suggestions) {
  return dedupeStrings(suggestions.map((suggestion) => clean(suggestion.suggestedRevision)).filter(Boolean)).join(' ');
}

function cloneBlueprintFieldValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

function blueprintFieldValuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function summarizeBlueprintFieldValue(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean).join(' | ');
  }

  return clean(value);
}

function normalizeComparisonSectionName(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function deriveComparisonExplanation(sectionLabel, appliedSuggestions) {
  const related = appliedSuggestions.filter(
    (suggestion) => mapRevisionSuggestionToField(suggestion) === PROPOSAL_BLUEPRINT_FIELDS.find((field) => field.label === sectionLabel)?.key
  );

  if (related.length) {
    return summarizeAcceptedSuggestionReasons(related);
  }

  return 'Updated from the accepted revision suggestions in the current plan.';
}

function buildProposalRequestPayload({ currentVersionId, ideaInput, proposalBlueprint, proposalVersions }) {
  const currentVersion = proposalVersions.find((version) => version.id === currentVersionId) || proposalVersions.at(-1) || null;

  return {
    topic: ideaInput.topic || proposalBlueprint.workingTitle || 'Research Proposal',
    title: proposalBlueprint.workingTitle || ideaInput.topic || 'Research Proposal',
    ideaInput,
    proposalBlueprint,
    currentVersion: currentVersion
      ? {
          id: currentVersion.id,
          label: currentVersion.label,
          createdAt: currentVersion.createdAt
        }
      : null
  };
}

function buildClientFallbackProposalOutput(ideaInput, proposalBlueprint) {
  const title = proposalBlueprint.workingTitle || titleCase(ideaInput.topic || 'Research Proposal');
  const proposalLatex = buildClientFallbackProposalLatex(ideaInput, proposalBlueprint);

  return {
    title,
    proposalLatex,
    complianceMatrix: [],
    evaluationReport: '# Proposal Output\n\nThe current proposal output was generated from the latest proposal blueprint.',
    questions: proposalBlueprint.missingInformation || []
  };
}

function normalizeProposalOutputResult(data, ideaInput, proposalBlueprint, fallbackTitle) {
  const fallbackOutput = buildClientFallbackProposalOutput(ideaInput, proposalBlueprint);
  const normalizedTitle = clean(fallbackTitle) || fallbackOutput.title || 'Proposal Draft';
  const proposalLatex = extractProposalOutputLatex(data) || fallbackOutput.proposalLatex;

  return {
    mode: data?.mode === 'api' ? 'api' : 'template',
    output: {
      proposalLatex,
      complianceMatrix: Array.isArray(data?.complianceMatrix) ? data.complianceMatrix : [],
      evaluationReport: clean(data?.evaluationReport),
      questions: Array.isArray(data?.questions) ? data.questions : [],
      title: normalizedTitle
    }
  };
}

function extractProposalOutputLatex(data) {
  const candidates = [data?.proposalLatex, data?.proposalTex, data?.latex, data?.tex]
    .map(unwrapProposalOutputCandidate)
    .filter(Boolean);

  return candidates.find(isUsableProposalLatex) || '';
}

function unwrapProposalOutputCandidate(value) {
  const candidate = clean(value);

  if (!candidate) {
    return '';
  }

  const fenced = candidate.match(/```(?:latex|tex)?\s*([\s\S]*?)```/i);
  return clean(fenced?.[1] || candidate);
}

function isUsableProposalLatex(value) {
  const latex = clean(value);

  return Boolean(latex) && /\\(?:documentclass\b|begin\{document\}|section\{)/.test(latex);
}

function buildClientFallbackProposalLatex(ideaInput, proposalBlueprint) {
  const researchGap = sanitizeClientProposalText(proposalBlueprint.researchGap);
  const questions = Array.isArray(proposalBlueprint.researchQuestions) ? proposalBlueprint.researchQuestions : [];
  const hypotheses = Array.isArray(proposalBlueprint.hypotheses) ? proposalBlueprint.hypotheses : [];
  const missingInformation = Array.isArray(proposalBlueprint.missingInformation) ? proposalBlueprint.missingInformation : [];
  const projectGoal = mergeClientProposalParagraphs([
    sanitizeClientProposalText(proposalBlueprint.oneSentenceSummary)
      || 'This project develops the current research idea into a concise, credible proposal that can guide later implementation and evaluation.',
    sanitizeClientProposalText(proposalBlueprint.proposedContribution)
      || 'The expected contribution is a clearer proposal structure with a defensible motivation, feasible approach, and measurable evaluation plan.'
  ]);
  const motivation = mergeClientProposalParagraphs([
    sanitizeClientProposalText(proposalBlueprint.problemStatement),
    sanitizeClientProposalText(proposalBlueprint.motivation),
    buildClientGapSentence(researchGap)
  ]);
  const approach = sanitizeClientProposalText(proposalBlueprint.proposedMethod)
    || 'The proposed approach develops the idea into a structured workflow with clear stages, intermediate outputs, and revision checkpoints.';
  const dataAndEvaluation = mergeClientProposalParagraphs([
    sanitizeClientProposalText(proposalBlueprint.datasetsToolsSystems)
      || 'The project will rely on the most relevant publicly available datasets, tools, or source materials for the chosen topic.',
    sanitizeClientProposalText(proposalBlueprint.evaluationPlan)
      || 'Evaluation will compare the resulting proposal quality against a simpler baseline using explicit criteria, reviewer judgment, or task-specific metrics.'
  ]);
  const contributionAndImpact = mergeClientProposalParagraphs([
    sanitizeClientProposalText(proposalBlueprint.expectedResults)
      || 'The expected result is a stronger proposal draft with clearer structure, sharper motivation, and a more credible evaluation plan.',
    sanitizeClientProposalText(proposalBlueprint.intellectualMerit),
    sanitizeClientProposalText(proposalBlueprint.broaderImpacts)
  ]);
  const riskItems = buildClientProposalRiskItems(missingInformation, []).slice(0, 3);
  const sourceNotes = dedupeStrings([
    ...missingInformation.map(sanitizeClientProposalText).filter(Boolean),
    'Novelty claims remain provisional pending verification against related literature.'
  ]);

  return String.raw`\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\setlist{nosep,leftmargin=*}
\title{${escapeLatexForClient(sanitizeClientProposalTitle(proposalBlueprint.workingTitle || ideaInput.topic || 'Research Proposal'))}}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.55em}
\author{[Student Name] \\ \texttt{[student@university.edu]} \\ [University / Program]}
\date{}

\begin{document}
\maketitle

\section{Project Goal}
${latexParagraphForClient(projectGoal)}

\section{Motivation}
${latexParagraphForClient(motivation)}

\section{Proposed Approach}
${latexParagraphForClient(approach)}
${questions.length ? `\n\\begin{itemize}\n${questions.slice(0, 3).map((question) => `\\item ${escapeLatexForClient(sanitizeClientProposalText(question))}`).join('\n')}\n\\end{itemize}\n` : ''}
${hypotheses.length ? `\n${latexParagraphForClient(`A working hypothesis is that ${sanitizeClientProposalText(hypotheses[0]).replace(/^[A-Z]/, (match) => match.toLowerCase())}`)}\n` : ''}

\section{Data and Evaluation Plan}
${latexParagraphForClient(dataAndEvaluation)}

\section{Expected Contribution and Risks}
${latexParagraphForClient(contributionAndImpact)}
${riskItems.length ? `\n\\begin{itemize}\n${riskItems.map((item) => `\\item ${escapeLatexForClient(item)}`).join('\n')}\n\\end{itemize}\n` : ''}

\section{References, Assumptions, or Source Notes}
${sourceNotes.length ? `\\begin{itemize}\n${sourceNotes.map((item) => `\\item ${escapeLatexForClient(item)}`).join('\n')}\n\\end{itemize}` : latexParagraphForClient('Specific references and source notes will be added after the related literature is verified.')}

\end{document}
`;
}

function sortIssues(issues) {
  return [...issues].sort(compareIssues);
}

function compareIssues(left, right) {
  const order = { High: 0, Medium: 1, Low: 2 };
  const priorityDelta = (order[left.priority] ?? 9) - (order[right.priority] ?? 9);

  if (priorityDelta !== 0) return priorityDelta;

  return clean(left.issue).localeCompare(clean(right.issue));
}

function compareRevisionSuggestions(left, right) {
  const order = { High: 0, Medium: 1, Low: 2 };
  const priorityDelta = (order[left.priority] ?? 9) - (order[right.priority] ?? 9);

  if (priorityDelta !== 0) return priorityDelta;

  return clean(left.issue).localeCompare(clean(right.issue));
}

function isSpecific(value, minimumLength) {
  return clean(value).length >= minimumLength;
}

function toKebab(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasWorkspaceContent(
  ideaInput,
  ideaPreview,
  proposalBlueprint,
  relatedWorkPlan,
  critiquePanelResult,
  revisionSuggestions,
  revisionPlan,
  proposalVersions,
  versionComparison,
  proposalOutput
) {
  return (
    Object.values(ideaInput).some((value) => Boolean(clean(value))) ||
    Boolean(ideaPreview) ||
    Boolean(proposalBlueprint) ||
    Boolean(relatedWorkPlan) ||
    Boolean(critiquePanelResult) ||
    Boolean(revisionSuggestions.length) ||
    Boolean(revisionPlan) ||
    Boolean(proposalVersions.length) ||
    Boolean(versionComparison) ||
    Boolean(proposalOutput)
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

async function postBinary(url, body) {
  const apiBases = getApiBaseCandidates();
  let lastError = new Error('Request failed.');

  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(extractResponseError(await response.text()));
      }

      return await response.blob();
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

function sanitizeClientProposalTitle(value) {
  const sanitized = sanitizeClientProposalText(value)
    .replace(/\s+Revised based on accepted critique:.*$/i, '')
    .trim();

  return sanitized || 'Research Proposal';
}

function sanitizeClientProposalText(value) {
  const normalized = clean(value);

  if (!normalized) return '';

  const sentences = normalized
    .replace(/['"]?proposal studio['"]? workflow/gi, 'guided proposal-development workflow')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter(
      (sentence) =>
        !/accepted critique/i.test(sentence) &&
        !/accepted revision suggestions?/i.test(sentence) &&
        !/^the revised\b/i.test(sentence) &&
        !/should now include/i.test(sentence) &&
        !/workflow evidence/i.test(sentence) &&
        !/\bStage 1 demo\b/i.test(sentence)
    );

  return sentences.join(' ').trim() || normalized;
}

function buildClientGapSentence(value) {
  const gap = clean(value);

  if (!gap) return '';
  if (/^(while|there is|existing|current|despite)\b/i.test(gap)) {
    return gap;
  }

  return `A central gap in the current landscape is ${decapitalizeClientFirst(gap)}`;
}

function mergeClientProposalParagraphs(parts) {
  return parts.map(sanitizeClientProposalText).filter(Boolean).join('\n\n');
}

function buildClientProposalRiskItems(missingInformation, nextSteps) {
  const draftItems = [...missingInformation, ...nextSteps]
    .map(clean)
    .filter(Boolean)
    .map(normalizeClientRiskItem);

  if (draftItems.length) {
    return dedupeStrings(draftItems);
  }

  return [
    'The proposal still needs a narrower target population and clearer measurement criteria.',
    'Any novelty claim should remain provisional until related literature is verified.',
    'The scope may need to be reduced if the method or evaluation becomes too broad.'
  ];
}

function normalizeClientRiskItem(value) {
  const trimmed = clean(value)
    .replace(/^need to\s+/i, '')
    .replace(/^add\s+/i, 'The proposal still needs ')
    .replace(/^define\s+/i, 'The proposal still needs to define ')
    .replace(/^choose\s+/i, 'The proposal still needs to choose ')
    .replace(/^decide on\s+/i, 'The proposal still needs to decide on ');

  if (!trimmed) return '';
  if (/novelty claims remain provisional/i.test(trimmed)) return 'Novelty claims remain provisional pending verification against related literature.';
  if (/^the proposal/i.test(trimmed)) return `${trimmed.replace(/\.$/, '')}.`;

  return `${trimmed.replace(/\.$/, '')}.`;
}

function decapitalizeClientFirst(value) {
  const text = clean(value);
  if (!text) return '';
  return `${text.slice(0, 1).toLowerCase()}${text.slice(1)}`;
}

function appendUniqueSentences(base, addition) {
  return dedupeStrings([base, addition].map(clean).filter(Boolean)).join(' ');
}

function toReadableList(values) {
  if (!values.length) return '';
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
}

function normalizeActiveStep(value) {
  if (value === 'version-history') {
    return 'proposal-output';
  }

  return WORKFLOW_STEPS.some((step) => step.id === value) ? value : 'idea-intake';
}

function readError(error) {
  return error instanceof Error ? error.message : 'Request failed.';
}

function latexParagraphForClient(value) {
  return escapeLatexForClient(value || '')
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph) => `${paragraph}\n`)
    .join('\n');
}

function escapeLatexForClient(value) {
  return String(value || '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function buildClientFallbackPdfBlob(proposalLatex, title) {
  return new Blob([renderProposalPdfBytes(proposalLatex, clean(title) || 'Research Proposal')], { type: 'application/pdf' });
}

export default App;
