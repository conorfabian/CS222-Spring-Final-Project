const DEFAULT_REQUIREMENTS = `Proposal must include:
- Project title
- Abstract
- Motivation and gap
- Project goal
- Method or agent workflow
- Figure or diagram with caption
- Expected results
- Research milestones with timeline estimates
- Evaluation plan
- Risks and mitigation
- Resources or budget
- References, assumptions, or source notes`;

const EMPTY_PROJECT_FOR_SERVER = {
  title: '',
  topic: '',
  problem: '',
  method: '',
  timeline: '',
  evaluation: '',
  resources: '',
  references: '',
  requirements: DEFAULT_REQUIREMENTS
};

const SYSTEM_PROMPT = `You are a research proposal agent for a CS research proposal.

Return strict JSON with this shape:
{
  "proposalLatex": "complete, compile-ready LaTeX source for proposal.tex",
  "complianceMatrix": [
    {
      "requirement": "requirement text",
      "status": "Covered | Needs work",
      "evidence": "short evidence",
      "fix": "short next action"
    }
  ],
  "evaluationReport": "plain text or Markdown report with missing items, weak claims, timeline risks, and revision priorities",
  "questions": ["short clarifying question"]
}

Rules:
- The proposal artifact must be LaTeX, not Markdown.
- Return a complete LaTeX document with \\documentclass[11pt]{article}, 1-inch margins, title, sections, and bibliography/source notes.
- Use compile-safe LaTeX. Avoid minted, shell-escape, external images, custom fonts, or packages that require extra system tools.
- Do not use \\includegraphics or reference external image files. Build figures directly in LaTeX with text boxes, minipages, tabular layouts, lists, or simple arrows.
- Write the final artifact as a research proposal, not as a short course implementation report.
- Keep the proposed research plan credible, appropriately scoped, and supported by milestones, resources, risks, and evaluation criteria.
- Mark unsupported claims as assumptions.
- Include a concrete agent workflow when the method involves an agent.
- Include at least one LaTeX-native figure, diagram, workflow chart, or architecture sketch with a caption.
- Do not invent citations. Use source notes or assumptions when sources are missing.`;

const QUESTION_SYSTEM_PROMPT = `You are running an interactive proposal-agent workflow.

Return strict JSON:
{
  "project": {
    "title": "",
    "problem": "",
    "method": "",
    "timeline": "",
    "evaluation": "",
    "resources": "",
    "references": ""
  },
  "fieldSuggestions": [
    {
      "field": "title | problem | method | timeline | evaluation | resources | references",
      "label": "human-readable label",
      "value": "specific suggested content",
      "confidence": "High | Medium | Low",
      "reason": "why this suggestion fits the rough idea"
    }
  ],
  "decisions": [
    {
      "id": "short-stable-id",
      "title": "decision title",
      "field": "problem | method | timeline | evaluation | resources | references",
      "question": "context-aware decision prompt",
      "options": [
        {
          "label": "short option label",
          "value": "content to write into the project state",
          "rationale": "when this option is a good fit"
        }
      ]
    }
  ],
  "questions": [
    {
      "field": "problem | method | evaluation | timeline | resources | references",
      "question": "one concise question",
      "reason": "why this answer matters",
      "priority": "High | Medium | Low"
    }
  ],
  "updates": ["short state update"]
}

First infer concrete proposal data from the rough idea. Give the user suggested data and selectable options before asking open-ended questions. Ask open-ended questions only for information that cannot be reasonably inferred.`;

const BLUEPRINT_SYSTEM_PROMPT = `You are a graduate research proposal coach helping a student turn a rough research idea into a strong proposal blueprint.

Return strict JSON with this exact shape:
{
  "workingTitle": "",
  "oneSentenceSummary": "",
  "problemStatement": "",
  "motivation": "",
  "researchGap": "",
  "proposedContribution": "",
  "researchQuestions": ["", ""],
  "hypotheses": ["", ""],
  "proposedMethod": "",
  "datasetsToolsSystems": "",
  "evaluationPlan": "",
  "expectedResults": "",
  "intellectualMerit": "",
  "broaderImpacts": "",
  "missingInformation": ["", ""],
  "suggestedNextSteps": ["", ""]
}

Rules:
- Generate a blueprint, not a final proposal draft.
- Preserve the student's original intent and scope.
- Do not invent fake citations, related work, or highly specific unsupported claims.
- If information is missing, say so clearly in "missingInformation".
- Keep the output useful for later critique, revision, related-work retrieval, and version tracking.
- Research questions and hypotheses can be provisional, but they must stay grounded in the intake.
- Return valid JSON only.`;

const RELATED_WORK_SYSTEM_PROMPT = `You are a graduate research proposal assistant helping a student plan the related work section of a research proposal.

Return strict JSON with this exact shape:
{
  "searchQueries": ["", ""],
  "keyConcepts": ["", ""],
  "relatedWorkBuckets": [
    {
      "title": "",
      "description": "",
      "whyItMatters": "",
      "exampleSearchTerms": ["", ""]
    }
  ],
  "suggestedVenuesOrSources": ["", ""],
  "literatureGapQuestions": ["", ""],
  "unsupportedClaimWarnings": ["", ""],
  "nextSteps": ["", ""]
}

Rules:
- Generate literature search directions, not verified citations.
- Do not invent paper titles, authors, venues, publication years, or novelty claims.
- Use the student's intake and proposal blueprint to identify research areas, search terms, and gap-finding questions.
- Make unsupported-claim risks explicit.
- Keep the result useful for later paper retrieval, critique, revision, and version tracking.
- Return valid JSON only.`;

export async function startAgentSession(payload) {
  const project = normalizePayload(payload);
  const checklist = extractChecklist(project.requirements || DEFAULT_REQUIREMENTS);

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    const result = await refineProjectWithApi({
      task: 'start',
      project,
      checklist,
      activeQuestion: null,
      answer: ''
    });

    return {
      ...result,
      project: keepOnlyAcceptedStartFields(project, result.project),
      checklist,
      inputSummary: summarizeProjectInput(result.project),
      runMessage: `Initialized topic and prepared ${result.fieldSuggestions.length} suggested field(s) and ${result.decisions.length} decision card(s).`
    };
  }

  const questions = buildQuestionObjects(project);
  const fieldSuggestions = buildFieldSuggestions(project);
  const decisions = buildDecisionCards(project);

  return {
    mode: 'local-fallback',
    provider: 'template',
    project,
    checklist,
    suggestedProject: projectFromSuggestions(project, fieldSuggestions),
    fieldSuggestions,
    decisions,
    questions,
    inputSummary: summarizeProjectInput(project),
    updates: [`Initialized topic: ${project.title}.`],
    runMessage: `Initialized topic and prepared ${fieldSuggestions.length} fallback suggestion(s).`,
    transcript: {
      prompt: { task: 'start', project, checklist },
      rawResponse: 'Generated by local fallback because LLM_API_KEY or LLM_API_URL is not configured.'
    }
  };
}

export async function answerAgentQuestion(payload) {
  const project = normalizePayload(payload.project || payload);
  const checklist = extractChecklist(project.requirements || payload.requirements || DEFAULT_REQUIREMENTS);
  const activeQuestion = normalizeQuestion(payload.question);
  const answer = clean(payload.answer);

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    const result = await refineProjectWithApi({
      task: 'integrate-answer',
      project,
      checklist,
      activeQuestion,
      answer
    });

    return {
      ...result,
      checklist,
      inputSummary: summarizeProjectInput(result.project),
      runMessage: result.updates.join(' ') || 'Integrated answer with model reasoning.'
    };
  }

  const integration = integrateAnswerLocally(project, answer, activeQuestion);
  const questions = buildQuestionObjects(integration.project);

  return {
    mode: 'local-fallback',
    provider: 'template',
    project: integration.project,
    checklist,
    suggestedProject: projectFromSuggestions(integration.project, buildFieldSuggestions(integration.project)),
    fieldSuggestions: buildFieldSuggestions(integration.project),
    decisions: buildDecisionCards(integration.project),
    questions,
    inputSummary: summarizeProjectInput(integration.project),
    updates: integration.updates,
    runMessage: `${integration.updates.join(' ')} ${questions.length} follow-up question(s) remain.`.trim(),
    transcript: {
      prompt: { task: 'integrate-answer', project, activeQuestion, answer, checklist },
      rawResponse: 'Integrated by local fallback because LLM_API_KEY or LLM_API_URL is not configured.'
    }
  };
}

export async function generateProposalBlueprint(payload) {
  const ideaInput = normalizeIdeaInputPayload(payload.ideaInput || payload);
  const ideaPreview = normalizeIdeaPreviewPayload(payload.ideaPreview || {});

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    try {
      return await generateBlueprintWithApi(ideaInput, ideaPreview);
    } catch (error) {
      const fallback = generateBlueprintLocally(ideaInput, ideaPreview);
      return {
        ...fallback,
        transcript: {
          ...fallback.transcript,
          rawResponse: `API blueprint generation failed and fell back to template mode.\n${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }

  return generateBlueprintLocally(ideaInput, ideaPreview);
}

export async function generateRelatedWorkPlan(payload) {
  const ideaInput = normalizeIdeaInputPayload(payload.ideaInput || payload);
  const proposalBlueprint = normalizeProposalBlueprintPayload(payload.proposalBlueprint || payload.blueprint || {}, ideaInput);

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    try {
      return await generateRelatedWorkWithApi(ideaInput, proposalBlueprint);
    } catch (error) {
      const fallback = generateRelatedWorkLocally(ideaInput, proposalBlueprint);
      return {
        ...fallback,
        transcript: {
          ...fallback.transcript,
          rawResponse: `API related-work generation failed and fell back to template mode.\n${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }

  return generateRelatedWorkLocally(ideaInput, proposalBlueprint);
}

export async function generateProposal(payload) {
  const project = normalizePayload(payload);
  const requirements = project.requirements || DEFAULT_REQUIREMENTS;
  const checklist = extractChecklist(requirements);

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    return generateWithApi(project, checklist);
  }

  return generateLocally(project, checklist);
}

async function refineProjectWithApi(payload) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const content = await callModel({
    systemPrompt: QUESTION_SYSTEM_PROMPT,
    payload,
    model,
    temperature: 0.2
  });
  const parsed = parseJsonContent(content);
  const nextProject = mergeProject(payload.project, normalizePayload(parsed.project || {}));
  const fieldSuggestions = normalizeFieldSuggestions(parsed.fieldSuggestions, nextProject);
  const decisions = normalizeDecisions(parsed.decisions, nextProject);
  const questions = normalizeQuestions(parsed.questions, nextProject);

  return {
    mode: 'api',
    provider: process.env.LLM_API_URL,
    project: nextProject,
    suggestedProject: nextProject,
    fieldSuggestions,
    decisions,
    questions,
    updates: Array.isArray(parsed.updates) ? parsed.updates.map(clean).filter(Boolean) : ['Updated project state.'],
    transcript: {
      prompt: payload,
      rawResponse: content
    }
  };
}

async function generateWithApi(project, checklist) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const promptPayload = {
    project,
    checklist,
    outputContract: {
      proposalLatex: 'Complete compile-ready LaTeX source for proposal.tex',
      complianceMatrix: 'Array of requirement coverage rows',
      evaluationReport: 'Plain text or Markdown self-evaluation',
      questions: 'Remaining clarifying questions'
    }
  };

  const content = await callModel({
    systemPrompt: SYSTEM_PROMPT,
    payload: promptPayload,
    model,
    temperature: 0.2
  });
  const parsed = parseJsonContent(content);

  return {
    mode: 'api',
    provider: process.env.LLM_API_URL,
    ...coerceResult(parsed, project, checklist),
    transcript: {
      prompt: promptPayload,
      rawResponse: content
    }
  };
}

async function generateBlueprintWithApi(ideaInput, ideaPreview) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const promptPayload = {
    ideaInput,
    ideaPreview,
    outputContract: {
      workingTitle: 'Working proposal title',
      oneSentenceSummary: 'One-sentence proposal summary',
      problemStatement: 'Clear problem statement',
      motivation: 'Why the problem matters',
      researchGap: 'Gap or opening in current support or knowledge',
      proposedContribution: 'What this project will contribute',
      researchQuestions: 'Array of research questions',
      hypotheses: 'Array of hypotheses',
      proposedMethod: 'Method or technical approach',
      datasetsToolsSystems: 'Possible datasets, tools, or systems',
      evaluationPlan: 'How the student might evaluate success',
      expectedResults: 'Expected outcome of the work',
      intellectualMerit: 'Research merit and novelty',
      broaderImpacts: 'Who benefits and why it matters',
      missingInformation: 'Array of open questions or missing details',
      suggestedNextSteps: 'Array of next actions for later workflow stages'
    }
  };

  const content = await callModel({
    systemPrompt: BLUEPRINT_SYSTEM_PROMPT,
    payload: promptPayload,
    model,
    temperature: 0.2
  });
  const parsed = parseJsonContent(content);

  return {
    mode: 'api',
    provider: process.env.LLM_API_URL,
    blueprint: coerceBlueprintResult(parsed, ideaInput, ideaPreview),
    transcript: {
      prompt: promptPayload,
      rawResponse: content
    }
  };
}

async function generateRelatedWorkWithApi(ideaInput, proposalBlueprint) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const promptPayload = {
    ideaInput,
    proposalBlueprint,
    outputContract: {
      searchQueries: 'Array of suggested literature search queries',
      keyConcepts: 'Array of research concepts or keywords',
      relatedWorkBuckets: 'Array of related-work category objects',
      suggestedVenuesOrSources: 'Array of likely places or source types to search',
      literatureGapQuestions: 'Array of questions to investigate in the literature',
      unsupportedClaimWarnings: 'Array of warning statements about claims needing evidence',
      nextSteps: 'Array of follow-up literature review actions'
    }
  };

  const content = await callModel({
    systemPrompt: RELATED_WORK_SYSTEM_PROMPT,
    payload: promptPayload,
    model,
    temperature: 0.2
  });
  const parsed = parseJsonContent(content);

  return {
    mode: 'api',
    provider: process.env.LLM_API_URL,
    relatedWorkPlan: coerceRelatedWorkResult(parsed, ideaInput, proposalBlueprint),
    transcript: {
      prompt: promptPayload,
      rawResponse: content
    }
  };
}

async function callModel({ systemPrompt, payload, model, temperature }) {
  if (getProvider() === 'gemini') {
    return callGemini({ systemPrompt, payload, model, temperature });
  }

  return callOpenAiCompatible({ systemPrompt, payload, model, temperature });
}

async function callGemini({ systemPrompt, payload, model, temperature }) {
  const baseUrl = clean(process.env.LLM_API_URL) || 'https://generativelanguage.googleapis.com/v1beta';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.LLM_API_KEY
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: JSON.stringify(payload, null, 2) }]
        }
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json'
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini API returned ${response.status}`);
  }

  const content = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n');

  if (!content) {
    throw new Error('Gemini API returned no text content.');
  }

  return content;
}

async function callOpenAiCompatible({ systemPrompt, payload, model, temperature }) {
  const response = await fetch(process.env.LLM_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(payload, null, 2) }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || `API returned ${response.status}`);
  }

  return readModelContent(data);
}

function generateLocally(project, checklist) {
  const questions = buildQuestions(project);
  const proposalLatex = buildLocalProposalLatex(project);
  const complianceMatrix = checklist.map((requirement) => {
    const evidence = findRequirementEvidence(requirement, project);

    return {
      requirement,
      status: evidence ? 'Covered' : 'Needs work',
      evidence: evidence || 'No strong evidence in the current project state.',
      fix: evidence ? 'Keep this section specific.' : `Add concrete detail for: ${requirement}.`
    };
  });

  const needsWork = complianceMatrix.filter((row) => row.status === 'Needs work');
  const evaluationReport = `# Evaluation Report

## Summary
- Mode: local deterministic fallback.
- Covered requirements: ${complianceMatrix.length - needsWork.length}/${complianceMatrix.length}.
- Remaining questions: ${questions.length}.

## Weak Claims And Risks
${needsWork.length ? needsWork.map((row) => `- ${row.requirement}: ${row.fix}`).join('\n') : '- No missing checklist items detected by the fallback checker.'}

## Revision Priorities
${questions.length ? questions.map((question) => `- ${question}`).join('\n') : '- Draft is ready for API-backed review or human revision.'}
`;

  return {
    mode: 'local-fallback',
    provider: 'template',
    proposalLatex,
    complianceMatrix,
    evaluationReport,
    questions,
    transcript: {
      prompt: { project, checklist },
      rawResponse: 'Generated by local fallback because LLM_API_KEY or LLM_API_URL is not configured.'
    }
  };
}

function generateBlueprintLocally(ideaInput, ideaPreview) {
  return {
    mode: 'template',
    provider: 'template',
    blueprint: buildLocalProposalBlueprint(ideaInput, ideaPreview),
    transcript: {
      prompt: { ideaInput, ideaPreview },
      rawResponse: 'Generated by local fallback because LLM_API_KEY or LLM_API_URL is not configured.'
    }
  };
}

function generateRelatedWorkLocally(ideaInput, proposalBlueprint) {
  return {
    mode: 'template',
    provider: 'template',
    relatedWorkPlan: buildLocalRelatedWorkPlan(ideaInput, proposalBlueprint),
    transcript: {
      prompt: { ideaInput, proposalBlueprint },
      rawResponse: 'Generated by local fallback because LLM_API_KEY or LLM_API_URL is not configured.'
    }
  };
}

function buildLocalProposalBlueprint(ideaInput, ideaPreview) {
  const workingTitle = titleCase(ideaInput.topic || 'Research Proposal Blueprint');
  const domainLabel = ideaInput.domain || 'the target research domain';
  const contribution = clean(ideaInput.expectedContribution) || inferBlueprintContribution(ideaInput);
  const method = clean(ideaInput.methods) || 'A staged proposal workflow that structures the idea, critiques missing pieces, and guides revision.';
  const dataSystems = clean(ideaInput.datasets) || 'Candidate datasets, tools, and systems still need to be selected.';
  const missingInformation = buildBlueprintMissingInformation(ideaInput, ideaPreview);

  return {
    workingTitle,
    oneSentenceSummary: `${workingTitle} reframes ${ideaInput.problem || 'a rough student research idea'} into a structured proposal scaffold for ${domainLabel}.`,
    problemStatement:
      clean(ideaInput.problem) ||
      'The core problem still needs to be written as a concrete research pain point with a clear user, context, and consequence.',
    motivation:
      mergeIdeaSegments([
        clean(ideaInput.motivation),
        clean(ideaInput.beneficiaries) ? `Primary beneficiaries: ${clean(ideaInput.beneficiaries)}` : ''
      ]) || 'The proposal still needs a stronger explanation of why the problem matters and who benefits.',
    researchGap: buildResearchGap(ideaInput),
    proposedContribution: contribution,
    researchQuestions: buildResearchQuestions(ideaInput),
    hypotheses: buildHypotheses(ideaInput),
    proposedMethod: method,
    datasetsToolsSystems: dataSystems,
    evaluationPlan: buildEvaluationPlan(ideaInput),
    expectedResults: buildExpectedResults(ideaInput, contribution),
    intellectualMerit: buildIntellectualMerit(ideaInput, contribution),
    broaderImpacts: buildBroaderImpacts(ideaInput),
    missingInformation,
    suggestedNextSteps: buildSuggestedNextSteps(ideaInput, missingInformation)
  };
}

function buildLocalRelatedWorkPlan(ideaInput, proposalBlueprint) {
  const keyConcepts = buildRelatedWorkConcepts(ideaInput, proposalBlueprint);
  const relatedWorkBuckets = buildRelatedWorkBuckets(ideaInput, proposalBlueprint, keyConcepts);

  return {
    searchQueries: buildSearchQueries(ideaInput, proposalBlueprint, keyConcepts),
    keyConcepts,
    relatedWorkBuckets,
    suggestedVenuesOrSources: buildSuggestedVenuesOrSources(ideaInput),
    literatureGapQuestions: buildLiteratureGapQuestions(ideaInput, proposalBlueprint),
    unsupportedClaimWarnings: buildUnsupportedClaimWarnings(ideaInput, proposalBlueprint),
    nextSteps: buildRelatedWorkNextSteps(proposalBlueprint, relatedWorkBuckets)
  };
}

function buildLocalProposalLatex(project) {
  const title = project.title || project.topic;
  const problem = project.problem || 'The current problem is still underspecified and should be refined through clarifying questions.';
  const method = project.method || 'The agent workflow will collect a rough research direction, ask targeted clarification questions, update project state, draft a research proposal, check requirements, and revise weak sections.';
  const evaluation = project.evaluation || 'Evaluate the first and revised drafts against section coverage, missing fields, weak claims, prior-work comparison, research milestones, and proposal-specific success criteria.';
  const timeline = project.timeline || 'Phase 1 literature and requirement review; Phase 2 workflow and method design; Phase 3 prototype or study setup; Phase 4 evaluation and analysis; Phase 5 final proposal revision and source notes.';
  const resources = project.resources || 'This browser app, a local Node API service, an optional LLM API key, proposal-writing references, and source notes for unsupported claims.';
  const references = project.references || 'Course proposal requirements and demo scaffold. Additional claims are treated as assumptions.';

  return String.raw`\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\setlist{nosep}
\title{${escapeLatex(title)}}
\author{}
\date{}

\begin{document}
\maketitle

\begin{abstract}
This project builds a proposal agent that turns a rough research direction into a structured research proposal. The workflow collects project intent, calls an API-backed generator when configured, produces a LaTeX proposal draft, checks requirements, and lists revision questions.
\end{abstract}

\section{Motivation and Gap}
${latexParagraph(problem)}

Students often have partial ideas but need help converting them into proposal sections with clear methods, milestones, and evaluation criteria. \textbf{Assumption:} a lightweight guided workflow is sufficient for a useful classroom demo.

\section{Project Goal}
Create a working proposal generator that can produce a LaTeX proposal, compliance matrix, evaluation report, and follow-up questions from a rough idea.

\section{Method and Agent Workflow}
${latexParagraph(method)}

\begin{enumerate}
\item Capture topic, problem, method, timeline, evaluation plan, resources, and requirement text.
\item Send the structured state to the local API service.
\item Use the configured LLM API when available; otherwise use a deterministic fallback.
\item Return LaTeX source, requirement coverage, self-evaluation, and clarification questions.
\item Compile \texttt{proposal.tex} into \texttt{proposal.pdf} with a LaTeX engine.
\end{enumerate}

\section{Figure}
\begin{figure}[h]
\centering
\fbox{\begin{minipage}{0.9\linewidth}
\centering
Rough idea $\rightarrow$ structured suggestions $\rightarrow$ student decisions $\rightarrow$ accepted project state $\rightarrow$ LaTeX proposal $\rightarrow$ compliance review $\rightarrow$ revised PDF
\end{minipage}}
\caption{Proposed workflow for turning a rough idea into a reviewed proposal artifact.}
\end{figure}

\section{Expected Results and Research Milestones}
${latexParagraph(timeline)}

Expected result: a reproducible workflow that can start from a rough research direction and produce proposal artifacts with explicit milestones, assumptions, and review evidence.

\section{Evaluation Plan}
${latexParagraph(evaluation)}

Test cases include a complete idea, a missing-information idea, a requirement-check case, and a revision case after weak claims are flagged.

\section{Risks and Mitigation}
\begin{itemize}
\item API key is missing: use deterministic fallback and document that mode.
\item Generated claims are unsupported: mark them as assumptions and ask for source notes.
\item Research scope becomes too broad: narrow the contribution, milestones, and evaluation criteria before drafting.
\end{itemize}

\section{Resources}
${latexParagraph(resources)}

\section{References and Assumptions}
${latexParagraph(references)}

\end{document}
`;
}

function buildQuestions(project) {
  return buildQuestionObjects(project).map((question) => question.question);
}

function buildQuestionObjects(project) {
  const questions = [];
  const add = (field, question, reason, priority = 'High') => {
    questions.push({
      id: `${field}-${questions.length + 1}`,
      field,
      question,
      reason,
      priority
    });
  };

  if (!isSpecific(project.problem, 80)) {
    add(
      'problem',
      'What concrete problem does this proposal solve, and who experiences it?',
      'The proposal needs a specific motivation and user or stakeholder.'
    );
  }

  if (!isSpecific(project.method, 80)) {
    add(
      'method',
      'What exact workflow or technical method will the project implement?',
      'The method should describe stages, inputs, outputs, and the API-backed loop.'
    );
  }

  if (!isSpecific(project.evaluation, 60)) {
    add(
      'evaluation',
      'What measurable checks will prove the revised proposal is better than the first draft?',
      'The evaluation plan needs concrete tests or metrics.'
    );
  }

  if (!isSpecific(project.timeline, 40)) {
    add(
      'timeline',
      'What research milestones and timeline estimates make this proposal credible?',
      'The proposal needs scoped milestones, feasibility evidence, and realistic risks.'
    );
  }

  if (!isSpecific(project.resources, 30)) {
    add(
      'resources',
      'What tools, APIs, files, or fallback mode will make this reproducible?',
      'The proposal needs implementation resources and API-key handling.',
      'Medium'
    );
  }

  if (!isSpecific(project.references, 30)) {
    add(
      'references',
      'What sources or assumptions should ground the claims?',
      'Unsupported claims should be marked as assumptions or tied to source notes.',
      'Medium'
    );
  }

  if (!questions.length) {
    add(
      'next-step',
      'The project state looks draftable. Should I generate the proposal now?',
      'No required missing field remains in the basic checker.',
      'Low'
    );
  }

  return questions.slice(0, 5);
}

function integrateAnswerLocally(project, answer, question) {
  const targetField = question?.field && question.field !== 'next-step' ? question.field : firstMissingField(project);
  const nextProject = { ...project };
  const updates = [];

  if (targetField && Object.hasOwn(nextProject, targetField)) {
    nextProject[targetField] = mergeField(nextProject[targetField], answer);
    updates.push(`Updated ${targetField}.`);
  } else {
    nextProject.method = mergeField(nextProject.method, answer);
    updates.push('Updated method.');
  }

  return { project: nextProject, updates };
}

function buildFieldSuggestions(project) {
  const topic = project.title || project.topic || 'the project';
  const suggestions = [
    {
      field: 'title',
      label: 'Project Title',
      value: project.title || titleCase(topic),
      confidence: 'High',
      reason: 'Use the rough idea as the working title so the proposal has a stable anchor.'
    },
    {
      field: 'problem',
      label: 'Problem Framing',
      value:
        project.problem ||
        `Students or project authors have a rough idea for ${topic}, but need help turning it into a structured, rubric-aligned proposal with clear scope and evaluation.`,
      confidence: project.problem ? 'High' : 'Medium',
      reason: 'A proposal needs a concrete user pain point before method details are useful.'
    },
    {
      field: 'method',
      label: 'Method / Agent Workflow',
      value:
        project.method ||
        'Build an agent workflow that extracts project state from a rough idea, presents suggested fields and decision options, accepts user edits, drafts a proposal, checks requirements, and revises weak sections.',
      confidence: project.method ? 'High' : 'Medium',
      reason: 'The method should describe the agent process rather than only promising a final text draft.'
    },
    {
      field: 'evaluation',
      label: 'Evaluation Plan',
      value:
        project.evaluation ||
        'Test complete, missing-info, requirement-check, unsupported-claim, and revision scenarios. Compare draft quality by checklist coverage, specificity, and whether weak claims are flagged.',
      confidence: project.evaluation ? 'High' : 'Medium',
      reason: 'The course proposal needs evidence that the workflow improves the artifact.'
    },
    {
      field: 'timeline',
      label: 'Research Milestones',
      value:
        project.timeline ||
        'Phase 1: proposal-writing research and prior-work review. Phase 2: workflow and method design. Phase 3: prototype or study setup. Phase 4: evaluation and unsupported-claim review. Phase 5: final proposal revision and source notes.',
      confidence: project.timeline ? 'High' : 'Medium',
      reason: 'Research milestones help reviewers judge feasibility, expected outcomes, and scope.'
    },
    {
      field: 'resources',
      label: 'Resources',
      value: project.resources || 'React, Vite, Node, Gemini API, local fallback mode, sample research ideas, and course requirements.',
      confidence: project.resources ? 'High' : 'Medium',
      reason: 'Resource notes make the API-backed workflow reproducible.'
    },
    {
      field: 'references',
      label: 'Sources / Assumptions',
      value: project.references || 'Course proposal requirements, the provided demo workflow, and explicit assumptions for unsupported claims.',
      confidence: project.references ? 'High' : 'Medium',
      reason: 'Source notes prevent the proposal from inventing unsupported claims.'
    }
  ];

  return suggestions.filter((item) => clean(item.value));
}

function buildDecisionCards(project) {
  const topic = project.title || project.topic || 'this project';

  return [
    {
      id: 'problem-framing',
      title: 'Choose The Problem Framing',
      field: 'problem',
      question: 'Which problem framing should the proposal emphasize?',
      options: [
        {
          label: 'Rubric alignment',
          value: `Students have rough ideas for ${topic}, but struggle to translate them into proposal sections that satisfy the course rubric.`,
          rationale: 'Best when the project is mainly about proposal structure and grading requirements.'
        },
        {
          label: 'Revision quality',
          value: `Students can produce a first draft for ${topic}, but need help identifying weak claims, missing evidence, and unclear evaluation plans before submission.`,
          rationale: 'Best when the agent focuses on critique and revision.'
        },
        {
          label: 'Scope control',
          value: `Students often choose research directions that are too broad or underspecified, so they need a workflow that narrows the idea into a credible proposal with explicit milestones and evaluation criteria.`,
          rationale: 'Best when feasibility, milestones, and research scope are the main risks.'
        }
      ]
    },
    {
      id: 'method-style',
      title: 'Choose The Agent Method',
      field: 'method',
      question: 'What should the core agent workflow optimize for?',
      options: [
        {
          label: 'Structured extraction',
          value:
            'The agent extracts project fields from a rough idea, shows suggested data for user approval, and only asks clarifying questions when required fields remain uncertain.',
          rationale: 'Best for reducing manual prompting.'
        },
        {
          label: 'Rubric-first drafting',
          value:
            'The agent parses requirements into a checklist, maps each project field to required proposal sections, drafts the proposal, and produces a compliance matrix.',
          rationale: 'Best when grading coverage is the main concern.'
        },
        {
          label: 'Critique and revise',
          value:
            'The agent drafts quickly, judges the draft for missing sections and weak claims, proposes targeted revisions, and lets the user accept or edit changes.',
          rationale: 'Best for a visible revision loop.'
        }
      ]
    },
    {
      id: 'evaluation-choice',
      title: 'Choose Evaluation Evidence',
      field: 'evaluation',
      question: 'How should the demo prove the workflow is useful?',
      options: [
        {
          label: 'Before / after',
          value: 'Compare a rough initial draft with the revised proposal on required-section coverage, specificity, and unresolved assumptions.',
          rationale: 'Simple and convincing for a classroom demo.'
        },
        {
          label: 'Scenario tests',
          value: 'Run normal, missing-information, requirement-check, unsupported-claim, and revision scenarios, then report pass/fail outcomes.',
          rationale: 'Best for demonstrating agent behavior across cases.'
        },
        {
          label: 'Human review',
          value: 'Have the student review whether each suggested field is accurate, useful, and ready for the final proposal before export.',
          rationale: 'Best when student ownership is important.'
        }
      ]
    }
  ];
}

function normalizeFieldSuggestions(suggestions, project) {
  const parsed = Array.isArray(suggestions)
    ? suggestions
        .map((item) => ({
          field: clean(item.field),
          label: clean(item.label) || labelForField(item.field),
          value: clean(item.value),
          confidence: clean(item.confidence) || 'Medium',
          reason: clean(item.reason) || 'Suggested by the model from the rough idea.'
        }))
        .filter((item) => item.field && item.value)
    : [];

  const fallback = buildFieldSuggestions(project);
  const seen = new Set(parsed.map((item) => item.field));
  const merged = [...parsed, ...fallback.filter((item) => !seen.has(item.field))];

  return merged.length ? merged : fallback;
}

function normalizeDecisions(decisions, project) {
  const parsed = Array.isArray(decisions)
    ? decisions
        .map((decision, index) => ({
          id: clean(decision.id) || `decision-${index + 1}`,
          title: clean(decision.title) || 'Decision Needed',
          field: clean(decision.field) || 'problem',
          question: clean(decision.question) || 'Which option best fits the project?',
          options: Array.isArray(decision.options)
            ? decision.options
                .map((option) => ({
                  label: clean(option.label),
                  value: clean(option.value),
                  rationale: clean(option.rationale)
                }))
                .filter((option) => option.label && option.value)
            : []
        }))
        .filter((decision) => decision.options.length)
    : [];

  return parsed.length ? parsed : buildDecisionCards(project);
}

function projectFromSuggestions(project, suggestions) {
  const next = { ...project };

  suggestions.forEach((suggestion) => {
    if (Object.hasOwn(next, suggestion.field) && suggestion.value) {
      next[suggestion.field] = suggestion.value;
    }
  });

  return next;
}

function keepOnlyAcceptedStartFields(originalProject, suggestedProject) {
  return {
    ...EMPTY_PROJECT_FOR_SERVER,
    ...originalProject,
    title: suggestedProject.title || originalProject.title,
    topic: originalProject.topic || originalProject.title,
    requirements: originalProject.requirements || DEFAULT_REQUIREMENTS
  };
}

function labelForField(field) {
  const labels = {
    title: 'Project Title',
    problem: 'Problem Framing',
    method: 'Method / Agent Workflow',
    timeline: 'Research Milestones',
    evaluation: 'Evaluation Plan',
    resources: 'Resources',
    references: 'Sources / Assumptions'
  };

  return labels[clean(field)] || titleCase(field);
}

function summarizeProjectInput(project) {
  const fields = [
    ['Topic', project.title || project.topic],
    ['Problem', project.problem],
    ['Method', project.method],
    ['Timeline', project.timeline],
    ['Evaluation', project.evaluation],
    ['Resources', project.resources],
    ['References', project.references]
  ];
  const missing = buildQuestionObjects(project)
    .filter((question) => question.field !== 'next-step')
    .map((question) => question.reason);

  return {
    fields,
    missing,
    markdown: `# Intake Summary

${fields.map(([label, value]) => `- ${label}: ${clean(value) || 'Missing'}`).join('\n')}

## Missing or Weak Inputs
${missing.length ? missing.map((item) => `- ${item}`).join('\n') : '- None detected by the basic checker.'}
`
  };
}

function normalizeQuestions(questions, project) {
  const parsed = Array.isArray(questions)
    ? questions.map(normalizeQuestion).filter((question) => question.question)
    : [];

  return (parsed.length ? parsed : buildQuestionObjects(project)).slice(0, 5);
}

function normalizeQuestion(question) {
  if (!question) return null;

  if (typeof question === 'string') {
    return {
      id: `question-${question.slice(0, 18)}`,
      field: 'method',
      question: clean(question),
      reason: 'The model requested this clarification.',
      priority: 'High'
    };
  }

  return {
    id: clean(question.id) || `${clean(question.field) || 'question'}-${clean(question.question).slice(0, 18)}`,
    field: clean(question.field) || 'method',
    question: clean(question.question),
    reason: clean(question.reason) || 'This detail will improve the proposal.',
    priority: clean(question.priority) || 'High'
  };
}

function firstMissingField(project) {
  const firstQuestion = buildQuestionObjects(project).find((question) => question.field !== 'next-step');
  return firstQuestion?.field || 'method';
}

function mergeProject(current, incoming) {
  const next = { ...current };

  Object.entries(incoming).forEach(([key, value]) => {
    const cleaned = clean(value);
    if (cleaned) next[key] = cleaned;
  });

  return next;
}

function mergeField(current, addition) {
  const base = clean(current);
  const next = clean(addition);

  if (!base) return next;
  if (!next) return base;
  if (base.toLowerCase().includes(next.toLowerCase())) return base;
  return `${base}\n${next}`;
}

function normalizePayload(payload) {
  const ideaInput = payload.ideaInput && typeof payload.ideaInput === 'object' ? payload.ideaInput : {};
  const topic = clean(payload.topic) || clean(ideaInput.topic);
  const title = clean(payload.title) || topic;
  const problem = clean(payload.problem) || buildProblemFromIdeaInput(ideaInput);
  const method = clean(payload.method) || buildMethodFromIdeaInput(ideaInput);
  const resources = clean(payload.resources) || buildResourcesFromIdeaInput(ideaInput);
  const references = clean(payload.references) || buildReferencesFromIdeaInput(ideaInput);

  return {
    topic,
    title,
    problem,
    method,
    timeline: clean(payload.timeline),
    evaluation: clean(payload.evaluation),
    resources,
    references,
    requirements: clean(payload.requirements) || DEFAULT_REQUIREMENTS
  };
}

function normalizeIdeaInputPayload(payload) {
  return {
    topic: clean(payload.topic),
    domain: clean(payload.domain),
    problem: clean(payload.problem),
    motivation: clean(payload.motivation),
    beneficiaries: clean(payload.beneficiaries),
    keywords: clean(payload.keywords),
    methods: clean(payload.methods),
    datasets: clean(payload.datasets),
    expectedContribution: clean(payload.expectedContribution),
    uncertainties: clean(payload.uncertainties)
  };
}

function normalizeIdeaPreviewPayload(payload) {
  return {
    detectedTopic: clean(payload.detectedTopic),
    problem: clean(payload.problem),
    motivation: clean(payload.motivation),
    possibleContribution: clean(payload.possibleContribution),
    missingInformation: Array.isArray(payload.missingInformation) ? payload.missingInformation.map(clean).filter(Boolean) : []
  };
}

function normalizeProposalBlueprintPayload(payload, ideaInput) {
  return coerceBlueprintResult(payload, ideaInput, normalizeIdeaPreviewPayload({}));
}

function buildProblemFromIdeaInput(ideaInput) {
  return mergeIdeaSegments([
    clean(ideaInput.problem),
    clean(ideaInput.motivation) ? `Why it matters: ${clean(ideaInput.motivation)}` : '',
    clean(ideaInput.beneficiaries) ? `Beneficiaries: ${clean(ideaInput.beneficiaries)}` : ''
  ]);
}

function buildMethodFromIdeaInput(ideaInput) {
  return mergeIdeaSegments([
    clean(ideaInput.methods),
    clean(ideaInput.expectedContribution) ? `Expected contribution: ${clean(ideaInput.expectedContribution)}` : '',
    clean(ideaInput.uncertainties) ? `Open uncertainties: ${clean(ideaInput.uncertainties)}` : ''
  ]);
}

function buildResourcesFromIdeaInput(ideaInput) {
  return mergeIdeaSegments([clean(ideaInput.datasets)]);
}

function buildReferencesFromIdeaInput(ideaInput) {
  return mergeIdeaSegments([clean(ideaInput.keywords)]);
}

function mergeIdeaSegments(parts) {
  return parts.filter(Boolean).join('\n');
}

function inferBlueprintContribution(ideaInput) {
  if (ideaInput.methods) {
    return `A proposal blueprint that connects ${ideaInput.methods.toLowerCase()} to clearer research framing, evaluation planning, and later critique stages.`;
  }

  return `A stronger proposal scaffold for ${clean(ideaInput.topic).toLowerCase() || 'the proposed research idea'} with clearer scope, contribution, and revision targets.`;
}

function buildResearchGap(ideaInput) {
  const domain = ideaInput.domain || 'this research area';
  const keywords = ideaInput.keywords || 'existing proposal-writing or research-support approaches';

  return `Current support in ${domain} does not yet clearly translate rough ideas around ${keywords} into structured proposal elements with explicit research gap, evaluation logic, and revision targets.`;
}

function buildResearchQuestions(ideaInput) {
  const topic = ideaInput.topic || 'this proposal workflow';

  return [
    `How can ${topic} be structured into a proposal blueprint that preserves the student's intent while clarifying scope and contribution?`,
    `What information is most important to surface early so later critique and revision stages can improve the proposal efficiently?`,
    `How should the workflow evaluate whether the blueprint meaningfully improves the student's original rough idea?`
  ];
}

function buildHypotheses(ideaInput) {
  const beneficiaries = ideaInput.beneficiaries || 'students and reviewers';

  return [
    `A structured blueprint workflow will help ${beneficiaries} identify missing proposal components earlier than a free-form drafting approach.`,
    'Making research gap, evaluation, and missing-information fields explicit will produce stronger proposal revisions in later workflow stages.'
  ];
}

function buildEvaluationPlan(ideaInput) {
  const method = clean(ideaInput.methods);

  if (method) {
    return `Evaluate the blueprint by comparing the original rough idea against the generated scaffold for clarity, section coverage, feasibility, and readiness for critique. Include at least one before/after example and check whether the proposed method (${method}) remains aligned with the original idea.`;
  }

  return 'Compare the rough idea against the generated blueprint for clarity, proposal-section coverage, specificity of research questions, and readiness for critique or revision.';
}

function buildExpectedResults(ideaInput, contribution) {
  return `${contribution} The expected result is a blueprint that gives the student a clearer title, problem framing, research gap, method outline, and evaluation direction before full drafting begins.`;
}

function buildIntellectualMerit(ideaInput, contribution) {
  const domain = ideaInput.domain || 'the target research domain';
  return `The blueprint frames a credible research direction in ${domain} and sharpens the core contribution: ${contribution}`;
}

function buildBroaderImpacts(ideaInput) {
  if (ideaInput.beneficiaries) {
    return `The work could benefit ${ideaInput.beneficiaries} by making early-stage proposal development more structured, transparent, and easier to revise.`;
  }

  return 'The work could broaden access to stronger proposal development by helping students and advisors surface missing research logic earlier.';
}

function buildBlueprintMissingInformation(ideaInput, ideaPreview) {
  const missing = [];

  if (!ideaInput.keywords) missing.push('Add known papers, authors, or search keywords for the related-work stage.');
  if (!ideaInput.datasets) missing.push('Identify datasets, tools, systems, or source materials that the method may rely on.');
  if (!ideaInput.beneficiaries) missing.push('Clarify the primary user, stakeholder, or population that benefits from the work.');
  if (!ideaInput.expectedContribution) missing.push('State the expected contribution in one concrete research sentence.');
  if (ideaInput.uncertainties) missing.push(`Open uncertainties: ${ideaInput.uncertainties}`);

  const previewMissing = Array.isArray(ideaPreview.missingInformation) ? ideaPreview.missingInformation : [];

  return [...new Set([...missing, ...previewMissing].map(clean).filter(Boolean))].slice(0, 6);
}

function buildSuggestedNextSteps(ideaInput, missingInformation) {
  const steps = [
    'Review the blueprint and confirm that the proposed framing matches the original research intent.',
    'Use the topic, keywords, and research gap to gather related work for the next workflow stage.',
    'Strengthen the evaluation plan with concrete comparison criteria or success metrics.',
    'Run a critique pass focused on scope, novelty, and missing evidence before drafting a full proposal.'
  ];

  if (!ideaInput.datasets) {
    steps.splice(2, 0, 'Choose candidate datasets, tools, or systems so the proposed method becomes more concrete.');
  }

  if (missingInformation.length) {
    steps.push('Resolve the missing-information list before treating this blueprint as a stable proposal version.');
  }

  return steps.slice(0, 6);
}

function buildRelatedWorkConcepts(ideaInput, proposalBlueprint) {
  const seeded = [
    ideaInput.topic,
    ideaInput.domain,
    ideaInput.keywords,
    ideaInput.methods,
    ideaInput.datasets,
    ideaInput.expectedContribution,
    proposalBlueprint.researchGap,
    ...(proposalBlueprint.researchQuestions || []),
    ...(proposalBlueprint.hypotheses || [])
  ];

  return dedupeStrings(
    seeded
      .flatMap(splitKeywords)
      .filter((value) => value.length > 2)
      .slice(0, 12)
  );
}

function buildSearchQueries(ideaInput, proposalBlueprint, keyConcepts) {
  const topic = clean(ideaInput.topic) || clean(proposalBlueprint.workingTitle) || 'research proposal workflow';
  const method = clean(ideaInput.methods) || clean(proposalBlueprint.proposedMethod);
  const evaluation = clean(proposalBlueprint.evaluationPlan);
  const domain = clean(ideaInput.domain);
  const gapFocus = findGapFocus(proposalBlueprint.researchGap);
  const conceptA = keyConcepts[0] || topic;
  const conceptB = keyConcepts[1] || domain || 'evaluation';
  const conceptC = keyConcepts[2] || 'literature review';

  const queries = [
    joinQueryParts([topic, domain, 'related work']),
    joinQueryParts([conceptA, conceptB, 'survey']),
    joinQueryParts([topic, method, 'evaluation']),
    joinQueryParts([conceptA, conceptC, gapFocus]),
    joinQueryParts([domain, proposalBlueprint.proposedContribution, 'benchmark']),
    joinQueryParts([topic, 'critique', 'revision', 'research proposal']),
    joinQueryParts([conceptA, 'baseline comparison']),
    joinQueryParts([conceptB, evaluation, 'evidence'])
  ];

  return dedupeStrings(queries.map(clean).filter(Boolean)).slice(0, 8);
}

function buildRelatedWorkBuckets(ideaInput, proposalBlueprint, keyConcepts) {
  const domain = clean(ideaInput.domain) || 'the target domain';
  const method = clean(ideaInput.methods) || clean(proposalBlueprint.proposedMethod);
  const datasets = clean(ideaInput.datasets) || clean(proposalBlueprint.datasetsToolsSystems);

  const buckets = [
    {
      title: `Problem framing in ${domain}`,
      description: `Search for papers that define the core problem, target users, and existing failure modes related to ${clean(ideaInput.problem) || clean(ideaInput.topic) || 'this proposal area'}.`,
      whyItMatters: 'This bucket helps justify that the proposal addresses a real research need rather than an assumed pain point.',
      exampleSearchTerms: dedupeStrings([keyConcepts[0], keyConcepts[1], domain, 'problem framing']).slice(0, 4)
    },
    {
      title: 'Methods and workflow approaches',
      description: `Look for prior systems, agent workflows, or technical methods adjacent to ${method || 'the proposed approach'}.`,
      whyItMatters: 'This bucket identifies what technical patterns already exist and where the proposal differs or extends prior work.',
      exampleSearchTerms: dedupeStrings(splitKeywords(method).concat(['workflow', 'method', clean(ideaInput.topic)])).slice(0, 4)
    },
    {
      title: 'Evaluation and benchmark design',
      description: `Gather work that evaluates similar systems, including metrics, baselines, rubrics, user studies, or benchmark datasets connected to ${clean(proposalBlueprint.evaluationPlan) || clean(ideaInput.topic) || 'the proposal'}.`,
      whyItMatters: 'This bucket helps the proposal avoid vague success claims and borrow credible evaluation patterns.',
      exampleSearchTerms: dedupeStrings(splitKeywords(proposalBlueprint.evaluationPlan).concat(['evaluation', 'benchmark', 'baseline'])).slice(0, 4)
    },
    {
      title: 'Adjacent contribution claims',
      description: `Search for work that makes contribution claims similar to ${clean(proposalBlueprint.proposedContribution) || clean(ideaInput.expectedContribution) || 'the proposed system'} so novelty is assessed against real literature rather than intuition.`,
      whyItMatters: 'This bucket reduces the risk of unsupported novelty claims and clarifies what the proposal actually adds.',
      exampleSearchTerms: dedupeStrings(splitKeywords(proposalBlueprint.proposedContribution).concat(['novelty', 'comparison', 'related work'])).slice(0, 4)
    }
  ];

  if (datasets) {
    buckets.push({
      title: 'Datasets, tools, and source materials',
      description: `Review papers, systems, or reports that use ${datasets} or closely related resources.`,
      whyItMatters: 'This bucket anchors the method in real data sources, tooling constraints, and reproducibility expectations.',
      exampleSearchTerms: dedupeStrings(splitKeywords(datasets).concat(['dataset', 'tool', 'system'])).slice(0, 4)
    });
  }

  return buckets.slice(0, 5).map((bucket) => ({
    ...bucket,
    exampleSearchTerms: bucket.exampleSearchTerms.length ? bucket.exampleSearchTerms : keyConcepts.slice(0, 4)
  }));
}

function buildSuggestedVenuesOrSources(ideaInput) {
  const domain = clean(ideaInput.domain).toLowerCase();
  const venues = ['Survey papers and literature reviews', 'Semantic Scholar keyword search', 'Google Scholar keyword search', 'arXiv for recent preprints'];

  if (/human-ai|hci|interaction|user/.test(domain)) {
    venues.push('CHI, CSCW, and IUI venue families');
  }

  if (/nlp|language|llm|natural language/.test(domain)) {
    venues.push('ACL, EMNLP, NAACL, and Findings venue families');
  }

  if (/machine learning|deep learning|ai|reasoning/.test(domain)) {
    venues.push('NeurIPS, ICML, and ICLR venue families');
  }

  if (/education|learning|student|teaching/.test(domain)) {
    venues.push('LAK, EDM, and AIED venue families');
  }

  venues.push('Course examples, proposal guides, and annotated proposal samples for structure-only support');

  return dedupeStrings(venues).slice(0, 8);
}

function buildLiteratureGapQuestions(ideaInput, proposalBlueprint) {
  const topic = clean(ideaInput.topic) || 'this proposal';
  const method = clean(proposalBlueprint.proposedMethod) || clean(ideaInput.methods) || 'the proposed method';
  const evaluation = clean(proposalBlueprint.evaluationPlan) || 'the proposed evaluation plan';

  return dedupeStrings([
    `What prior work already addresses problems close to ${topic}, and where does the proposal still differ?`,
    `Do existing methods similar to ${method} already solve part of the problem or require stronger resources than this project assumes?`,
    `How do prior papers evaluate systems like this, and does ${evaluation} align with those precedents?`,
    'Where does the literature disagree on the best framing, metric, or baseline for this kind of problem?',
    'Which proposal claims would remain weak unless grounded by survey papers, benchmark papers, or user-study evidence?'
  ]).slice(0, 6);
}

function buildUnsupportedClaimWarnings(ideaInput, proposalBlueprint) {
  const warnings = [
    'Do not claim novelty until related work is retrieved and compared against the proposal contribution.',
    'Do not cite specific papers, authors, or venues as evidence until the sources are actually found and verified.',
    'Do not claim improvement over baselines until the evaluation plan, metrics, and comparison targets are defined.'
  ];

  if (!clean(ideaInput.datasets) && !clean(proposalBlueprint.datasetsToolsSystems)) {
    warnings.push('Avoid claims about feasibility or reproducibility until candidate datasets, tools, or systems are identified.');
  }

  if (proposalBlueprint.missingInformation?.length) {
    warnings.push('Treat open blueprint gaps as unresolved assumptions that still need literature support or clarification.');
  }

  return warnings.slice(0, 6);
}

function buildRelatedWorkNextSteps(proposalBlueprint, relatedWorkBuckets) {
  return [
    'Run each search query in a real academic search tool and save the most relevant papers by bucket.',
    'Find at least one survey, one methods paper, and one evaluation or benchmark paper for the top buckets.',
    'Map retrieved sources back to the proposal problem statement, research gap, and evaluation plan.',
    'Revise any contribution or novelty language that the literature does not support.',
    relatedWorkBuckets.length > 3
      ? 'Prioritize the first three buckets for the Stage 1 demo so the literature plan stays focused.'
      : 'Prioritize the strongest bucket first so the literature review begins with the clearest evidence need.'
  ].slice(0, 6);
}

function splitKeywords(value) {
  return clean(value)
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .flatMap((item) => item.split(/\s{2,}/))
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

function joinQueryParts(parts) {
  return parts
    .map(clean)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findGapFocus(researchGap) {
  const gap = clean(researchGap).toLowerCase();

  if (gap.includes('evaluation')) return 'evaluation gap';
  if (gap.includes('revision')) return 'revision workflow';
  if (gap.includes('literature')) return 'literature review';
  return 'research gap';
}

function extractChecklist(requirements) {
  const items = clean(requirements)
    .split(/\n|;/)
    .map((line) => line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter((line) => line.length > 4)
    .filter((line) => !/^proposal must include:?$/i.test(line));

  return [...new Set(items.length ? items : DEFAULT_REQUIREMENTS.split('\n').slice(1).map((line) => line.replace(/^-\s*/, '')))];
}

function findRequirementEvidence(requirement, project) {
  const text = requirement.toLowerCase();

  if (/title/.test(text) && project.title) return project.title;
  if (/abstract/.test(text)) return 'Draft includes an abstract section.';
  if (/motivation|gap|problem/.test(text) && project.problem) return project.problem;
  if (/goal/.test(text) && project.title) return 'Goal section is generated from the project topic.';
  if (/method|workflow|approach/.test(text) && project.method) return project.method;
  if (/expected|milestone|timeline/.test(text) && project.timeline) return project.timeline;
  if (/evaluation|metric|test/.test(text) && project.evaluation) return project.evaluation;
  if (/risk|mitigation/.test(text)) return 'Fallback draft includes risks and mitigations.';
  if (/resource|budget|tool/.test(text) && project.resources) return project.resources;
  if (/reference|assumption|source/.test(text) && project.references) return project.references;

  return '';
}

function readModelContent(data) {
  if (typeof data?.choices?.[0]?.message?.content === 'string') {
    return data.choices[0].message.content;
  }

  if (typeof data?.output_text === 'string') {
    return data.output_text;
  }

  const outputText = data?.output
    ?.flatMap((item) => item?.content || [])
    ?.map((item) => item?.text)
    ?.filter(Boolean)
    ?.join('\n');

  if (outputText) return outputText;

  return JSON.stringify(data);
}

function parseJsonContent(content) {
  const trimmed = clean(content);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    return {
      proposalLatex: looksLikeLatex(trimmed) ? trimmed : '',
      complianceMatrix: [],
      evaluationReport: '# Evaluation Report\n\nThe API returned text that was not JSON.',
      questions: ['Should the API prompt be tightened to return strict JSON?']
    };
  }
}

function coerceResult(result, project, checklist) {
  return {
    proposalLatex: extractProposalLatex(result, project),
    complianceMatrix: Array.isArray(result.complianceMatrix) && result.complianceMatrix.length
      ? result.complianceMatrix.map((row) => ({
          requirement: clean(row.requirement),
          status: clean(row.status) || 'Needs work',
          evidence: clean(row.evidence),
          fix: clean(row.fix)
        }))
      : checklist.map((requirement) => ({
          requirement,
          status: 'Needs work',
          evidence: 'API did not provide matrix evidence.',
          fix: 'Regenerate with stricter output instructions.'
        })),
    evaluationReport: clean(result.evaluationReport) || '# Evaluation Report\n\nNo evaluation report returned.',
    questions: Array.isArray(result.questions) ? result.questions.map(clean).filter(Boolean).slice(0, 5) : []
  };
}

function coerceBlueprintResult(result, ideaInput, ideaPreview) {
  const fallback = buildLocalProposalBlueprint(ideaInput, ideaPreview);

  return {
    workingTitle: readFirstString(result, ['workingTitle', 'working_title']) || fallback.workingTitle,
    oneSentenceSummary: readFirstString(result, ['oneSentenceSummary', 'one_sentence_summary']) || fallback.oneSentenceSummary,
    problemStatement: readFirstString(result, ['problemStatement', 'problem_statement']) || fallback.problemStatement,
    motivation: readFirstString(result, ['motivation']) || fallback.motivation,
    researchGap: readFirstString(result, ['researchGap', 'research_gap']) || fallback.researchGap,
    proposedContribution: readFirstString(result, ['proposedContribution', 'proposed_contribution']) || fallback.proposedContribution,
    researchQuestions: readStringArray(result, ['researchQuestions', 'research_questions'], fallback.researchQuestions),
    hypotheses: readStringArray(result, ['hypotheses'], fallback.hypotheses),
    proposedMethod: readFirstString(result, ['proposedMethod', 'proposed_method']) || fallback.proposedMethod,
    datasetsToolsSystems:
      readFirstString(result, ['datasetsToolsSystems', 'datasets_tools_systems', 'datasetsTools']) || fallback.datasetsToolsSystems,
    evaluationPlan: readFirstString(result, ['evaluationPlan', 'evaluation_plan']) || fallback.evaluationPlan,
    expectedResults: readFirstString(result, ['expectedResults', 'expected_results']) || fallback.expectedResults,
    intellectualMerit: readFirstString(result, ['intellectualMerit', 'intellectual_merit']) || fallback.intellectualMerit,
    broaderImpacts: readFirstString(result, ['broaderImpacts', 'broader_impacts']) || fallback.broaderImpacts,
    missingInformation: readStringArray(result, ['missingInformation', 'missing_information'], fallback.missingInformation),
    suggestedNextSteps: readStringArray(result, ['suggestedNextSteps', 'suggested_next_steps'], fallback.suggestedNextSteps)
  };
}

function coerceRelatedWorkResult(result, ideaInput, proposalBlueprint) {
  const fallback = buildLocalRelatedWorkPlan(ideaInput, proposalBlueprint);

  return {
    searchQueries: readStringArray(result, ['searchQueries', 'search_queries'], fallback.searchQueries),
    keyConcepts: readStringArray(result, ['keyConcepts', 'key_concepts'], fallback.keyConcepts),
    relatedWorkBuckets: readBucketArray(result, ['relatedWorkBuckets', 'related_work_buckets'], fallback.relatedWorkBuckets),
    suggestedVenuesOrSources: readStringArray(
      result,
      ['suggestedVenuesOrSources', 'suggested_venues_or_sources'],
      fallback.suggestedVenuesOrSources
    ),
    literatureGapQuestions: readStringArray(
      result,
      ['literatureGapQuestions', 'literature_gap_questions'],
      fallback.literatureGapQuestions
    ),
    unsupportedClaimWarnings: readStringArray(
      result,
      ['unsupportedClaimWarnings', 'unsupported_claim_warnings'],
      fallback.unsupportedClaimWarnings
    ),
    nextSteps: readStringArray(result, ['nextSteps', 'suggestedNextSteps', 'next_steps'], fallback.nextSteps)
  };
}

function extractProposalLatex(result, project) {
  const candidates = [
    result?.proposalLatex,
    result?.proposalTex,
    result?.latex,
    result?.tex
  ]
    .map(clean)
    .filter(Boolean);

  for (const candidate of candidates) {
    const unwrapped = unwrapLatexCandidate(candidate);
    if (looksLikeLatex(unwrapped)) {
      return unwrapped;
    }
  }

  return buildLocalProposalLatex(project);
}

function unwrapLatexCandidate(value) {
  let candidate = stripCodeFence(clean(value));

  for (let index = 0; index < 3; index += 1) {
    const trimmed = candidate.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('"')) break;

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        candidate = stripCodeFence(parsed);
        continue;
      }

      const nested = parsed?.proposalLatex || parsed?.proposalTex || parsed?.latex || parsed?.tex;
      if (nested) {
        candidate = stripCodeFence(String(nested));
        continue;
      }

      break;
    } catch {
      const extracted = extractNestedLatexString(trimmed);
      if (extracted) {
        candidate = stripCodeFence(extracted);
        continue;
      }
      break;
    }
  }

  return candidate;
}

function stripCodeFence(value) {
  const trimmed = clean(value);
  const fenced = trimmed.match(/```(?:latex|tex)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() || trimmed;
}

function readFirstString(result, keys) {
  for (const key of keys) {
    const value = clean(result?.[key]);
    if (value) return value;
  }

  return '';
}

function readStringArray(result, keys, fallback) {
  for (const key of keys) {
    const value = result?.[key];

    if (Array.isArray(value)) {
      const cleaned = value.map(clean).filter(Boolean);
      if (cleaned.length) return cleaned;
    }

    if (typeof value === 'string' && clean(value)) {
      return [clean(value)];
    }
  }

  return fallback;
}

function readBucketArray(result, keys, fallback) {
  for (const key of keys) {
    const value = result?.[key];

    if (!Array.isArray(value)) continue;

    const buckets = value
      .map((entry) => ({
        title: clean(entry?.title),
        description: clean(entry?.description),
        whyItMatters: clean(entry?.whyItMatters || entry?.why_it_matters),
        exampleSearchTerms: Array.isArray(entry?.exampleSearchTerms || entry?.example_search_terms)
          ? (entry.exampleSearchTerms || entry.example_search_terms).map(clean).filter(Boolean)
          : typeof (entry?.exampleSearchTerms || entry?.example_search_terms) === 'string'
            ? [clean(entry.exampleSearchTerms || entry.example_search_terms)]
            : []
      }))
      .filter((entry) => entry.title && entry.description);

    if (buckets.length) {
      return buckets.map((bucket, index) => ({
        ...bucket,
        whyItMatters: bucket.whyItMatters || fallback[index]?.whyItMatters || 'This bucket helps position the proposal against existing work.',
        exampleSearchTerms: bucket.exampleSearchTerms.length
          ? bucket.exampleSearchTerms
          : fallback[index]?.exampleSearchTerms || []
      }));
    }
  }

  return fallback;
}

function isSpecific(value, length) {
  return clean(value).length >= length;
}

function clean(value) {
  return String(value || '').trim();
}

function looksLikeLatex(value) {
  return /^\\(?:documentclass\b|begin\{document\}|section\{)/.test(String(value || '').trim());
}

function extractNestedLatexString(value) {
  const match = String(value || '').match(/"proposalLatex"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:complianceMatrix|evaluationReport|questions)"/);

  if (!match?.[1]) {
    return '';
  }

  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function latexParagraph(value) {
  return escapeLatex(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n\n');
}

function escapeLatex(value) {
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

function getProvider() {
  const provider = clean(process.env.LLM_PROVIDER).toLowerCase();
  const url = clean(process.env.LLM_API_URL).toLowerCase();

  if (provider === 'gemini' || url.includes('generativelanguage.googleapis.com')) {
    return 'gemini';
  }

  return 'openai-compatible';
}

function titleCase(value) {
  return clean(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}
