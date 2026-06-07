import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import 'dotenv/config';

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
const outputDir = path.join(rootDir, 'evidence', 'stage2-run-01');

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
  topic: 'Predicting NBA player injury risk from public data with interpretable machine learning',
  domain: 'sports analytics, machine learning, and health-related risk modeling',
  problem:
    'NBA teams and analysts can access public game logs and injury reports, but it is still hard to build an interpretable injury-risk model that is useful without private biometric data.',
  motivation:
    'Public-data injury prediction could help smaller teams, researchers, and students study player availability without needing internal team systems. The main challenge is building a realistic and testable model instead of making vague claims about prediction.',
  beneficiaries:
    'sports analytics students, researchers, team analysts with limited resources, and instructors evaluating proposal quality',
  keywords:
    'NBA, injury prediction, interpretable machine learning, XGBoost, random forest, public data',
  methods:
    'Collect public NBA game logs and injury reports, engineer workload and history features, train interpretable classic machine learning baselines, compare them against a simpler neural baseline, and use a proposal agent to critique the plan before final drafting.',
  datasets:
    'Pro Sports Transactions injury data, stats.nba.com game logs, Basketball-Reference player history, and source notes from prior sports injury prediction papers.',
  expectedContribution:
    'A realistic proposal for an NBA injury-risk study that favors interpretable public-data baselines and clearly states how it differs from prior deep learning work.',
  uncertainties:
    'The proposal still needs a concrete evaluation metric set, a clear novelty statement against prior work, a figure, and a scoped milestone plan.'
};

const answerText =
  'Use AUROC, precision, recall, F1, calibration, and Brier score. Compare XGBoost and random forest against logistic regression and a simple neural-network baseline. Also track false positives, false negatives, and whether the model remains useful when only public data is available.';

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const startRequest = {
    ideaInput,
    topic: ideaInput.topic,
    requirements: REQUIREMENTS
  };
  const start = await runWorkflowStep('Step 1 start', () => startAgentSession(startRequest));
  await writeJson('01-agent-start.json', {
    request: startRequest,
    response: start
  });
  const chosenQuestion = start.questions.find((question) => question.field === 'evaluation') || start.questions[0] || null;
  const answerRequest = {
    project: start.project,
    question: chosenQuestion,
    answer: answerText
  };
  const answer = await runWorkflowStep('Step 1 answer', () => answerAgentQuestion(answerRequest));
  await writeJson('02-agent-answer.json', {
    request: {
      question: chosenQuestion,
      answer: answerText
    },
    response: answer
  });
  const project = answer.project;

  const ideaPreview = {
    detectedTopic: `${project.title || ideaInput.topic} Domain: ${ideaInput.domain}`,
    problem: project.problem || ideaInput.problem,
    motivation: `${ideaInput.motivation} Beneficiaries: ${ideaInput.beneficiaries}`,
    possibleContribution: ideaInput.expectedContribution,
    missingInformation: answer.questions.map((question) => question.question),
    projectTitle: project.title || ideaInput.topic,
    evaluationPlan: project.evaluation,
    resources: project.resources || ideaInput.datasets,
    references: project.references || 'Prior sports injury prediction papers and explicit assumptions for public-data limits.'
  };

  const blueprint = await runWorkflowStep('Step 2 blueprint', () => generateProposalBlueprint({
    ideaInput,
    ideaPreview
  }));
  const related = await runWorkflowStep('Step 3 related work', () => generateRelatedWorkPlan({
    ideaInput,
    proposalBlueprint: blueprint.blueprint
  }));
  const critique = await runWorkflowStep('Step 4 critique', () => generateCritiquePanelResult({
    ideaInput,
    proposalBlueprint: blueprint.blueprint,
    relatedWorkPlan: related.relatedWorkPlan
  }));
  await writeJson('03-critique.json', {
    request: {
      ideaInput,
      proposalBlueprint: blueprint.blueprint,
      relatedWorkPlan: related.relatedWorkPlan
    },
    response: critique
  });

  const acceptedSuggestions = critique.critiquePanelResult.highestPriorityIssues.slice(0, 2).map((issue) => ({
    id: issue.id,
    sourceCritic: issue.criticName || 'Proposal Critic',
    priority: issue.priority,
    relatedSection: issue.relatedSection,
    issue: issue.issue,
    whyItMatters: issue.whyItMatters,
    suggestedRevision: issue.suggestedRevision,
    status: 'accepted'
  }));
  const rejectedSuggestions = critique.critiquePanelResult.highestPriorityIssues.slice(2, 4).map((issue) => ({
    id: issue.id,
    sourceCritic: issue.criticName || 'Proposal Critic',
    priority: issue.priority,
    relatedSection: issue.relatedSection,
    issue: issue.issue,
    whyItMatters: issue.whyItMatters,
    suggestedRevision: issue.suggestedRevision,
    status: 'rejected',
    userNote: 'Left for later to keep the first revision pass small.'
  }));
  const revisionPlan = {
    acceptedSuggestions,
    rejectedSuggestions,
    deferredSuggestions: [],
    revisionOrder: [...new Set(acceptedSuggestions.map((item) => item.relatedSection).filter(Boolean))],
    summary: 'Accept the highest-priority issues first so the draft gets a clearer novelty claim and evaluation plan.',
    sectionsToRevise: [...new Set(acceptedSuggestions.map((item) => item.relatedSection).filter(Boolean))]
  };

  const revisionRequest = {
    proposalBlueprint: blueprint.blueprint,
    revisionPlan
  };
  const revisions = await runWorkflowStep('Step 6 apply revisions', () => applyAcceptedRevisions(revisionRequest));
  await writeJson('04-apply-revisions.json', {
    request: {
      revisionPlan
    },
    response: revisions
  });
  const proposalRequest = {
    project: {
      ...project,
      topic: ideaInput.topic,
      timeline:
        project.timeline ||
        'Month 1: source review and dataset audit. Month 2: feature engineering and baseline models. Month 3: evaluation and error analysis. Month 4: proposal revision and release of source notes.'
    },
    proposalBlueprint: revisions.applyRevisionResult.revisedBlueprint,
    requirements: REQUIREMENTS
  };
  const proposal = await runWorkflowStep('Step 7 proposal', () => generateProposal(proposalRequest));
  await writeJson('05-proposal.json', {
    request: {
      project,
      proposalBlueprint: revisions.applyRevisionResult.revisedBlueprint,
      requirements: REQUIREMENTS
    },
    response: proposal
  });

  const endedAt = new Date().toISOString();
  const summary = {
    startedAt,
    endedAt,
    topic: ideaInput.topic,
    modes: {
      step1Start: start.mode,
      step1Answer: answer.mode,
      blueprint: blueprint.mode,
      relatedWork: related.mode,
      critique: critique.mode,
      revisions: revisions.mode,
      proposal: proposal.mode
    },
    providers: {
      step1Start: start.provider || '',
      step1Answer: answer.provider || '',
      blueprint: blueprint.provider || '',
      relatedWork: related.provider || '',
      critique: critique.provider || '',
      revisions: revisions.provider || '',
      proposal: proposal.provider || ''
    }
  };

  await writeJson('run-summary.json', summary);

  await fs.writeFile(
    path.join(outputDir, 'run-commands.txt'),
    [
      'npm test',
      'npm run build',
      'npm run capture:stage2:evidence'
    ].join('\n'),
    'utf8'
  );

  await writeSvg(
    '01-step1-agent-session.svg',
    buildEvidenceSvg('Step 1 Agent Session', [
      {
        heading: 'Run mode',
        lines: [
          `start mode: ${start.mode}${start.provider ? ` (${start.provider})` : ''}`,
          `answer mode: ${answer.mode}${answer.provider ? ` (${answer.provider})` : ''}`
        ]
      },
      {
        heading: 'Suggested fields',
        lines: start.fieldSuggestions.slice(0, 4).map((item) => `${item.label}: ${item.value}`)
      },
      {
        heading: 'Decision cards',
        lines: start.decisions.slice(0, 2).map((item) => `${item.title}: ${item.question}`)
      },
      {
        heading: 'Question and answer',
        lines: [
          chosenQuestion?.question || 'No open question returned.',
          `Answer: ${answerText}`
        ]
      }
    ])
  );

  await writeSvg(
    '02-step4-critique.svg',
    buildEvidenceSvg('Step 4 Critique', [
      {
        heading: 'Run mode',
        lines: [`mode: ${critique.mode}${critique.provider ? ` (${critique.provider})` : ''}`, `overall score: ${critique.critiquePanelResult.overallScore}/10`]
      },
      {
        heading: 'Highest priority issues',
        lines: critique.critiquePanelResult.highestPriorityIssues.slice(0, 4).map((issue) => `[${issue.priority}] ${issue.relatedSection || 'General'}: ${issue.issue}`)
      },
      {
        heading: 'Why these matter',
        lines: critique.critiquePanelResult.highestPriorityIssues.slice(0, 3).map((issue) => issue.whyItMatters)
      }
    ])
  );

  await writeSvg(
    '03-step6-revision-comparison.svg',
    buildEvidenceSvg('Step 6 Revision Comparison', [
      {
        heading: 'Accepted suggestions',
        lines: acceptedSuggestions.map((issue) => `${issue.relatedSection || 'General'}: ${issue.suggestedRevision}`)
      },
      {
        heading: 'Changed sections',
        lines: revisions.applyRevisionResult.changedSections.slice(0, 4).map(
          (section) => `${section.sectionName}: before=${section.beforeSummary || 'n/a'} | after=${section.afterSummary || 'n/a'}`
        )
      },
      {
        heading: 'Change summary',
        lines: revisions.applyRevisionResult.changeSummary
      }
    ])
  );

  await writeSvg(
    '04-step7-evaluation-artifacts.svg',
    buildEvidenceSvg('Step 7 Proposal Output', [
      {
        heading: 'Run mode',
        lines: [`mode: ${proposal.mode}${proposal.provider ? ` (${proposal.provider})` : ''}`]
      },
      {
        heading: 'Compliance matrix',
        lines: proposal.complianceMatrix.slice(0, 6).map((row) => `${row.status}: ${row.requirement}`)
      },
      {
        heading: 'Evaluation report',
        lines: splitIntoSentences(proposal.evaluationReport).slice(0, 5)
      },
      {
        heading: 'Remaining questions',
        lines: proposal.questions.length ? proposal.questions : ['No remaining question returned in this run.']
      }
    ])
  );
}

async function writeJson(fileName, data) {
  await fs.writeFile(path.join(outputDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeSvg(fileName, content) {
  await fs.writeFile(path.join(outputDir, fileName), content, 'utf8');
}

function buildEvidenceSvg(title, sections) {
  const width = 1400;
  const height = 920;
  let y = 110;
  const blocks = [];

  sections.forEach((section) => {
    const wrappedLines = section.lines.flatMap((line) => wrapLine(line, 96));
    const blockHeight = 52 + wrappedLines.length * 24;

    blocks.push(`
      <rect x="60" y="${y}" width="${width - 120}" height="${blockHeight}" rx="16" fill="#ffffff" stroke="#1f2937" stroke-width="2" />
      <text x="84" y="${y + 34}" font-size="26" font-weight="700" fill="#111827">${escapeXml(section.heading)}</text>
      ${wrappedLines
        .map(
          (line, index) =>
            `<text x="84" y="${y + 68 + index * 24}" font-size="20" fill="#1f2937">${escapeXml(line)}</text>`
        )
        .join('')}
    `);

    y += blockHeight + 24;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f3f4f6" />
  <text x="60" y="64" font-size="40" font-weight="700" fill="#111827">${escapeXml(title)}</text>
  <text x="60" y="92" font-size="20" fill="#4b5563">Evidence file generated from the captured Stage 2 run.</text>
  ${blocks.join('')}
</svg>
`;
}

function wrapLine(value, maxLength) {
  const words = String(value || '').split(/\s+/).filter(Boolean);

  if (!words.length) {
    return [''];
  }

  const lines = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const next = `${current} ${words[index]}`;
    if (next.length <= maxLength) {
      current = next;
    } else {
      lines.push(current);
      current = words[index];
    }
  }

  lines.push(current);
  return lines;
}

function splitIntoSentences(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function runWorkflowStep(label, task) {
  let lastResult = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await task();
    lastResult = result;

    if (!shouldRetryResult(result) || attempt === 3) {
      return result;
    }

    console.log(`${label}: retrying after temporary API pressure (attempt ${attempt}).`);
    await wait(1500 * attempt);
  }

  return lastResult;
}

function shouldRetryResult(result) {
  const responseText = String(result?.transcript?.rawResponse || '');
  return result?.mode === 'local-fallback' && /(high demand|try again later|quota|temporarily unavailable|429)/i.test(responseText);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
