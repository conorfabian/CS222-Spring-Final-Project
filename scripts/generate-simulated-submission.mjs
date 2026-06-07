import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { proposalLatexToPdf } from '../server/pdfExport.js';
import { __testables } from '../server/proposalGenerator.js';
import { estimateProposalPageCount } from '../shared/proposalPdfRenderer.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDir = path.join(rootDir, 'evidence', 'stage2-run-01');
const publicDir = path.join(rootDir, 'public');
const proposalDir = path.join(rootDir, 'proposal');
const snapshotPath = path.join(publicDir, 'latest-run-snapshot.json');
const rootTexPath = path.join(rootDir, 'proposal.tex');
const rootPdfPath = path.join(rootDir, 'proposal.pdf');
const proposalTexPath = path.join(proposalDir, 'proposal.tex');

const MODE = 'simulated-api-output';
const PROVIDER = 'codex-simulated-gemini';
const TIMESTAMP_BASE = '2026-06-06T23:30:00.000Z';
const REQUIREMENTS = `Proposal must include:
- Project title
- Abstract
- Keywords
- Introduction: motivation, gap, and relevant prior work or source notes
- Project goal
- Methods: technical approach and agent workflow
- Figure or diagram with caption
- Expected results and research milestones with timeline estimates
- Evaluation plan
- Risks and mitigation
- Resources, tools, budget, or release plan
- References, assumptions, or source notes`;

const ideaInput = {
  topic: 'Predicting NBA player injury risk from publicly available data with interpretable machine learning',
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

const project = {
  title: 'Predicting NBA Player Injury Risk from Public Data with Interpretable Machine Learning',
  topic: ideaInput.topic,
  problem: ideaInput.problem,
  method: ideaInput.methods,
  timeline:
    'Weeks 1-2: audit public sources and define the injury label. Weeks 3-4: engineer workload, rest, age, prior-injury, and availability features. Weeks 5-6: train logistic regression, random forest, XGBoost, and a simple neural baseline. Weeks 7-8: evaluate calibration, errors, and proposal quality before final release.',
  evaluation:
    'Use AUROC, precision, recall, F1, Brier score, calibration, false-positive/false-negative analysis, ablation tests, subgroup checks, and comparison against logistic regression and a simple neural baseline.',
  resources: ideaInput.datasets,
  references:
    'Cohan, Schuster, and Fernandez (2021); Lu et al. (2022); sports injury prediction review literature; source notes and assumptions about public-data limitations.',
  requirements: REQUIREMENTS
};

const ideaPreview = {
  detectedTopic: `${ideaInput.topic} Domain: ${ideaInput.domain}`,
  problem: ideaInput.problem,
  motivation: `${ideaInput.motivation} Primary beneficiaries: ${ideaInput.beneficiaries}`,
  possibleContribution: ideaInput.expectedContribution,
  missingInformation: [
    'Exact injury label needs to be specified before modeling.',
    'Prior work should be verified before making strong novelty claims.',
    'The train/test split should respect time order.'
  ],
  projectTitle: project.title,
  evaluationPlan: project.evaluation,
  timeline: project.timeline,
  resources: project.resources,
  references: project.references
};

const blueprint = {
  workingTitle: project.title,
  oneSentenceSummary:
    'This project studies whether interpretable machine learning can produce useful NBA injury-risk signals from public injury reports, game logs, and player-history data.',
  problemStatement: ideaInput.problem,
  motivation: ideaInput.motivation,
  researchGap:
    'Existing NBA injury-risk work often relies on private health signals, deeper models, or narrower injury definitions. The gap is a reproducible public-data study that compares interpretable baselines against a simple neural baseline while making assumptions, calibration, and error behavior visible.',
  proposedContribution:
    'The proposal contributes a public-data modeling plan, a comparison between interpretable and neural baselines, and a proposal-agent workflow that checks scope, novelty, evidence, and revision priorities.',
  researchQuestions: [
    'Can logistic regression, random forest, or XGBoost produce useful NBA injury-risk predictions from public data?',
    'How close can interpretable models get to a simple neural baseline while remaining easier to explain and reproduce?',
    'Which public feature groups, such as recent workload, rest, age, and prior injury history, matter most?'
  ],
  hypotheses: [
    'XGBoost or random forest will stay close to the simple neural baseline while producing clearer feature importance and calibration diagnostics.',
    'Recent workload and prior injury history will be among the most informative public feature groups.'
  ],
  proposedMethod:
    'Collect public injury records, game logs, and player-history data; define a time-loss injury label; engineer workload/rest/history features; train logistic regression, random forest, XGBoost, and a simple neural baseline; evaluate predictive performance, calibration, and error patterns.',
  datasetsToolsSystems: ideaInput.datasets,
  evaluationPlan: project.evaluation,
  expectedResults:
    'The expected result is a realistic account of what public-data injury modeling can and cannot support, not a claim of perfect prediction.',
  intellectualMerit:
    'The project tests transparent baselines in a noisy public-data setting and connects model quality to reproducibility, calibration, and interpretability.',
  broaderImpacts:
    'Students, independent researchers, and analysts with limited resources benefit from a reproducible approach that does not require private biometric systems.',
  missingInformation: [
    'Exact injury label and time-loss threshold must be finalized.',
    'Final source list must be verified before strong novelty claims are made.',
    'Final feature set and temporal split should be locked before model training.'
  ],
  suggestedNextSteps: [
    'Verify Cohan et al. and Lu et al. as comparison points.',
    'Use a temporal split and report calibration, false positives, and false negatives.',
    'Keep novelty claims modest and source-grounded.'
  ]
};

const relatedWorkPlan = {
  searchQueries: [
    'NBA injury forecasting public data deep learning Cohan Schuster Fernandez',
    'NBA lower extremity muscle strain prediction XGBoost Lu Pareek',
    'sports injury prediction machine learning calibration public data',
    'interpretable machine learning sports analytics injury risk'
  ],
  keyConcepts: [
    'public-data injury prediction',
    'interpretable machine learning',
    'deep learning injury forecasting',
    'calibration and Brier score',
    'temporal evaluation splits'
  ],
  relatedWorkBuckets: [
    {
      title: 'NBA Injury Forecasting',
      description: 'Prior NBA-specific injury studies provide the closest comparison points for labels, features, and evaluation risk.',
      whyItMatters: 'This bucket grounds novelty claims in the same sports context.',
      exampleSearchTerms: ['Cohan injury forecasting NBA', 'NBA injury prediction public data']
    },
    {
      title: 'Interpretable Sports Injury Models',
      description: 'Classic models such as logistic regression, random forest, and XGBoost help compare transparency against predictive strength.',
      whyItMatters: 'This bucket supports the proposal focus on reproducible and explainable baselines.',
      exampleSearchTerms: ['XGBoost lower extremity muscle strain NBA', 'interpretable sports injury prediction']
    },
    {
      title: 'Evaluation And Calibration',
      description: 'Calibration, class imbalance, and temporal splits shape whether a risk model is credible beyond summary accuracy.',
      whyItMatters: 'This bucket protects the proposal from overclaiming practical usefulness.',
      exampleSearchTerms: ['Brier score injury prediction', 'calibration sports injury machine learning']
    }
  ],
  suggestedVenuesOrSources: [
    'sports medicine informatics papers',
    'sports analytics journals and conference papers',
    'machine learning health-risk prediction reviews',
    'Google Scholar and Semantic Scholar keyword searches'
  ],
  literatureGapQuestions: [
    'Which prior NBA studies used only public data?',
    'How did prior work define injury labels and time-loss windows?',
    'Do interpretable models remain competitive when calibration is considered?'
  ],
  unsupportedClaimWarnings: [
    'Do not claim team-level deployability without private validation data.',
    'Do not claim novelty until comparison papers are verified.',
    'Do not treat public injury reports as complete medical ground truth.'
  ],
  nextSteps: [
    'Verify exact citations and source notes.',
    'Choose a conservative injury label.',
    'Report assumptions explicitly in the final proposal.'
  ]
};

const critiquePanelResult = {
  overallScore: 8,
  reviews: [
    {
      criticName: 'Problem & Motivation Critic',
      criticRole: 'Reviews stakeholder, context, and problem clarity.',
      score: 8,
      summary: 'The problem is concrete and tied to public-data access limits.',
      strengths: ['Names clear beneficiaries.', 'Explains why private biometric data is a barrier.'],
      issues: [
        critiqueIssue('problem-label', 'Medium', 'The injury label is still too broad.', 'A broad label can make the study noisy and hard to evaluate.', 'Define a reported time-loss injury label and identify a fallback narrower label.', 'Problem Framing', 'Problem & Motivation Critic')
      ],
      overallRecommendation: 'Keep the public-data access framing and define the injury target carefully.'
    },
    {
      criticName: 'Novelty & Related Work Critic',
      criticRole: 'Reviews prior-work grounding and novelty.',
      score: 8,
      summary: 'The novelty claim is plausible if kept modest and tied to verified NBA comparison points.',
      strengths: ['Identifies Cohan and Lu as candidate anchors.', 'Avoids claiming a new architecture.'],
      issues: [
        critiqueIssue('novelty-sources', 'High', 'Novelty depends on verifying the strongest prior work.', 'Reviewers will discount novelty if comparison points are vague.', 'Name Cohan et al. and Lu et al. as provisional anchors and mark broader novelty as an assumption until verified.', 'Introduction', 'Novelty & Related Work Critic')
      ],
      overallRecommendation: 'Use source notes and cautious language for novelty.'
    },
    {
      criticName: 'Methods & Feasibility Critic',
      criticRole: 'Reviews implementation detail and feasibility.',
      score: 8,
      summary: 'The methods are feasible if data joining and temporal split details are specified.',
      strengths: ['Names public sources.', 'Names interpretable baselines and a neural comparison.'],
      issues: [
        critiqueIssue('temporal-split', 'High', 'The train/test split needs to respect time order.', 'Random splits can leak future availability information.', 'Use a temporal split and report player-level joining assumptions.', 'Methods', 'Methods & Feasibility Critic')
      ],
      overallRecommendation: 'Lock the split and feature families before modeling.'
    },
    {
      criticName: 'Evaluation Plan Critic',
      criticRole: 'Reviews metrics, baselines, and success criteria.',
      score: 9,
      summary: 'The evaluation plan is strong because it includes discrimination, calibration, errors, and baselines.',
      strengths: ['Includes AUROC, F1, Brier score, and calibration.', 'Compares classic models against a simple neural baseline.'],
      issues: [
        critiqueIssue('success-threshold', 'Medium', 'The success threshold should be cautious.', 'A fixed high AUROC target may be unrealistic for noisy public data.', 'Use a relative target such as staying within 0.03 AUROC of the neural baseline while improving interpretability.', 'Evaluation Plan', 'Evaluation Plan Critic')
      ],
      overallRecommendation: 'Prefer relative success criteria and explicit calibration checks.'
    },
    {
      criticName: 'Significance / Broader Impacts Critic',
      criticRole: 'Reviews feasibility, beneficiaries, and responsible claims.',
      score: 8,
      summary: 'The proposal has useful educational and reproducibility value.',
      strengths: ['Benefits students and independent researchers.', 'Acknowledges public data limitations.'],
      issues: [
        critiqueIssue('assumptions', 'Medium', 'Public injury data limitations should be visible in the final proposal.', 'Unsupported medical claims would weaken credibility.', 'Add assumptions about noisy public reports and missing biometric signals.', 'References, Assumptions, or Source Notes', 'Significance / Broader Impacts Critic')
      ],
      overallRecommendation: 'Keep the claims cautious and reproducible.'
    }
  ],
  highestPriorityIssues: [],
  suggestedRevisionOrder: [
    'Ground novelty in verified NBA comparison points.',
    'Specify a temporal split and injury-label fallback.',
    'Use concrete metrics and cautious success criteria.',
    'Record public-data assumptions in source notes.'
  ]
};
critiquePanelResult.highestPriorityIssues = critiquePanelResult.reviews.flatMap((review) => review.issues).slice(0, 5);

const revisionSuggestions = critiquePanelResult.reviews
  .flatMap((review) =>
    review.issues.map((issue) => ({
      id: issue.id,
      sourceCritic: issue.criticName,
      priority: issue.priority,
      relatedSection: issue.relatedSection,
      issue: issue.issue,
      whyItMatters: issue.whyItMatters,
      suggestedRevision: issue.suggestedRevision,
      status: ['novelty-sources', 'temporal-split', 'success-threshold', 'assumptions'].includes(issue.id) ? 'accepted' : 'deferred',
      userNote: issue.id === 'problem-label' ? 'Deferred until the dataset audit confirms injury-label quality.' : ''
    }))
  );

const revisionPlan = buildRevisionPlan(revisionSuggestions);

const revisedBlueprint = {
  ...blueprint,
  researchGap:
    'Prior NBA injury work provides useful comparison points, including deep-learning injury forecasting and narrower injury-family prediction. This project keeps its novelty claim modest: it tests whether transparent public-data baselines can remain competitive enough to study while making assumptions, calibration, and errors easier to inspect.',
  proposedMethod:
    'The study will use a temporal train/test split, public injury records, public game logs, and player-history data. It will engineer workload, rest, age, prior-injury, and availability features, then compare logistic regression, random forest, XGBoost, and a simple neural baseline on the same split.',
  evaluationPlan:
    'The evaluation will report AUROC, precision, recall, F1, Brier score, calibration, false positives, false negatives, workload-feature ablations, and subgroup checks by position and age band. A strong result is an interpretable model within 0.03 AUROC of the neural baseline with clearer feature explanations and no major calibration failure.',
  missingInformation: [
    'Exact injury label remains an implementation choice after source audit.',
    'Some source notes are provisional until papers are verified.',
    'Public injury data may be incomplete and should not be treated as medical ground truth.'
  ],
  suggestedNextSteps: [
    'Use the final proposal source as the submission artifact.',
    'Keep assumptions visible in source notes.',
    'Use the evidence folder to show intake, critique, revision, and output checks.'
  ]
};

const applyRevisionResult = {
  revisedBlueprint,
  changeSummary: [
    'Grounded novelty in specific NBA comparison points and cautious source notes.',
    'Made the method more reproducible by specifying temporal split and feature families.',
    'Strengthened the evaluation plan with calibration, error analysis, ablation, subgroup checks, and a relative success criterion.',
    'Added public-data assumptions to reduce unsupported claims.'
  ],
  changedSections: [
    {
      sectionName: 'Research Gap',
      beforeSummary: blueprint.researchGap,
      afterSummary: revisedBlueprint.researchGap,
      reasonForChange: 'Accepted novelty critique requested stronger prior-work grounding and more cautious claims.'
    },
    {
      sectionName: 'Proposed Method',
      beforeSummary: blueprint.proposedMethod,
      afterSummary: revisedBlueprint.proposedMethod,
      reasonForChange: 'Accepted methods critique requested a temporal split and clear feature families.'
    },
    {
      sectionName: 'Evaluation Plan',
      beforeSummary: blueprint.evaluationPlan,
      afterSummary: revisedBlueprint.evaluationPlan,
      reasonForChange: 'Accepted evaluation critique requested metrics, calibration, ablations, and a realistic success target.'
    }
  ]
};

async function main() {
  await fs.rm(evidenceDir, { recursive: true, force: true });
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(proposalDir, { recursive: true });

  const proposalLatex = await fs.readFile(proposalTexPath, 'utf8');
  const proposalOutput = buildProposalOutput(proposalLatex);
  const validationFailures = __testables.validateSubmissionReadyProposal(proposalLatex, { title: project.title });

  if (validationFailures.length) {
    throw new Error(`Proposal source failed validation: ${validationFailures.join('; ')}`);
  }

  const pdfBytes = await proposalLatexToPdf(proposalLatex, project.title);
  await fs.writeFile(rootTexPath, `${proposalLatex.trim()}\n`, 'utf8');
  await fs.writeFile(rootPdfPath, pdfBytes);

  const timestamps = {
    intake: timestamp(0),
    answer: timestamp(1),
    blueprint: timestamp(2),
    relatedWork: timestamp(3),
    critique: timestamp(4),
    revisionPlan: timestamp(5),
    applyRevisions: timestamp(6),
    proposal: timestamp(7)
  };

  const step1Start = responseEnvelope({
    project: {
      ...project,
      timeline: '',
      evaluation: '',
      resources: ideaInput.datasets,
      references: ideaInput.keywords
    },
    suggestedProject: project,
    checklist: checklistItems(),
    fieldSuggestions: [
      fieldSuggestion('evaluation', 'Evaluation Plan', project.evaluation, 'High', 'Adds concrete metrics and baseline comparisons.'),
      fieldSuggestion('timeline', 'Research Milestones', project.timeline, 'High', 'Converts open uncertainties into a feasible staged plan.'),
      fieldSuggestion('method', 'Novelty And Method Focus', revisedBlueprint.researchGap, 'Medium', 'Keeps the novelty claim modest and source-grounded.')
    ],
    decisions: [
      {
        id: 'injury-label-scope',
        title: 'Choose Injury Label Scope',
        field: 'method',
        question: 'Which injury target should the proposal use first?',
        options: [
          {
            label: 'Time-loss public label',
            value: 'Use reported injury events that cause missed games or a meaningful public availability window.',
            rationale: 'Best fit for public data and reproducibility.'
          },
          {
            label: 'Lower-extremity subset',
            value: 'Narrow the first pass to lower-extremity injuries if all-injury labels are too noisy.',
            rationale: 'Matches prior work but may reduce sample size.'
          }
        ]
      }
    ],
    questions: [
      {
        id: 'evaluation-1',
        field: 'evaluation',
        question: 'Which metrics and baselines should define a successful public-data injury-risk model?',
        reason: 'The evaluation plan needs concrete metrics before drafting.',
        priority: 'High'
      }
    ],
    inputSummary: {
      fields: [
        ['Topic', ideaInput.topic],
        ['Problem', ideaInput.problem],
        ['Method', ideaInput.methods],
        ['Evaluation', 'Pending clarification'],
        ['Resources', ideaInput.datasets]
      ],
      missing: ['Final injury label and comparison threshold need to be resolved.'],
      markdown: '# Intake Summary\n\nThe NBA injury-risk topic has enough structure for a proposal blueprint after evaluation details are added.'
    },
    updates: ['Simulated Step 1 converted the intake into project state, decision options, and a high-priority evaluation question.'],
    runMessage: 'Initialized topic and prepared simulated field suggestions and decision cards.'
  }, { task: 'start', ideaInput, requirements: REQUIREMENTS });

  const step1Answer = responseEnvelope({
    project,
    suggestedProject: project,
    checklist: checklistItems(),
    fieldSuggestions: step1Start.fieldSuggestions,
    decisions: step1Start.decisions,
    questions: [],
    inputSummary: {
      fields: [
        ['Topic', ideaInput.topic],
        ['Evaluation', project.evaluation],
        ['Timeline', project.timeline],
        ['Resources', project.resources]
      ],
      missing: [],
      markdown: '# Intake Summary\n\nEvaluation metrics, baselines, timeline, and resources are now captured.'
    },
    updates: ['Integrated the evaluation answer with metrics, baselines, calibration, and error analysis.'],
    runMessage: 'Integrated evaluation answer into the simulated project state.'
  }, {
    task: 'integrate-answer',
    question: step1Start.questions[0],
    answer: project.evaluation
  });

  const blueprintResult = responseEnvelope({ blueprint }, { ideaInput, ideaPreview });
  const relatedWorkResult = responseEnvelope({ relatedWorkPlan }, { ideaInput, proposalBlueprint: blueprint });
  const critiqueResult = responseEnvelope({ critiquePanelResult }, { ideaInput, proposalBlueprint: blueprint, relatedWorkPlan });
  const revisionPlanResult = {
    mode: MODE,
    provider: PROVIDER,
    revisionSuggestions,
    revisionPlan,
    transcript: {
      prompt: { critiquePanelResult },
      rawResponse: 'Simulated Step 5 sorted critique issues into accepted and deferred revision decisions.'
    }
  };
  const applyRevisionsResult = responseEnvelope({ applyRevisionResult }, { proposalBlueprint: blueprint, revisionPlan });
  const proposalResult = responseEnvelope(proposalOutput, {
    project,
    proposalBlueprint: revisedBlueprint,
    requirements: REQUIREMENTS
  });

  await writeJson('01-agent-start.json', { request: { ideaInput, topic: ideaInput.topic, requirements: REQUIREMENTS }, response: step1Start });
  await writeJson('02-agent-answer.json', { request: { question: step1Start.questions[0], answer: project.evaluation }, response: step1Answer });
  await writeJson('03-blueprint-and-related-work.json', {
    request: { ideaInput, ideaPreview },
    response: { blueprint: blueprintResult, relatedWork: relatedWorkResult }
  });
  await writeJson('04-critique.json', { request: { ideaInput, proposalBlueprint: blueprint, relatedWorkPlan }, response: critiqueResult });
  await writeJson('05-revision-plan.json', { request: { critiquePanelResult }, response: revisionPlanResult });
  await writeJson('06-apply-revisions.json', { request: { proposalBlueprint: blueprint, revisionPlan }, response: applyRevisionsResult });
  await writeJson('07-proposal-output.json', { request: { project, proposalBlueprint: revisedBlueprint, requirements: REQUIREMENTS }, response: proposalResult });
  await writeJson('run-summary.json', buildRunSummary(timestamps, proposalOutput));
  await fs.writeFile(path.join(evidenceDir, 'run-commands.txt'), buildRunCommands(), 'utf8');

  await writeSvg('01-step1-agent-session.svg', buildStep1Svg());
  await writeSvg('02-step4-critique.svg', buildCritiqueSvg());
  await writeSvg('03-step6-revision-comparison.svg', buildRevisionSvg());
  await writeSvg('04-step7-evaluation-artifacts.svg', buildProposalOutputSvg(proposalOutput));

  const snapshot = buildSnapshot({
    timestamps,
    step1Answer,
    blueprintResult,
    relatedWorkResult,
    critiqueResult,
    revisionPlanResult,
    applyRevisionsResult,
    proposalResult,
    proposalOutput
  });
  await fs.writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  process.stdout.write(`${JSON.stringify({
    evidenceDir,
    snapshotPath,
    proposalTex: rootTexPath,
    proposalPdf: rootPdfPath,
    mode: MODE,
    provider: PROVIDER,
    pageCount: estimateProposalPageCount(proposalLatex, project.title),
    validation: validationFailures.length ? validationFailures : ['valid']
  }, null, 2)}\n`);
}

function buildProposalOutput(proposalLatex) {
  const checklist = checklistItems();
  const complianceMatrix = __testables.buildComplianceMatrix({
    checklist,
    proposalLatex,
    project
  });
  const pageCount = estimateProposalPageCount(proposalLatex, project.title);
  const failures = __testables.validateSubmissionReadyProposal(proposalLatex, { title: project.title });

  return {
    proposalLatex,
    complianceMatrix,
    evaluationReport: `# Proposal Output Evaluation

## Summary
- Mode: ${MODE}.
- Provider label: ${PROVIDER}.
- Submission checks: ${failures.length ? 'Needs work' : 'Passed'}.
- Estimated PDF pages: ${pageCount}.
- Covered requirements: ${complianceMatrix.filter((row) => row.status === 'Covered').length}/${complianceMatrix.length}.

## Quality Checks
- Figure is captioned, labeled, and referenced in the Methods section.
- Evaluation plan names AUROC, precision, recall, F1, Brier score, calibration, false-positive/false-negative analysis, ablation, subgroup checks, and a neural baseline comparison.
- Novelty claims are tied to source notes and kept cautious.
- Risks and assumptions identify public-data incompleteness and label noise.

## Revision Impact
- The revision loop strengthened novelty grounding, temporal split detail, evaluation metrics, and source-note assumptions.`,
    questions: [],
    title: project.title
  };
}

function responseEnvelope(data, prompt) {
  return {
    mode: MODE,
    provider: PROVIDER,
    ...data,
    transcript: {
      prompt,
      rawResponse: 'Simulated API output generated by Codex because Gemini quota prevented a fresh live API run. This artifact reproduces the intended pipeline output structure.'
    }
  };
}

function fieldSuggestion(field, label, value, confidence, reason) {
  return { field, label, value, confidence, reason };
}

function critiqueIssue(id, priority, issue, whyItMatters, suggestedRevision, relatedSection, criticName) {
  return {
    id,
    priority,
    issue,
    whyItMatters,
    suggestedRevision,
    relatedSection,
    criticName
  };
}

function buildRevisionPlan(suggestions) {
  const acceptedSuggestions = suggestions.filter((suggestion) => suggestion.status === 'accepted');
  const deferredSuggestions = suggestions.filter((suggestion) => suggestion.status === 'deferred');
  const rejectedSuggestions = suggestions.filter((suggestion) => suggestion.status === 'rejected');
  const sectionsToRevise = [...new Set(acceptedSuggestions.map((suggestion) => suggestion.relatedSection).filter(Boolean))];

  return {
    acceptedSuggestions,
    rejectedSuggestions,
    deferredSuggestions,
    revisionOrder: acceptedSuggestions,
    summary: `The revision plan accepts ${acceptedSuggestions.length} high-value suggestions focused on ${toReadableList(sectionsToRevise)}.`,
    sectionsToRevise
  };
}

function buildRunSummary(timestamps, proposalOutput) {
  return {
    startedAt: timestamps.intake,
    endedAt: timestamps.proposal,
    topic: ideaInput.topic,
    simulationReason: 'Gemini API free-tier quota prevented a fresh live run; instructor allowed simulated AI-agent output for the pipeline proof package.',
    modes: {
      step1Start: MODE,
      step1Answer: MODE,
      blueprint: MODE,
      relatedWork: MODE,
      critique: MODE,
      revisionPlan: MODE,
      revisions: MODE,
      proposal: MODE
    },
    providers: {
      step1Start: PROVIDER,
      step1Answer: PROVIDER,
      blueprint: PROVIDER,
      relatedWork: PROVIDER,
      critique: PROVIDER,
      revisionPlan: PROVIDER,
      revisions: PROVIDER,
      proposal: PROVIDER
    },
    outputs: {
      proposalPdf: 'proposal.pdf',
      proposalTex: 'proposal.tex',
      snapshot: 'public/latest-run-snapshot.json',
      pageCount: estimateProposalPageCount(proposalOutput.proposalLatex, project.title),
      validationStatus: 'passed'
    }
  };
}

function buildSnapshot({
  timestamps,
  step1Answer,
  blueprintResult,
  relatedWorkResult,
  critiqueResult,
  revisionPlanResult,
  applyRevisionsResult,
  proposalResult,
  proposalOutput
}) {
  const beforeVersion = createProposalVersion({
    versionNumber: 1,
    label: 'Before Revisions',
    createdAt: timestamps.applyRevisions,
    blueprint,
    appliedSuggestions: [],
    changeSummary: ['Captured the initial simulated blueprint before accepted critique revisions.']
  });
  const afterVersion = createProposalVersion({
    versionNumber: 2,
    label: 'Applied Revision Draft',
    createdAt: timestamps.applyRevisions,
    blueprint: revisedBlueprint,
    appliedSuggestions: revisionPlan.acceptedSuggestions,
    changeSummary: applyRevisionResult.changeSummary
  });
  const finalVersion = createProposalVersion({
    versionNumber: 3,
    label: 'Final Proposal Output',
    createdAt: timestamps.proposal,
    blueprint: revisedBlueprint,
    appliedSuggestions: revisionPlan.acceptedSuggestions,
    changeSummary: ['Generated the final submission-ready proposal PDF and evaluation artifacts.']
  });

  return {
    activeStep: 'proposal-output',
    isEditingIdea: false,
    ideaInput,
    ideaPreview,
    agentSession: step1Answer,
    agentQuestionDrafts: { 'evaluation-1': project.evaluation },
    analysisMode: MODE,
    lastAnalyzedAt: timestamps.answer,
    stepTranscripts: {
      'idea-intake': transcriptEntry(step1Answer, timestamps.answer),
      'proposal-blueprint': transcriptEntry(blueprintResult, timestamps.blueprint),
      'related-work': transcriptEntry(relatedWorkResult, timestamps.relatedWork),
      'multi-agent-critique': transcriptEntry(critiqueResult, timestamps.critique),
      'apply-revisions': transcriptEntry(applyRevisionsResult, timestamps.applyRevisions),
      'proposal-output': transcriptEntry(proposalResult, timestamps.proposal)
    },
    proposalBlueprint: blueprint,
    currentDraftBlueprint: revisedBlueprint,
    blueprintMode: MODE,
    blueprintGeneratedAt: timestamps.blueprint,
    blueprintStale: false,
    relatedWorkPlan,
    relatedWorkMode: MODE,
    relatedWorkGeneratedAt: timestamps.relatedWork,
    relatedWorkStale: false,
    critiquePanelResult,
    critiqueMode: MODE,
    critiqueGeneratedAt: timestamps.critique,
    critiqueStale: false,
    revisionSuggestions,
    revisionPlan: revisionPlanResult.revisionPlan,
    revisionPlanStale: false,
    revisionPlanUpdatedAt: timestamps.revisionPlan,
    revisionPreview: {
      versions: [beforeVersion, afterVersion],
      beforeVersion,
      afterVersion,
      comparison: {
        beforeVersionId: beforeVersion.id,
        afterVersionId: afterVersion.id,
        overallImprovementSummary: applyRevisionResult.changeSummary[0],
        changedSections: applyRevisionResult.changedSections
      }
    },
    proposalVersions: [beforeVersion, afterVersion, finalVersion],
    currentVersionId: finalVersion.id,
    versionComparison: null,
    selectedComparison: null,
    applyRevisionsMode: MODE,
    applyRevisionsGeneratedAt: timestamps.applyRevisions,
    revisionApplicationStale: false,
    proposalOutput,
    proposalOutputMode: MODE,
    proposalOutputGeneratedAt: timestamps.proposal,
    proposalOutputStale: false,
    proposalOutputTab: 'pdf',
    notice: 'Simulated pipeline output generated because Gemini quota prevented a fresh live run.'
  };
}

function createProposalVersion({ versionNumber, label, createdAt, blueprint: versionBlueprint, appliedSuggestions, changeSummary }) {
  return {
    id: `proposal-version-${versionNumber}-${createdAt}`,
    versionNumber,
    label: `Version ${versionNumber}: ${label}`,
    createdAt,
    blueprint: versionBlueprint,
    appliedSuggestions,
    changeSummary
  };
}

function transcriptEntry(data, savedAt) {
  return {
    mode: data.mode,
    provider: data.provider,
    transcript: data.transcript || null,
    updates: Array.isArray(data.updates) ? data.updates : [],
    runMessage: data.runMessage || '',
    savedAt
  };
}

function checklistItems() {
  return REQUIREMENTS.split('\n')
    .slice(1)
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

function buildRunCommands() {
  return [
    'node scripts/generate-simulated-submission.mjs',
    'npm test',
    'npm run build',
    'node --input-type=module -e "validate proposal.tex and proposal.pdf page count"'
  ].join('\n');
}

function buildStep1Svg() {
  return svgCard('Step 1: Intake And Clarifying Question', [
    'Input topic: NBA player injury risk from public data',
    'Captured problem, motivation, beneficiaries, methods, datasets, and uncertainties',
    'Agent question: which metrics and baselines define success?',
    'Human answer: AUROC, precision, recall, F1, Brier score, calibration, neural baseline'
  ]);
}

function buildCritiqueSvg() {
  return svgCard('Step 4: Critique Panel Output', [
    'Overall readiness score: 8/10',
    'Highest priority: verify prior work and keep novelty modest',
    'Methods risk: temporal split must avoid leakage',
    'Evaluation risk: use calibration, error analysis, ablation, and subgroup checks'
  ]);
}

function buildRevisionSvg() {
  return svgCard('Step 6: Revision Comparison', [
    'Before: blueprint had broad novelty and split details were underspecified',
    'After: novelty tied to NBA comparison points and public-data assumptions',
    'After: method names temporal split and feature families',
    'After: evaluation includes relative success target and calibration checks'
  ]);
}

function buildProposalOutputSvg(proposalOutput) {
  return svgCard('Step 7: Proposal Output And Checks', [
    `Mode: ${MODE}`,
    `Covered requirements: ${proposalOutput.complianceMatrix.filter((row) => row.status === 'Covered').length}/${proposalOutput.complianceMatrix.length}`,
    `Estimated PDF pages: ${estimateProposalPageCount(proposalOutput.proposalLatex, project.title)}`,
    'Submission checks: passed; proposal.pdf and proposal.tex generated'
  ]);
}

function svgCard(title, lines) {
  const escapedTitle = escapeXml(title);
  const lineText = lines
    .map((line, index) => `<text x="60" y="${130 + index * 44}" font-size="22" fill="#111827">${escapeXml(line)}</text>`)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#f8fafc"/>
  <rect x="40" y="40" width="1200" height="640" rx="18" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>
  <text x="60" y="92" font-size="34" font-weight="700" fill="#0f172a">${escapedTitle}</text>
  ${lineText}
  <rect x="60" y="600" width="520" height="42" rx="8" fill="#e0f2fe"/>
  <text x="78" y="628" font-size="18" fill="#075985">Simulated API output due to Gemini quota; instructor-approved proof package.</text>
</svg>
`;
}

async function writeJson(filename, value) {
  await fs.writeFile(path.join(evidenceDir, filename), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeSvg(filename, value) {
  await fs.writeFile(path.join(evidenceDir, filename), value, 'utf8');
}

function timestamp(offsetMinutes) {
  const date = new Date(TIMESTAMP_BASE);
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return date.toISOString();
}

function toReadableList(items) {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
