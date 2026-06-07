import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { proposalLatexToPdf } from '../server/pdfExport.js';
import {
  answerAgentQuestion,
  applyAcceptedRevisions,
  generateCritiquePanelResult,
  generateProposal,
  generateProposalBlueprint,
  generateRelatedWorkPlan,
  startAgentSession
} from '../server/proposalGenerator.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const snapshotPath = path.join(publicDir, 'latest-run-snapshot.json');
const pdfPath = path.join(rootDir, 'proposal.pdf');
const texPath = path.join(rootDir, 'proposal.tex');

const ideaInput = {
  topic: 'Predicting NBA player injury risk from public data with interpretable machine learning',
  domain: 'Sports analytics, machine learning, predictive modeling, and sports medicine informatics',
  problem:
    'NBA teams, researchers, and sports analysts want to predict player injury risk, but many existing approaches either depend on private biometric data or use complex deep learning models that are harder to interpret. This creates a gap for a public-data-based approach that is easier to reproduce, explain, and evaluate. The problem is to determine whether classic machine learning methods can provide useful injury-risk predictions using only publicly available NBA data.',
  motivation:
    'Player injuries affect team performance, roster planning, and player availability. A public-data approach matters because most students and independent researchers do not have access to private team health data or expensive internal systems. If classic machine learning methods perform reasonably well, the project could show that useful injury-risk modeling is possible with lower-cost, more transparent methods.',
  beneficiaries:
    'Sports analytics students, independent researchers, NBA analysts working with limited resources, and instructors evaluating applied machine learning research all benefit. It could also help show whether interpretable models are more practical than black-box models in a public-data setting.',
  keywords:
    'NBA injury prediction, sports injury prediction, interpretable machine learning, XGBoost, random forest, logistic regression, neural networks, deep learning, public sports data, injury forecasting, player availability, calibration, Brier score, AUROC, Cohan injury forecasting NBA, Lu lower extremity muscle strain NBA',
  methods:
    'The project will collect publicly available NBA injury reports, game logs, and player history data, then engineer features related to workload, rest, age, prior injuries, and recent playing patterns. It will train classic machine learning models such as logistic regression, random forest, and XGBoost, and compare them against a simple neural network baseline. The evaluation will focus on both predictive performance and interpretability to see whether classic methods remain competitive in this setting.',
  datasets:
    'Pro Sports Transactions injury data, stats.nba.com game logs, Basketball-Reference player history, Python, pandas, scikit-learn, XGBoost, and either PyTorch or Keras for the neural network baseline',
  expectedContribution:
    'The expected contribution is a research proposal and modeling plan that tests whether interpretable machine learning models can predict NBA player injury risk using only public data, while also comparing their strengths and weaknesses against deep learning approaches that are more common in the field. The project should also clarify what tradeoffs exist between prediction quality, interpretability, and reproducibility.',
  uncertainties:
    'I still need to decide the exact injury label to predict, the final feature set, the best time-based train/test split, and whether to focus on all injuries or a narrower category such as lower extremity injuries. I also still need to confirm which prior work should be used as the strongest comparison points and what success threshold will count as competitive performance for classic machine learning models.'
};

const step1Answers = {
  method:
    'The most relevant public features will be rolling minutes played, games played in recent windows, days of rest, age, position, prior injury count, missed-game history, recent workload spikes, and basic game-context variables such as back-to-backs and travel density when available.',
  evaluation:
    'An injury will be defined as a reported injury event that causes missed games or a meaningful absence window in the public injury logs. The evaluation will use AUROC, precision, recall, F1, Brier score, calibration, and baseline comparison against a simple neural model.',
  timeline:
    'The practical milestones are data collection and label definition first, then feature engineering and baseline models, then comparison against the neural baseline, and finally proposal writing, revision, and PDF export for the class deliverable.'
};

async function main() {
  await fs.mkdir(publicDir, { recursive: true });

  const timestamps = {
    intake: new Date().toISOString()
  };

  const step1Start = await startAgentSession({
    ideaInput,
    topic: ideaInput.topic
  });

  let agentSession = step1Start;
  const answeredQuestions = [];

  for (const question of step1Start.questions.slice(0, 3)) {
    const answer = chooseAnswerForQuestion(question);

    if (!answer) continue;

    agentSession = await answerAgentQuestion({
      project: agentSession.project,
      question,
      answer
    });
    answeredQuestions.push({
      questionId: question.id,
      question: question.question,
      answer
    });
  }

  const ideaPreview = buildIdeaPreview(ideaInput, agentSession);
  timestamps.blueprint = new Date().toISOString();
  const blueprintResult = await generateProposalBlueprint({
    ideaInput,
    ideaPreview
  });

  timestamps.relatedWork = new Date().toISOString();
  const relatedWorkResult = await generateRelatedWorkPlan({
    ideaInput,
    proposalBlueprint: blueprintResult.blueprint
  });

  timestamps.critique = new Date().toISOString();
  const critiqueResult = await generateCritiquePanelResult({
    ideaInput,
    proposalBlueprint: blueprintResult.blueprint,
    relatedWorkPlan: relatedWorkResult.relatedWorkPlan
  });

  const revisionSuggestions = buildRevisionSuggestions(critiqueResult.critiquePanelResult);
  const acceptedIds = new Set(revisionSuggestions.slice(0, 2).map((suggestion) => suggestion.id));
  const nextSuggestions = revisionSuggestions.map((suggestion) => ({
    ...suggestion,
    status: acceptedIds.has(suggestion.id) ? 'accepted' : 'deferred'
  }));
  const revisionPlan = buildRevisionPlan(nextSuggestions);

  timestamps.applyRevisions = new Date().toISOString();
  const applyRevisionsResult = await applyAcceptedRevisions({
    proposalBlueprint: blueprintResult.blueprint,
    revisionPlan
  });

  const revisionPreview = createRevisionPreview({
    currentBlueprint: blueprintResult.blueprint,
    generatedAt: timestamps.applyRevisions,
    revisionPlan,
    result: applyRevisionsResult.applyRevisionResult
  });

  timestamps.proposal = new Date().toISOString();
  const proposalResult = await generateProposal({
    topic: ideaInput.topic,
    title: applyRevisionsResult.applyRevisionResult.revisedBlueprint.workingTitle || ideaInput.topic,
    ideaInput,
    proposalBlueprint: applyRevisionsResult.applyRevisionResult.revisedBlueprint,
    currentVersion: {
      id: revisionPreview.afterVersion.id,
      label: revisionPreview.afterVersion.label,
      createdAt: revisionPreview.afterVersion.createdAt
    }
  });

  const proposalOutput = {
    title: applyRevisionsResult.applyRevisionResult.revisedBlueprint.workingTitle || ideaInput.topic,
    proposalLatex: proposalResult.proposalLatex,
    complianceMatrix: Array.isArray(proposalResult.complianceMatrix) ? proposalResult.complianceMatrix : [],
    evaluationReport: proposalResult.evaluationReport || '',
    questions: Array.isArray(proposalResult.questions) ? proposalResult.questions : []
  };

  const finalVersion = createProposalVersion({
    versionNumber: 1,
    label: 'Initial Final Proposal',
    createdAt: timestamps.proposal,
    blueprint: applyRevisionsResult.applyRevisionResult.revisedBlueprint,
    appliedSuggestions: revisionPlan.acceptedSuggestions,
    changeSummary: revisionPreview.afterVersion.changeSummary,
    scoreBefore: critiqueResult.critiquePanelResult?.overallScore
  });

  const snapshot = {
    activeStep: 'proposal-output',
    isEditingIdea: false,
    ideaInput,
    ideaPreview,
    agentSession,
    agentQuestionDrafts: Object.fromEntries(answeredQuestions.map((item) => [item.questionId, item.answer])),
    analysisMode: agentSession.mode || null,
    lastAnalyzedAt: timestamps.intake,
    stepTranscripts: {
      'idea-intake': buildTranscriptEntry(agentSession, timestamps.intake),
      'proposal-blueprint': buildTranscriptEntry(blueprintResult, timestamps.blueprint),
      'related-work': buildTranscriptEntry(relatedWorkResult, timestamps.relatedWork),
      'multi-agent-critique': buildTranscriptEntry(critiqueResult, timestamps.critique),
      'apply-revisions': buildTranscriptEntry(applyRevisionsResult, timestamps.applyRevisions),
      'proposal-output': buildTranscriptEntry(proposalResult, timestamps.proposal)
    },
    proposalBlueprint: blueprintResult.blueprint,
    currentDraftBlueprint: applyRevisionsResult.applyRevisionResult.revisedBlueprint,
    blueprintMode: blueprintResult.mode || null,
    blueprintGeneratedAt: timestamps.blueprint,
    blueprintStale: false,
    relatedWorkPlan: relatedWorkResult.relatedWorkPlan,
    relatedWorkMode: relatedWorkResult.mode || null,
    relatedWorkGeneratedAt: timestamps.relatedWork,
    relatedWorkStale: false,
    critiquePanelResult: critiqueResult.critiquePanelResult,
    critiqueMode: critiqueResult.mode || null,
    critiqueGeneratedAt: timestamps.critique,
    critiqueStale: false,
    revisionSuggestions: nextSuggestions,
    revisionPlan,
    revisionPlanStale: false,
    revisionPlanUpdatedAt: timestamps.critique,
    revisionPreview,
    proposalVersions: [finalVersion],
    currentVersionId: finalVersion.id,
    versionComparison: null,
    selectedComparison: null,
    applyRevisionsMode: applyRevisionsResult.mode || null,
    applyRevisionsGeneratedAt: timestamps.applyRevisions,
    revisionApplicationStale: false,
    proposalOutput,
    proposalOutputMode: proposalResult.mode || null,
    proposalOutputGeneratedAt: timestamps.proposal,
    proposalOutputStale: false,
    proposalOutputTab: 'pdf',
    notice: 'Proposal output generated. A new finalized proposal version has been saved in history.'
  };

  const pdfBytes = await proposalLatexToPdf(proposalResult.proposalLatex, proposalOutput.title);

  await fs.writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  await fs.writeFile(texPath, `${proposalResult.proposalLatex.trim()}\n`, 'utf8');
  await fs.writeFile(pdfPath, pdfBytes);

  process.stdout.write(
    `${JSON.stringify(
      {
        snapshotPath,
        pdfPath,
        texPath,
        modes: {
          step1: agentSession.mode,
          blueprint: blueprintResult.mode,
          relatedWork: relatedWorkResult.mode,
          critique: critiqueResult.mode,
          applyRevisions: applyRevisionsResult.mode,
          proposal: proposalResult.mode
        }
      },
      null,
      2
    )}\n`
  );
}

function chooseAnswerForQuestion(question) {
  const field = String(question?.field || '').trim();
  return step1Answers[field] || '';
}

function buildIdeaPreview(input, session) {
  const project = session.project || {};
  return {
    detectedTopic: `${input.topic} Domain: ${input.domain}`,
    problem: project.problem || input.problem,
    motivation: `${input.motivation} Primary beneficiaries: ${input.beneficiaries}`,
    possibleContribution: input.expectedContribution,
    missingInformation: (session.questions || []).map((question) => question.question),
    projectTitle: project.title || input.topic,
    evaluationPlan: project.evaluation || '',
    resources: project.resources || input.datasets,
    references: project.references || input.keywords
  };
}

function buildRevisionSuggestions(critiquePanelResult) {
  return (critiquePanelResult?.reviews || [])
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
  const sectionsToRevise = [...new Set(acceptedSuggestions.map((suggestion) => suggestion.relatedSection).filter(Boolean))];
  const summary = !acceptedSuggestions.length
    ? 'No accepted suggestions yet. Choose the critique revisions that should shape the next blueprint update.'
    : sectionsToRevise.length
      ? `This revision plan focuses on improving ${toReadableList(sectionsToRevise)} based on ${acceptedSuggestions.length} accepted critic suggestion${acceptedSuggestions.length === 1 ? '' : 's'}.`
      : `This revision plan collects ${acceptedSuggestions.length} accepted critic suggestion${acceptedSuggestions.length === 1 ? '' : 's'} for the next proposal update.`;

  return {
    acceptedSuggestions,
    rejectedSuggestions,
    deferredSuggestions,
    revisionOrder,
    summary,
    sectionsToRevise
  };
}

function createRevisionPreview({ currentBlueprint, generatedAt, revisionPlan, result }) {
  const beforeVersion = createProposalVersion({
    versionNumber: 1,
    label: 'Before Revisions',
    createdAt: generatedAt,
    blueprint: currentBlueprint,
    appliedSuggestions: [],
    changeSummary: ['Captured the working blueprint before applying the latest accepted revision plan.']
  });
  const afterVersion = createProposalVersion({
    versionNumber: 2,
    label: 'Applied Revision Draft',
    createdAt: generatedAt,
    blueprint: result.revisedBlueprint,
    appliedSuggestions: revisionPlan.acceptedSuggestions || [],
    changeSummary: result.changeSummary || []
  });

  return {
    versions: [beforeVersion, afterVersion],
    beforeVersion,
    afterVersion,
    comparison: buildVersionComparison(beforeVersion, afterVersion, result.changedSections || [])
  };
}

function createProposalVersion({ versionNumber, label, createdAt, blueprint, appliedSuggestions, changeSummary, scoreBefore = null }) {
  return {
    id: `proposal-version-${versionNumber}-${createdAt}`,
    versionNumber,
    label: `Version ${versionNumber}: ${label}`,
    createdAt,
    blueprint,
    appliedSuggestions,
    changeSummary,
    scoreBefore
  };
}

function buildVersionComparison(beforeVersion, afterVersion, apiChangedSections = []) {
  return {
    beforeVersionId: beforeVersion.id,
    afterVersionId: afterVersion.id,
    overallImprovementSummary: afterVersion.changeSummary?.[0] || 'Updated from the accepted revision suggestions in the current plan.',
    changedSections: apiChangedSections
  };
}

function buildTranscriptEntry(data, savedAt) {
  return {
    mode: String(data?.mode || '').trim(),
    provider: String(data?.provider || '').trim(),
    transcript: data?.transcript || null,
    updates: Array.isArray(data?.updates) ? data.updates : [],
    runMessage: String(data?.runMessage || '').trim(),
    savedAt
  };
}

function compareRevisionSuggestions(left, right) {
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  const leftPriority = priorityOrder[left.priority] ?? 99;
  const rightPriority = priorityOrder[right.priority] ?? 99;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return String(left.issue || '').localeCompare(String(right.issue || ''));
}

function toReadableList(items) {
  if (items.length <= 1) {
    return items[0] || '';
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
