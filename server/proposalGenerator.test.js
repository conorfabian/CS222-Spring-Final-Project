import assert from 'node:assert/strict';
import test from 'node:test';

import {
  __testables,
  answerAgentQuestion,
  applyAcceptedRevisions,
  generateCritiquePanelResult,
  generateProposal,
  generateProposalBlueprint,
  generateRelatedWorkPlan,
  startAgentSession
} from './proposalGenerator.js';

function sampleIdeaInput() {
  return {
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
}

function sampleIdeaPreview(ideaInput = sampleIdeaInput()) {
  return {
    detectedTopic: `${ideaInput.topic} Domain: ${ideaInput.domain}`,
    problem: ideaInput.problem,
    motivation: `${ideaInput.motivation} Primary beneficiaries: ${ideaInput.beneficiaries}`,
    possibleContribution: ideaInput.expectedContribution,
    missingInformation: ['Need target population', 'Need evaluation plan details'],
    projectTitle: ideaInput.topic,
    evaluationPlan: 'Compare before and after proposal drafts using rubric coverage and specificity checks.',
    resources: ideaInput.datasets,
    references: ideaInput.keywords
  };
}

async function withMockedGeminiFetch(mockFetch, run) {
  const originalFetch = globalThis.fetch;
  const originalEnv = {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_API_URL: process.env.LLM_API_URL,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    LLM_MODEL: process.env.LLM_MODEL,
    LLM_RETRY_DELAY_SCALE: process.env.LLM_RETRY_DELAY_SCALE
  };

  process.env.LLM_API_KEY = 'test-key';
  process.env.LLM_API_URL = 'https://generativelanguage.googleapis.com/v1beta';
  process.env.LLM_PROVIDER = 'gemini';
  process.env.LLM_MODEL = 'gemini-2.5-flash';
  process.env.LLM_RETRY_DELAY_SCALE = '0';
  globalThis.fetch = mockFetch;

  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
}

async function withMissingApiConfig(run) {
  const originalEnv = {
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_API_URL: process.env.LLM_API_URL,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
    LLM_MODEL: process.env.LLM_MODEL
  };

  delete process.env.LLM_API_KEY;
  delete process.env.LLM_API_URL;
  delete process.env.LLM_MODEL;

  try {
    return await run();
  } finally {
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
}

function geminiJsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(payload) }]
          }
        }
      ]
    })
  };
}

function questionApiPayload() {
  return {
    project: {
      title: sampleIdeaInput().topic,
      problem: sampleIdeaInput().problem,
      method: 'Use a staged API-backed workflow.',
      timeline: 'Week 1: plan. Week 2: evaluate.',
      evaluation: 'Compare before and after drafts with rubric coverage.',
      resources: 'Node, React, Gemini API.',
      references: 'Course requirements and source notes.'
    },
    fieldSuggestions: [
      {
        field: 'evaluation',
        label: 'Evaluation Plan',
        value: 'Compare before and after drafts with rubric coverage.',
        confidence: 'High',
        reason: 'This makes success measurable.'
      }
    ],
    decisions: [
      {
        id: 'method-choice',
        title: 'Choose method',
        field: 'method',
        question: 'Which workflow should be used?',
        options: [{ label: 'API first', value: 'Use a staged API-backed workflow.', rationale: 'Avoids template output.' }]
      }
    ],
    questions: [
      {
        id: 'evaluation-1',
        field: 'evaluation',
        question: 'Which metric should be primary?',
        reason: 'Metrics define success.',
        priority: 'Medium'
      }
    ],
    updates: ['Generated with Gemini.']
  };
}

function blueprintApiPayload() {
  const ideaInput = sampleIdeaInput();

  return {
    workingTitle: ideaInput.topic,
    oneSentenceSummary: 'This project builds a citation-grounded proposal assistant for graduate students.',
    problemStatement: ideaInput.problem,
    motivation: ideaInput.motivation,
    researchGap: 'Existing proposal tools often help with writing but do not make uncertainty and source grounding explicit.',
    proposedContribution: ideaInput.expectedContribution,
    researchQuestions: ['Can structured API-backed guidance improve proposal coverage?', 'Which weaknesses remain after revision?'],
    hypotheses: ['API-backed critique will improve rubric coverage compared with the initial draft.'],
    proposedMethod: ideaInput.methods,
    datasetsToolsSystems: ideaInput.datasets,
    evaluationPlan: 'Compare rubric coverage, specificity, and unresolved assumption counts before and after revision.',
    expectedResults: 'The workflow should produce clearer proposal blueprints and revision targets.',
    intellectualMerit: 'The project studies structured human-AI support for early research planning.',
    broaderImpacts: 'Graduate students and instructors can benefit from clearer proposal development support.',
    missingInformation: ['Need verified source notes.'],
    suggestedNextSteps: ['Run related-work planning.']
  };
}

function relatedWorkApiPayload() {
  return {
    searchQueries: ['citation grounded proposal assistant graduate students'],
    keyConcepts: ['proposal writing', 'citation grounding'],
    relatedWorkBuckets: [
      {
        title: 'Proposal Writing Support',
        description: 'Tools and guidance for turning research ideas into proposals.',
        whyItMatters: 'This positions the workflow against existing writing support.',
        exampleSearchTerms: ['proposal writing assistant']
      }
    ],
    suggestedVenuesOrSources: ['CHI', 'ACL'],
    literatureGapQuestions: ['How do existing systems verify source grounding?'],
    unsupportedClaimWarnings: ['Novelty claims need verified sources.'],
    nextSteps: ['Search for comparison systems.']
  };
}

function critiqueApiPayload() {
  return {
    overallScore: 7,
    reviews: [
      {
        criticName: 'Evaluation Plan Critic',
        criticRole: 'Reviews measurement quality.',
        score: 7,
        summary: 'The plan is concrete but needs baseline details.',
        strengths: ['Names rubric coverage.'],
        issues: [
          {
            id: 'eval-1',
            priority: 'High',
            issue: 'Baseline conditions need more detail.',
            whyItMatters: 'Comparison quality affects credibility.',
            suggestedRevision: 'Name the baseline and success metrics.',
            relatedSection: 'Evaluation Plan',
            criticName: 'Evaluation Plan Critic'
          }
        ],
        overallRecommendation: 'Revise evaluation before final output.'
      }
    ],
    highestPriorityIssues: [
      {
        id: 'eval-1',
        priority: 'High',
        issue: 'Baseline conditions need more detail.',
        whyItMatters: 'Comparison quality affects credibility.',
        suggestedRevision: 'Name the baseline and success metrics.',
        relatedSection: 'Evaluation Plan',
        criticName: 'Evaluation Plan Critic'
      }
    ],
    suggestedRevisionOrder: ['Revise the evaluation plan first.']
  };
}

function revisionApiPayload() {
  return {
    revisedBlueprint: {
      ...blueprintApiPayload(),
      evaluationPlan: 'Compare rubric coverage, specificity, unresolved assumption counts, and a plain-chatbot baseline.'
    },
    changeSummary: ['Added baseline details to the evaluation plan.'],
    changedSections: [
      {
        sectionName: 'Evaluation Plan',
        beforeSummary: 'Compared before and after drafts.',
        afterSummary: 'Added rubric, assumption, and baseline comparison details.',
        reasonForChange: 'Accepted critique requested measurable baseline criteria.'
      }
    ]
  };
}

function proposalApiPayload() {
  return {
    proposalLatex: String.raw`\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\title{Citation-Grounded Proposal Assistant}
\author{[Student Name] \\ \texttt{[student@university.edu]} \\ [University / Program]}
\date{}
\begin{document}
\maketitle
\begin{abstract}
This proposal studies whether a citation-grounded proposal assistant can help graduate students turn rough research ideas into stronger proposal drafts. The project focuses on structured intake, source-aware blueprint generation, critique, and revision planning rather than generic text generation. It compares an API-backed proposal workflow with simpler drafting support using rubric coverage, specificity, unresolved-assumption counts, and reviewer judgments. The expected contribution is a compact, reproducible workflow that keeps students in control while making weak novelty claims, missing evidence, and evaluation gaps easier to find before final submission, especially in deadline-driven course settings.
\end{abstract}
\textbf{Keywords:} proposal writing, citation grounding, graduate students, rubric evaluation
\section{Introduction}
This topic matters to students. The proposal compares its novelty against related work, prior workflow tools, and source notes from the literature review.
\section{Project Goal}
The goal is to test whether structured guidance improves proposal quality.
\section{Methods}
The workflow collects intake, generates a blueprint, critiques weaknesses, and applies revisions. Figure~\ref{fig:workflow} summarizes the process.
\begin{figure}
\caption{Workflow overview}
\label{fig:workflow}
\end{figure}
\section{Expected Results and Research Milestones}
The expected result is improved rubric coverage and clearer revision targets over a short milestone plan.
\begin{itemize}
\item Weeks 1--2: collect proposal guidance, source notes, and sample rubric criteria.
\item Weeks 3--4: implement structured intake, blueprint generation, and critique prompts.
\item Weeks 5--6: compare baseline and revised drafts with rubric and source-note checks.
\end{itemize}
\section{Evaluation Plan}
The study will compare baseline and revised drafts with rubric coverage, reviewer scores, unresolved assumption counts, and pass/fail scenario tests.
\section{Risks and Mitigation}
Risks include weak source grounding and scope creep.
\section{Resources, Tools, Budget, or Release Plan}
The project uses React, Node, and Gemini API.
\section{References, Assumptions, or Source Notes}
Source notes will be verified before final claims.
\end{document}`,
    complianceMatrix: [],
    evaluationReport: '# Evaluation Report\n\nThe proposal covers the required sections.',
    questions: []
  };
}

test('pipeline generation requires API configuration', async () => {
  await withMissingApiConfig(async () => {
    await assert.rejects(
      () =>
        startAgentSession({
          ideaInput: sampleIdeaInput(),
          topic: sampleIdeaInput().topic
        }),
      /API-backed proposal generation is required/
    );
  });
});

test('startAgentSession retries one transient Gemini overload and still returns api mode', async () => {
  let callCount = 0;

  const result = await withMockedGeminiFetch(async () => {
    callCount += 1;

    if (callCount === 1) {
      return {
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'
          }
        })
      };
    }

    return geminiJsonResponse(questionApiPayload());
  }, () =>
    startAgentSession({
      ideaInput: sampleIdeaInput(),
      topic: sampleIdeaInput().topic
    })
  );

  assert.equal(callCount, 2);
  assert.equal(result.mode, 'api');
  assert.equal(result.provider, 'gemini');
});

test('startAgentSession propagates repeated Gemini overload errors', async () => {
  await assert.rejects(
    () =>
      withMockedGeminiFetch(
        async () => ({
          ok: false,
          status: 503,
          json: async () => ({
            error: {
              message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'
            }
          })
        }),
        () =>
          startAgentSession({
            ideaInput: sampleIdeaInput(),
            topic: sampleIdeaInput().topic
          })
      ),
    /Gemini API request failed after 3 attempt/
  );
});

test('Gemini quota retry delay is parsed and capped', () => {
  assert.equal(__testables.extractGeminiRetryDelayMs({ message: 'Please retry in 25.994786169s.' }), 25995);
  assert.equal(__testables.extractGeminiRetryDelayMs({ details: [{ retryDelay: '45s' }] }), 45000);
  assert.equal(__testables.calculateGeminiRetryDelayMs({ retryDelayMs: 45_000 }, 1), 30_000);
});

test('Gemini quota exhaustion surfaces a clear error after retries', async () => {
  await assert.rejects(
    () =>
      withMockedGeminiFetch(
        async () => ({
          ok: false,
          status: 429,
          json: async () => ({
            error: {
              message:
                'You exceeded your current quota. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests. Please retry in 25.994786169s.'
            }
          })
        }),
        () =>
          generateProposalBlueprint({
            ideaInput: sampleIdeaInput(),
            ideaPreview: sampleIdeaPreview()
          })
      ),
    /Gemini API quota exceeded after 3 attempt/
  );
});

test('answerAgentQuestion integrates the answer with API output', async () => {
  const updated = await withMockedGeminiFetch(
    async () => geminiJsonResponse(questionApiPayload()),
    () =>
      answerAgentQuestion({
        project: { title: sampleIdeaInput().topic, topic: sampleIdeaInput().topic },
        question: {
          id: 'evaluation-1',
          field: 'evaluation',
          question: 'How will this be evaluated?',
          reason: 'The evaluation needs detail.',
          priority: 'High'
        },
        answer: 'Compare before and after drafts with rubric coverage.'
      })
  );

  assert.equal(updated.mode, 'api');
  assert.match(updated.project.evaluation, /rubric coverage/i);
});

test('successful API responses produce valid objects for blueprint, related work, critique, revisions, and proposal output', async () => {
  const ideaInput = sampleIdeaInput();
  const responses = [
    blueprintApiPayload(),
    relatedWorkApiPayload(),
    critiqueApiPayload(),
    revisionApiPayload(),
    proposalApiPayload()
  ];
  const result = await withMockedGeminiFetch(
    async () => geminiJsonResponse(responses.shift()),
    async () => {
      const blueprint = await generateProposalBlueprint({
        ideaInput,
        ideaPreview: sampleIdeaPreview(ideaInput)
      });
      const related = await generateRelatedWorkPlan({
        ideaInput,
        proposalBlueprint: blueprint.blueprint
      });
      const critique = await generateCritiquePanelResult({
        ideaInput,
        proposalBlueprint: blueprint.blueprint,
        relatedWorkPlan: related.relatedWorkPlan
      });
      const revision = await applyAcceptedRevisions({
        proposalBlueprint: blueprint.blueprint,
        revisionPlan: {
          acceptedSuggestions: critique.critiquePanelResult.highestPriorityIssues,
          rejectedSuggestions: [],
          deferredSuggestions: [],
          revisionOrder: [],
          summary: 'Revise evaluation.',
          sectionsToRevise: ['Evaluation Plan']
        }
      });
      const proposal = await generateProposal({
        project: {
          title: ideaInput.topic,
          topic: ideaInput.topic,
          problem: ideaInput.problem,
          method: ideaInput.methods,
          timeline: 'Month 1: source review. Month 2: workflow design. Month 3: evaluation and revision.',
          evaluation: 'Compare required-section coverage and reviewer rubric scores against a plain chatbot baseline.',
          resources: 'React, Node, Gemini API.',
          references: 'Course proposal requirements; source notes on proposal-writing support tools.'
        },
        proposalBlueprint: revision.applyRevisionResult.revisedBlueprint
      });

      return { blueprint, related, critique, revision, proposal };
    }
  );

  assert.equal(result.blueprint.mode, 'api');
  assert.ok(result.related.relatedWorkPlan.searchQueries.length > 0);
  assert.equal(result.critique.critiquePanelResult.overallScore, 7);
  assert.match(result.revision.applyRevisionResult.revisedBlueprint.evaluationPlan, /plain-chatbot baseline/i);
  assert.match(result.proposal.proposalLatex, /\\begin\{abstract\}/);
});

test('malformed API JSON fails instead of returning template content', async () => {
  await assert.rejects(
    () =>
      withMockedGeminiFetch(
        async () => ({
          ok: true,
          status: 200,
          json: async () => ({
            candidates: [{ content: { parts: [{ text: 'not json' }] } }]
          })
        }),
        () =>
          generateRelatedWorkPlan({
            ideaInput: sampleIdeaInput(),
            proposalBlueprint: blueprintApiPayload()
          })
      ),
    /invalid JSON/
  );
});

test('artifact-based compliance matrix marks missing sections as needs work', () => {
  const matrix = __testables.buildComplianceMatrix({
    checklist: ['Project title', 'Project goal', 'Abstract'],
    proposalLatex: String.raw`\documentclass{article}
\title{Example Proposal}
\begin{document}
\section{Project Goal}
This section exists.
\end{document}`,
    project: {
      title: 'Example Proposal',
      problem: '',
      method: '',
      timeline: '',
      evaluation: '',
      resources: '',
      references: ''
    }
  });

  assert.equal(matrix.find((row) => row.requirement === 'Project title')?.status, 'Covered');
  assert.equal(matrix.find((row) => row.requirement === 'Project goal')?.status, 'Covered');
  assert.equal(matrix.find((row) => row.requirement === 'Abstract')?.status, 'Needs work');
});

test('normalizeCritiqueIssue accepts snake_case API payloads', () => {
  const issue = __testables.normalizeCritiqueIssue({
    id: 'issue-1',
    priority: 'high',
    issue: 'Evaluation is vague.',
    why_it_matters: 'Reviewers need measurable success criteria.',
    suggested_revision: 'Add metrics and baselines.',
    related_section: 'Evaluation Plan',
    critic_name: 'Evaluation Plan Critic'
  });

  assert.equal(issue.priority, 'High');
  assert.equal(issue.relatedSection, 'Evaluation Plan');
  assert.equal(issue.criticName, 'Evaluation Plan Critic');
});

test('API proposal output includes abstract keywords figure and stage-3 sections', async () => {
  const ideaInput = sampleIdeaInput();
  const proposal = await withMockedGeminiFetch(
    async () => geminiJsonResponse(proposalApiPayload()),
    () =>
      generateProposal({
        project: {
          title: ideaInput.topic,
          topic: ideaInput.topic,
          problem: ideaInput.problem,
          method: ideaInput.methods,
          timeline: 'Month 1: source review. Month 2: workflow design. Month 3: evaluation and revision.',
          evaluation:
            'Compare required-section coverage, reviewer rubric scores, unresolved assumptions, and before/after draft quality against a plain chatbot baseline.',
          resources: 'React, Node, Gemini API, proposal examples.',
          references: 'Course proposal requirements; source notes on proposal-writing support tools.'
        },
        proposalBlueprint: blueprintApiPayload(),
        requirements: `Proposal must include:
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
- References, assumptions, or source notes`
      })
  );

  assert.equal(proposal.mode, 'api');
  assert.match(proposal.proposalLatex, /\\begin\{abstract\}/);
  assert.match(proposal.proposalLatex, /\\textbf\{Keywords:\}/);
  assert.match(proposal.proposalLatex, /\\section\{Introduction\}/);
  assert.match(proposal.proposalLatex, /\\section\{Methods\}/);
  assert.match(proposal.proposalLatex, /\\begin\{figure\}/);
  assert.match(proposal.proposalLatex, /Figure~\\ref\{fig:workflow\}/);
});

test('submission validator accepts compact compliant proposal output', () => {
  const failures = __testables.validateSubmissionReadyProposal(proposalApiPayload().proposalLatex, {
    title: 'Citation-Grounded Proposal Assistant'
  });

  assert.deepEqual(failures, []);
});

test('generateProposal rejects API output over the three-page limit', async () => {
  const longParagraph = 'This extra paragraph intentionally expands the generated proposal with repeated background detail, additional claims, and unnecessary explanation so that the built-in PDF renderer must paginate beyond the course limit for the final artifact. ';
  const oversized = {
    ...proposalApiPayload(),
    proposalLatex: proposalApiPayload().proposalLatex.replace(
      '\\section{Project Goal}',
      `${Array.from({ length: 45 }, () => longParagraph).join('\n\n')}\n\\section{Project Goal}`
    )
  };

  await assert.rejects(
    () =>
      withMockedGeminiFetch(
        async () => geminiJsonResponse(oversized),
        () =>
          generateProposal({
            project: { title: 'Oversized Proposal', topic: 'Oversized Proposal' },
            proposalBlueprint: blueprintApiPayload()
          })
      ),
    /PDF is \d+ pages/
  );
});

test('submission validator rejects missing figure caption or reference', () => {
  const withoutReferencedFigure = proposalApiPayload().proposalLatex
    .replace('Figure~\\ref{fig:workflow} summarizes the process.', 'The workflow is summarized below.')
    .replace('\\caption{Workflow overview}', '');
  const failures = __testables.validateSubmissionReadyProposal(withoutReferencedFigure, {
    title: 'Citation-Grounded Proposal Assistant'
  });

  assert.ok(failures.some((failure) => /figure must include/.test(failure)), failures);
});

test('submission validator rejects oversized abstracts and repeated intake text', () => {
  const repeated = 'Graduate students often start with vague research directions and struggle to turn them into structured graduate-style proposal drafts with clear scope, concrete evaluation, and source-grounded novelty claims before submission. ';
  const badLatex = proposalApiPayload().proposalLatex.replace(
    /\\begin\{abstract\}[\s\S]*?\\end\{abstract\}/,
    `\\begin{abstract}\n${Array.from({ length: 10 }, () => repeated).join('')}\n\\end{abstract}`
  );
  const failures = __testables.validateSubmissionReadyProposal(badLatex, {
    title: 'Citation-Grounded Proposal Assistant'
  });

  assert.ok(failures.some((failure) => /abstract must be 90-130 words/.test(failure)), failures);
  assert.ok(failures.some((failure) => /repeats long blocks/.test(failure)), failures);
});

test('submission validator rejects vague evaluation plans', () => {
  const badLatex = proposalApiPayload().proposalLatex.replace(
    /\\section\{Evaluation Plan\}[\s\S]*?\\section\{Risks and Mitigation\}/,
    '\\section{Evaluation Plan}\nThe project will be evaluated later to see whether the proposal is better and more useful.\n\\section{Risks and Mitigation}'
  );
  const failures = __testables.validateSubmissionReadyProposal(badLatex, {
    title: 'Citation-Grounded Proposal Assistant'
  });

  assert.ok(failures.some((failure) => /evaluation plan must name concrete metrics/.test(failure)), failures);
});

test('submission validator rejects unresolved workflow notes', () => {
  const badLatex = proposalApiPayload().proposalLatex.replace(
    '\\section{Expected Results and Research Milestones}',
    '\\section{Expected Results and Research Milestones}\nReview the revised blueprint and resolve the missing-information list before treating this blueprint as a stable proposal version.\n'
  );
  const failures = __testables.validateSubmissionReadyProposal(badLatex, {
    title: 'Citation-Grounded Proposal Assistant'
  });

  assert.ok(failures.some((failure) => /workflow\/debug artifact/.test(failure)), failures);
});

test('figure requirement needs a real figure and text reference', () => {
  const checklist = ['Figure or diagram with caption'];
  const noReference = __testables.buildComplianceMatrix({
    checklist,
    proposalLatex: String.raw`\documentclass{article}
\title{Example Proposal}
\begin{document}
\begin{figure}
\caption{Workflow overview}
\label{fig:workflow}
\end{figure}
\end{document}`,
    project: {}
  });
  const withReference = __testables.buildComplianceMatrix({
    checklist,
    proposalLatex: String.raw`\documentclass{article}
\title{Example Proposal}
\begin{document}
Figure~\ref{fig:workflow} shows the process.
\begin{figure}
\caption{Workflow overview}
\label{fig:workflow}
\end{figure}
\end{document}`,
    project: {}
  });

  assert.equal(noReference[0].status, 'Needs work');
  assert.equal(withReference[0].status, 'Covered');
});

test('evaluation and introduction requirements need concrete grounding', () => {
  const checklist = [
    'Introduction: motivation, gap, and relevant prior work or source notes',
    'Evaluation plan'
  ];
  const weakMatrix = __testables.buildComplianceMatrix({
    checklist,
    proposalLatex: String.raw`\documentclass{article}
\title{Example Proposal}
\begin{document}
\section{Introduction}
This topic matters to students and may improve proposal quality.
\section{Evaluation Plan}
The system will be evaluated later.
\end{document}`,
    project: {}
  });
  const groundedMatrix = __testables.buildComplianceMatrix({
    checklist,
    proposalLatex: String.raw`\documentclass{article}
\title{Example Proposal}
\begin{document}
\section{Introduction}
This topic matters to students. The proposal compares its novelty against related work, prior workflow tools, and source notes from the literature review.
\section{Evaluation Plan}
The study will compare baseline and revised drafts with rubric coverage, reviewer scores, unresolved assumption counts, and pass/fail scenario tests.
\end{document}`,
    project: {}
  });

  assert.equal(weakMatrix[0].status, 'Needs work');
  assert.equal(weakMatrix[1].status, 'Needs work');
  assert.equal(groundedMatrix[0].status, 'Covered');
  assert.equal(groundedMatrix[1].status, 'Covered');
});
