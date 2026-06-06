const DEFAULT_REQUIREMENTS = `Proposal must include:
- Project title
- Project goal
- Motivation
- Proposed approach
- Data and evaluation plan
- Expected contribution and risks
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
- Return a complete LaTeX document with \\documentclass[11pt]{article}, 1-inch margins, a simple title block, and numbered sections.
- Use compile-safe LaTeX. Avoid minted, shell-escape, external images, custom fonts, or packages that require extra system tools.
- Write the final artifact as a short class-style research proposal, not as a workflow report, blueprint dump, or product description.
- Keep the document under 3 pages, concise, and written in compact student-authored academic prose.
- Use this exact top-level section structure: Project Goal; Motivation; Proposed Approach; Data and Evaluation Plan; Expected Contribution and Risks; References, Assumptions, or Source Notes.
- Use minimal bullets, only when they clearly improve readability in the approach, evaluation, or risks sections.
- Do not include an abstract, workflow diagram, architecture figure, compliance-oriented wording, or app-internal narration.
- Do not mention Stage 1, fallback mode, AI Proposal Studio, compliance matrix, API routes, or implementation/debug details inside the proposal text.
- Preserve the student's research direction while condensing the generated workflow content into a short proposal deliverable.
- Mark unsupported claims as assumptions and keep novelty language provisional when literature verification is still pending.
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

const CRITIQUE_SYSTEM_PROMPT = `You are a panel of expert graduate research proposal reviewers.

Evaluate the student's proposal from these perspectives:
- Problem & Motivation Critic
- Novelty & Related Work Critic
- Methods & Feasibility Critic
- Evaluation Plan Critic
- Significance / Broader Impacts Critic

Return strict JSON with this exact shape:
{
  "overallScore": 0,
  "reviews": [
    {
      "criticName": "",
      "criticRole": "",
      "score": 0,
      "summary": "",
      "strengths": ["", ""],
      "issues": [
        {
          "id": "",
          "priority": "High | Medium | Low",
          "issue": "",
          "whyItMatters": "",
          "suggestedRevision": "",
          "relatedSection": "",
          "criticName": ""
        }
      ],
      "overallRecommendation": ""
    }
  ],
  "highestPriorityIssues": [
    {
      "id": "",
      "priority": "High | Medium | Low",
      "issue": "",
      "whyItMatters": "",
      "suggestedRevision": "",
      "relatedSection": "",
      "criticName": ""
    }
  ],
  "suggestedRevisionOrder": ["", ""]
}

Rules:
- Be specific, constructive, and proposal-oriented.
- Do not rewrite the full proposal.
- Do not invent citations or verified related work.
- Use the related work plan to flag unsupported novelty or grounding claims.
- If evaluation is vague, flag missing baselines, metrics, datasets, benchmarks, or ablations.
- Keep the critique useful for a later accept/reject suggestion workflow.
- Return valid JSON only.`;

const APPLY_REVISIONS_SYSTEM_PROMPT = `You are a graduate research proposal revision assistant.

You will receive:
1. The current proposal blueprint.
2. A revision plan containing only the suggestions the student accepted.

Return strict JSON with this exact shape:
{
  "revisedBlueprint": {
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
  },
  "changeSummary": ["", ""],
  "changedSections": [
    {
      "sectionName": "",
      "beforeSummary": "",
      "afterSummary": "",
      "reasonForChange": ""
    }
  ]
}

Rules:
- Revise only from the accepted suggestions.
- Preserve the student's original research direction and scope.
- Keep the output as a blueprint, not a full final proposal.
- Do not invent citations, paper titles, authors, or unsupported claims.
- If a suggestion requires literature that is not yet verified, revise the blueprint to acknowledge that verification is still needed.
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

export async function generateCritiquePanelResult(payload) {
  const ideaInput = normalizeIdeaInputPayload(payload.ideaInput || payload);
  const proposalBlueprint = normalizeProposalBlueprintPayload(payload.proposalBlueprint || payload.blueprint || {}, ideaInput);
  const relatedWorkPlan = normalizeRelatedWorkPlanPayload(
    payload.relatedWorkPlan || payload.relatedWork || {},
    ideaInput,
    proposalBlueprint
  );

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    try {
      return await generateCritiqueWithApi(ideaInput, proposalBlueprint, relatedWorkPlan);
    } catch (error) {
      const fallback = generateCritiqueLocally(ideaInput, proposalBlueprint, relatedWorkPlan);
      return {
        ...fallback,
        transcript: {
          ...fallback.transcript,
          rawResponse: `API critique generation failed and fell back to template mode.\n${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }

  return generateCritiqueLocally(ideaInput, proposalBlueprint, relatedWorkPlan);
}

export async function applyAcceptedRevisions(payload) {
  const proposalBlueprint = normalizeProposalBlueprintPayload(payload.proposalBlueprint || payload.blueprint || {}, {});
  const revisionPlan = normalizeRevisionPlanPayload(payload.revisionPlan || payload.plan || {});

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    try {
      return await generateRevisionResultWithApi(proposalBlueprint, revisionPlan);
    } catch (error) {
      const fallback = applyAcceptedRevisionsLocally(proposalBlueprint, revisionPlan);
      return {
        ...fallback,
        transcript: {
          ...fallback.transcript,
          rawResponse: `API revision application failed and fell back to template mode.\n${error instanceof Error ? error.message : String(error)}`
        }
      };
    }
  }

  return applyAcceptedRevisionsLocally(proposalBlueprint, revisionPlan);
}

export async function generateProposal(payload) {
  const project = normalizePayload(payload);
  const proposalBlueprint = payload?.proposalBlueprint || payload?.blueprint
    ? normalizeProposalBlueprintPayload(payload.proposalBlueprint || payload.blueprint || {}, normalizeIdeaInputPayload(payload.ideaInput || {}))
    : null;
  const requirements = project.requirements || DEFAULT_REQUIREMENTS;
  const checklist = extractChecklist(requirements);

  if (process.env.LLM_API_KEY && process.env.LLM_API_URL) {
    return generateWithApi(project, checklist, proposalBlueprint);
  }

  return generateLocally(project, checklist, proposalBlueprint);
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

async function generateWithApi(project, checklist, proposalBlueprint) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const promptPayload = {
    project,
    proposalBlueprint,
    checklist,
    styleTarget: {
      format: 'short class-style research proposal',
      sectionOrder: [
        'Project Goal',
        'Motivation',
        'Proposed Approach',
        'Data and Evaluation Plan',
        'Expected Contribution and Risks',
        'References, Assumptions, or Source Notes'
      ],
      titleBlock: ['[Student Name]', '[student@university.edu]', '[University / Program]']
    },
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
    ...coerceResult(parsed, project, checklist, proposalBlueprint),
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

async function generateCritiqueWithApi(ideaInput, proposalBlueprint, relatedWorkPlan) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const promptPayload = {
    ideaInput,
    proposalBlueprint,
    relatedWorkPlan,
    outputContract: {
      overallScore: 'Overall proposal readiness score from 1 to 10',
      reviews: 'Array of five critic review objects',
      highestPriorityIssues: 'Array of top critique issues across the panel',
      suggestedRevisionOrder: 'Array of revision steps in priority order'
    }
  };

  const content = await callModel({
    systemPrompt: CRITIQUE_SYSTEM_PROMPT,
    payload: promptPayload,
    model,
    temperature: 0.2
  });
  const parsed = parseJsonContent(content);

  return {
    mode: 'api',
    provider: process.env.LLM_API_URL,
    critiquePanelResult: coerceCritiquePanelResult(parsed, ideaInput, proposalBlueprint, relatedWorkPlan),
    transcript: {
      prompt: promptPayload,
      rawResponse: content
    }
  };
}

async function generateRevisionResultWithApi(proposalBlueprint, revisionPlan) {
  const model = clean(process.env.LLM_MODEL);

  if (!model) {
    throw new Error('LLM_MODEL is required when LLM_API_KEY and LLM_API_URL are configured.');
  }

  const promptPayload = {
    proposalBlueprint,
    revisionPlan: {
      acceptedSuggestions: revisionPlan.acceptedSuggestions
    },
    outputContract: {
      revisedBlueprint: 'Revised proposal blueprint object',
      changeSummary: 'Array of the most important applied improvements',
      changedSections: 'Array of changed section summaries with reasons'
    }
  };

  const content = await callModel({
    systemPrompt: APPLY_REVISIONS_SYSTEM_PROMPT,
    payload: promptPayload,
    model,
    temperature: 0.2
  });
  const parsed = parseJsonContent(content);

  return {
    mode: 'api',
    provider: process.env.LLM_API_URL,
    applyRevisionResult: coerceApplyRevisionResult(parsed, proposalBlueprint, revisionPlan),
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

function generateLocally(project, checklist, proposalBlueprint) {
  const questions = buildQuestions(project);
  const proposalLatex = buildLocalProposalLatex(project, proposalBlueprint);
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
      prompt: { project, proposalBlueprint, checklist },
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

function generateCritiqueLocally(ideaInput, proposalBlueprint, relatedWorkPlan) {
  return {
    mode: 'template',
    provider: 'template',
    critiquePanelResult: buildLocalCritiquePanelResult(ideaInput, proposalBlueprint, relatedWorkPlan),
    transcript: {
      prompt: { ideaInput, proposalBlueprint, relatedWorkPlan },
      rawResponse: 'Generated by local fallback because LLM_API_KEY or LLM_API_URL is not configured.'
    }
  };
}

function applyAcceptedRevisionsLocally(proposalBlueprint, revisionPlan) {
  return {
    mode: 'template',
    provider: 'template',
    applyRevisionResult: buildLocalApplyRevisionResult(proposalBlueprint, revisionPlan),
    transcript: {
      prompt: { proposalBlueprint, revisionPlan },
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

function buildLocalCritiquePanelResult(ideaInput, proposalBlueprint, relatedWorkPlan) {
  const reviews = [
    buildProblemMotivationCritic(ideaInput, proposalBlueprint),
    buildNoveltyCritic(proposalBlueprint, relatedWorkPlan),
    buildMethodsCritic(ideaInput, proposalBlueprint),
    buildEvaluationCritic(ideaInput, proposalBlueprint),
    buildSignificanceCritic(ideaInput, proposalBlueprint)
  ];
  const highestPriorityIssues = collectTopCritiqueIssues(reviews);

  return {
    overallScore: averageCritiqueScore(reviews),
    reviews,
    highestPriorityIssues,
    suggestedRevisionOrder: buildCritiqueRevisionOrder(highestPriorityIssues)
  };
}

function buildLocalApplyRevisionResult(proposalBlueprint, revisionPlan) {
  const acceptedSuggestions = normalizeRevisionSuggestionArray(revisionPlan.acceptedSuggestions);
  const revisedBlueprint = {
    ...proposalBlueprint,
    researchQuestions: [...(proposalBlueprint.researchQuestions || [])],
    hypotheses: [...(proposalBlueprint.hypotheses || [])],
    missingInformation: [...(proposalBlueprint.missingInformation || [])],
    suggestedNextSteps: [...(proposalBlueprint.suggestedNextSteps || [])]
  };
  const groupedSuggestions = groupSuggestionsByBlueprintField(acceptedSuggestions);
  const changedSections = [];

  groupedSuggestions.forEach(({ fieldKey, label, suggestions }) => {
    const before = cloneBlueprintValue(revisedBlueprint[fieldKey]);
    const after = reviseBlueprintField(fieldKey, before, suggestions);

    if (!blueprintValuesEqual(before, after)) {
      revisedBlueprint[fieldKey] = after;
      changedSections.push({
        sectionName: label,
        beforeSummary: summarizeBlueprintValue(before),
        afterSummary: summarizeBlueprintValue(after),
        reasonForChange: buildChangedSectionReason(suggestions)
      });
    }
  });

  if (acceptedSuggestions.some((suggestion) => /verified|citation|literature|novelty|related work/i.test(suggestion.suggestedRevision))) {
    revisedBlueprint.missingInformation = dedupeStrings([
      ...(revisedBlueprint.missingInformation || []),
      'Related-work support still needs to be verified with real literature before final novelty claims are made.'
    ]);
  }

  revisedBlueprint.suggestedNextSteps = dedupeStrings([
    ...(revisedBlueprint.suggestedNextSteps || []),
    'Rerun the critique panel on the revised blueprint to measure how proposal quality improved.',
    'Verify literature-dependent revisions with real sources before drafting a final proposal.'
  ]).slice(0, 8);

  return {
    revisedBlueprint,
    changeSummary: buildRevisionChangeSummary(acceptedSuggestions, changedSections),
    changedSections
  };
}

function buildLocalProposalLatex(project, proposalBlueprint) {
  const title = sanitizeProposalTitle(clean(proposalBlueprint?.workingTitle) || project.title || project.topic || 'Research Proposal');
  const researchGap = sanitizeProposalText(proposalBlueprint?.researchGap);
  const researchQuestions = Array.isArray(proposalBlueprint?.researchQuestions)
    ? proposalBlueprint.researchQuestions.map(sanitizeProposalText).filter(Boolean).slice(0, 3)
    : [];
  const hypotheses = Array.isArray(proposalBlueprint?.hypotheses)
    ? proposalBlueprint.hypotheses.map(sanitizeProposalText).filter(Boolean).slice(0, 1)
    : [];
  const missingInformation = Array.isArray(proposalBlueprint?.missingInformation)
    ? proposalBlueprint.missingInformation.map(sanitizeProposalText).filter(Boolean)
    : [];

  const projectGoal = mergeProposalParagraphs([
    sanitizeProposalText(proposalBlueprint?.oneSentenceSummary)
      || `This project studies ${sanitizeProposalText(project.topic || project.title || 'a focused research problem')} and aims to produce a concise, credible proposal for it.`,
    sanitizeProposalText(proposalBlueprint?.proposedContribution)
      || 'The expected contribution is a clearly scoped research direction with a defensible motivation, feasible approach, and measurable evaluation plan.'
  ]);
  const motivation = mergeProposalParagraphs([
    sanitizeProposalText(proposalBlueprint?.problemStatement) || sanitizeProposalText(project.problem) || 'The current problem framing is still preliminary and should be refined into a more specific research challenge.',
    sanitizeProposalText(proposalBlueprint?.motivation),
    buildGapSentence(researchGap)
  ]);
  const proposedApproach = sanitizeProposalText(proposalBlueprint?.proposedMethod)
    || sanitizeProposalText(project.method)
    || 'The proposed approach develops the idea into a structured workflow with clear inputs, intermediate outputs, and revision checkpoints.';
  const dataAndEvaluation = mergeProposalParagraphs([
    sanitizeProposalText(proposalBlueprint?.datasetsToolsSystems)
      || sanitizeProposalText(project.resources)
      || 'The project will rely on the most relevant publicly available datasets, tools, or source materials that fit the chosen domain.',
    sanitizeProposalText(proposalBlueprint?.evaluationPlan)
      || sanitizeProposalText(project.evaluation)
      || 'Evaluation will compare the resulting proposal quality against a simpler baseline using explicit criteria, reviewer judgment, or task-specific metrics.'
  ]);
  const expectedContribution = mergeProposalParagraphs([
    sanitizeProposalText(proposalBlueprint?.expectedResults)
      || 'The expected result is a stronger proposal draft with clearer structure, sharper motivation, and a more credible evaluation plan.',
    sanitizeProposalText(proposalBlueprint?.intellectualMerit),
    sanitizeProposalText(proposalBlueprint?.broaderImpacts)
  ]);
  const riskItems = buildProposalRiskItems(proposalBlueprint, project).slice(0, 3);
  const sourceNotes = dedupeStrings(
    [
      ...missingInformation,
      'Novelty claims remain provisional pending verification against related literature.'
    ].filter(Boolean)
  );

  return String.raw`\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}
\setlist{nosep,leftmargin=*}
\setlength{\parindent}{0pt}
\setlength{\parskip}{0.55em}
\title{${escapeLatex(title)}}
\author{[Student Name] \\ \texttt{[student@university.edu]} \\ [University / Program]}
\date{}

\begin{document}
\maketitle

\section{Project Goal}
${latexParagraph(projectGoal)}

\section{Motivation}
${latexParagraph(motivation)}

\section{Proposed Approach}
${latexParagraph(proposedApproach)}
${researchQuestions.length ? `\n\\begin{itemize}\n${researchQuestions.map((question) => `\\item ${escapeLatex(question)}`).join('\n')}\n\\end{itemize}\n` : ''}
${hypotheses.length ? `\n${latexParagraph(`A working hypothesis is that ${hypotheses[0].replace(/^[A-Z]/, (match) => match.toLowerCase())}`)}\n` : ''}

\section{Data and Evaluation Plan}
${latexParagraph(dataAndEvaluation)}

\section{Expected Contribution and Risks}
${latexParagraph(expectedContribution)}
${riskItems.length ? `\n\\begin{itemize}\n${riskItems.map((item) => `\\item ${escapeLatex(item)}`).join('\n')}\n\\end{itemize}\n` : ''}

\section{References, Assumptions, or Source Notes}
${sourceNotes.length ? `\\begin{itemize}\n${sourceNotes.map((item) => `\\item ${escapeLatex(item)}`).join('\n')}\n\\end{itemize}` : latexParagraph('Specific references and source notes will be added after the related literature is verified.')}

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
  const proposalBlueprint =
    payload.proposalBlueprint && typeof payload.proposalBlueprint === 'object'
      ? normalizeProposalBlueprintPayload(payload.proposalBlueprint, normalizeIdeaInputPayload(ideaInput))
      : null;
  const topic = clean(payload.topic) || clean(ideaInput.topic) || clean(proposalBlueprint?.workingTitle);
  const title = clean(payload.title) || clean(proposalBlueprint?.workingTitle) || topic;
  const problem = clean(payload.problem) || clean(proposalBlueprint?.problemStatement) || buildProblemFromIdeaInput(ideaInput);
  const method =
    clean(payload.method) ||
    clean(proposalBlueprint?.proposedMethod) ||
    buildMethodFromIdeaInput(ideaInput);
  const resources =
    clean(payload.resources) ||
    buildResourcesFromBlueprint(proposalBlueprint) ||
    buildResourcesFromIdeaInput(ideaInput);
  const references =
    clean(payload.references) ||
    buildReferencesFromBlueprint(proposalBlueprint, ideaInput) ||
    buildReferencesFromIdeaInput(ideaInput);

  return {
    topic,
    title,
    problem,
    method,
    timeline: clean(payload.timeline) || buildTimelineFromBlueprint(proposalBlueprint),
    evaluation: clean(payload.evaluation) || clean(proposalBlueprint?.evaluationPlan),
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

function normalizeRelatedWorkPlanPayload(payload, ideaInput, proposalBlueprint) {
  return coerceRelatedWorkResult(payload, ideaInput, proposalBlueprint);
}

function normalizeRevisionPlanPayload(payload) {
  return {
    acceptedSuggestions: normalizeRevisionSuggestionArray(payload.acceptedSuggestions),
    rejectedSuggestions: normalizeRevisionSuggestionArray(payload.rejectedSuggestions),
    deferredSuggestions: normalizeRevisionSuggestionArray(payload.deferredSuggestions),
    revisionOrder: normalizeRevisionSuggestionArray(payload.revisionOrder),
    summary: clean(payload.summary),
    sectionsToRevise: Array.isArray(payload.sectionsToRevise) ? payload.sectionsToRevise.map(clean).filter(Boolean) : []
  };
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

function buildTimelineFromBlueprint(proposalBlueprint) {
  if (!proposalBlueprint) return '';

  const nextSteps = Array.isArray(proposalBlueprint.suggestedNextSteps)
    ? proposalBlueprint.suggestedNextSteps.map(clean).filter(Boolean)
    : [];

  return nextSteps.length ? nextSteps.join('; ') : '';
}

function buildResourcesFromBlueprint(proposalBlueprint) {
  if (!proposalBlueprint) return '';

  return mergeIdeaSegments([clean(proposalBlueprint.datasetsToolsSystems)]);
}

function buildReferencesFromBlueprint(proposalBlueprint, ideaInput) {
  if (!proposalBlueprint) return '';

  return mergeIdeaSegments([
    clean(ideaInput.keywords),
    clean(proposalBlueprint.researchGap),
    Array.isArray(proposalBlueprint.missingInformation)
      ? proposalBlueprint.missingInformation.map(clean).filter(Boolean).join('; ')
      : ''
  ]);
}

function mergeIdeaSegments(parts) {
  return parts.filter(Boolean).join('\n');
}

function mergeProposalParagraphs(parts) {
  return parts.map(clean).filter(Boolean).join('\n\n');
}

function buildProposalRiskItems(proposalBlueprint, project) {
  const draftItems = [
    ...(Array.isArray(proposalBlueprint?.missingInformation) ? proposalBlueprint.missingInformation : []),
    clean(project.timeline),
    clean(project.references)
  ]
    .flatMap((item) => String(item || '').split(/;\s+/))
    .map(clean)
    .filter(Boolean)
    .map(normalizeRiskItem);

  if (draftItems.length) {
    return dedupeStrings(draftItems);
  }

  return [
    'The proposal still needs a narrower target population and clearer measurement criteria.',
    'Any novelty claim should remain provisional until related literature is verified.',
    'The scope may need to be reduced if the method or evaluation becomes too broad for the available timeline.'
  ];
}

function normalizeRiskItem(value) {
  const trimmed = clean(value)
    .replace(/^need to\s+/i, '')
    .replace(/^add\s+/i, 'The proposal still needs ')
    .replace(/^define\s+/i, 'The proposal still needs to define ')
    .replace(/^choose\s+/i, 'The proposal still needs to choose ')
    .replace(/^decide on\s+/i, 'The proposal still needs to decide on ');

  if (!trimmed) return '';
  if (/novelty claims remain provisional/i.test(trimmed)) return 'Novelty claims remain provisional pending verification against related literature.';
  if (/^the proposal/i.test(trimmed)) return trimmed.replace(/\.$/, '') + '.';

  return `${trimmed.replace(/\.$/, '')}.`;
}

function decapitalizeFirst(value) {
  const text = clean(value);
  if (!text) return '';
  return `${text.slice(0, 1).toLowerCase()}${text.slice(1)}`;
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

function buildProblemMotivationCritic(ideaInput, proposalBlueprint) {
  const criticName = 'Problem & Motivation Critic';
  const strengths = [];
  const issues = [];
  let score = 8;

  if (isSpecific(proposalBlueprint.problemStatement, 90)) {
    strengths.push('The problem statement names a concrete proposal focus rather than staying at the level of a generic topic.');
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Problem framing is still too broad or underspecified.', 'Reviewers need a concrete research pain point to judge scope, stakes, and feasibility.', 'Rewrite the problem statement so it names the exact user, pain point, and consequence of leaving the problem unsolved.', 'Problem Statement', issues.length)
    );
  }

  if (isSpecific(proposalBlueprint.motivation, 120)) {
    strengths.push('The motivation begins to explain why the problem matters and who is affected.');
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Motivation does not yet make the stakes or urgency explicit.', 'A weak motivation section makes the proposal feel like an interesting idea rather than an important research problem.', 'Add concrete stakes, consequences, or failure cases that show why the problem matters now.', 'Motivation', issues.length)
    );
  }

  if (clean(ideaInput.beneficiaries)) {
    strengths.push('The proposal already identifies likely beneficiaries or stakeholders.');
  } else {
    score -= 1;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'Primary beneficiaries are not clearly named.', 'Reviewers need to know who benefits from solving the problem in order to evaluate significance.', 'Name the primary student, researcher, practitioner, or user group that benefits from the work.', 'Broader Impacts', issues.length)
    );
  }

  if (!isSpecific(proposalBlueprint.workingTitle, 45)) {
    issues.push(
      createCritiqueIssue(criticName, 'Low', 'Working title could communicate the problem focus more precisely.', 'A sharper title helps reviewers quickly understand the proposal angle.', 'Refine the title so it names the technical focus and target outcome more explicitly.', 'Working Title', issues.length)
    );
    score -= 0.5;
  }

  return buildCriticReview(criticName, 'Checks whether the proposal clearly frames an important, motivated problem.', score, 'The proposal has the beginnings of a credible problem statement, but the motivation and stakeholder framing still need to become more concrete and higher-stakes.', strengths, issues, 'Clarify the problem stakes first, then sharpen the target users and title language.');
}

function buildNoveltyCritic(proposalBlueprint, relatedWorkPlan) {
  const criticName = 'Novelty & Related Work Critic';
  const strengths = [];
  const issues = [];
  let score = 7;

  if (isSpecific(proposalBlueprint.researchGap, 110)) {
    strengths.push('The blueprint attempts to name a gap rather than only restating the general topic area.');
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Research gap is still too generic to support a strong novelty claim.', 'Without a precise gap, the proposal risks claiming novelty before it is grounded in verified literature.', 'Rewrite the gap as a narrower statement about what existing approaches do not yet support or evaluate well.', 'Research Gap', issues.length)
    );
  }

  if ((relatedWorkPlan.relatedWorkBuckets || []).length >= 3) {
    strengths.push('The related work plan already organizes the literature search into useful buckets.');
  }

  if ((relatedWorkPlan.unsupportedClaimWarnings || []).length) {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Novelty and contribution claims still depend on unverified related work.', 'Reviewers will discount novelty language if the proposal cannot point to real prior work and comparison points.', 'Retrieve and verify literature for the top related-work buckets before using strong novelty or first-of-its-kind language.', 'Research Gap', issues.length)
    );
  }

  if ((relatedWorkPlan.searchQueries || []).length < 4) {
    score -= 1;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'The literature search plan may be too narrow to test the proposal against adjacent work.', 'A thin search plan makes it easier to miss important methods, baselines, or surveys.', 'Add search queries that explicitly target baselines, surveys, benchmarks, and adjacent technical approaches.', 'Related Work Planning', issues.length)
    );
  }

  return buildCriticReview(criticName, 'Checks whether the proposal gap is specific, grounded, and honest about unsupported claims.', score, 'The blueprint has a plausible gap statement, but it still needs verified literature support before the novelty framing becomes credible.', strengths, issues, 'Use the related-work plan to verify the gap before making stronger contribution claims.');
}

function buildMethodsCritic(ideaInput, proposalBlueprint) {
  const criticName = 'Methods & Feasibility Critic';
  const strengths = [];
  const issues = [];
  let score = 7;

  if (isSpecific(proposalBlueprint.proposedMethod, 120)) {
    strengths.push('The proposal describes a recognizable method or workflow rather than leaving the approach completely abstract.');
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Method description is still too vague to judge feasibility.', 'Reviewers need enough implementation detail to understand what will actually be built or studied.', 'Spell out the main workflow stages, system components, or experimental steps in the proposed method.', 'Proposed Method / Technical Approach', issues.length)
    );
  }

  if (clean(proposalBlueprint.datasetsToolsSystems) && !/still need|need to be selected|candidate/i.test(proposalBlueprint.datasetsToolsSystems)) {
    strengths.push('The blueprint already names candidate datasets, tools, or systems that could anchor the implementation.');
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Datasets, tools, or systems are not concrete enough yet.', 'Feasibility is difficult to assess when the resource plan is still placeholder-level.', 'Name the datasets, software stack, benchmarks, or reference materials that the method will rely on.', 'Possible Datasets, Tools, or Systems', issues.length)
    );
  }

  if (/agent/i.test(ideaInput.topic) && !/(generator|verifier|critic|planner|retriever)/i.test(proposalBlueprint.proposedMethod)) {
    score -= 1;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'Agent roles are implied but not clearly separated.', 'When a proposal depends on multiple agents, reviewers need to know what each component is responsible for.', 'Define the roles of the main agents or components, such as generator, verifier, critic, or planner.', 'Proposed Method / Technical Approach', issues.length)
    );
  }

  return buildCriticReview(criticName, 'Checks whether the proposed technical approach is realistic, scoped, and implementable.', score, 'The method is promising, but feasibility still depends on clearer workflow detail and a firmer resource plan.', strengths, issues, 'Lock down the implementation path and required resources before expanding the proposal scope.');
}

function buildEvaluationCritic(ideaInput, proposalBlueprint) {
  const criticName = 'Evaluation Plan Critic';
  const strengths = [];
  const issues = [];
  let score = 6;
  const evaluation = clean(proposalBlueprint.evaluationPlan);

  if (/(compare|comparison|before\/after|baseline)/i.test(evaluation)) {
    strengths.push('The evaluation plan already hints at comparative evidence rather than only describing the method.');
    score += 1;
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Evaluation plan does not clearly define baselines or comparison points.', 'Without comparisons, reviewers cannot tell whether the method improves on anything meaningful.', 'Add concrete baselines, prior approaches, or before/after comparison conditions to the evaluation plan.', 'Evaluation Plan', issues.length)
    );
  }

  if (/(metric|accuracy|coverage|rubric|benchmark|user study|ablation|gsm8k|math)/i.test(evaluation)) {
    strengths.push('The evaluation language points toward measurable evidence rather than subjective judgment alone.');
    score += 1;
  } else {
    score -= 2;
    issues.push(
      createCritiqueIssue(criticName, 'High', 'Success criteria are not measurable enough yet.', 'Strong proposals need named metrics, rubrics, or benchmark evidence so success can be judged objectively.', 'Name the metrics, rubric dimensions, benchmark tasks, or study outcomes that will define success.', 'Evaluation Plan', issues.length)
    );
  }

  if (!clean(ideaInput.datasets) && /dataset|benchmark|tool/i.test(proposalBlueprint.datasetsToolsSystems) === false) {
    score -= 1;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'Evaluation resources are still disconnected from concrete datasets or systems.', 'Reviewers often treat vague evaluation infrastructure as a feasibility risk.', 'Connect the evaluation plan to specific datasets, benchmarks, or systems that can actually be used.', 'Possible Datasets, Tools, or Systems', issues.length)
    );
  }

  return buildCriticReview(criticName, 'Checks whether the proposal defines measurable success, baselines, and evidence quality.', score, 'Evaluation is the weakest part of the current scaffold because it still needs sharper metrics, baselines, and resource alignment.', strengths, issues, 'Strengthen the evaluation plan before expanding the contribution claims.');
}

function buildSignificanceCritic(ideaInput, proposalBlueprint) {
  const criticName = 'Significance / Broader Impacts Critic';
  const strengths = [];
  const issues = [];
  let score = 7;

  if (isSpecific(proposalBlueprint.intellectualMerit, 90)) {
    strengths.push('The blueprint already starts to explain the research merit of the idea.');
  } else {
    score -= 1.5;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'Intellectual merit is still described too generally.', 'Reviewers need a sharper explanation of what knowledge, capability, or evaluation insight the project could contribute.', 'State the exact technical or research insight the project would add beyond building a prototype.', 'Intellectual Merit', issues.length)
    );
  }

  if (isSpecific(proposalBlueprint.broaderImpacts, 100)) {
    strengths.push('The broader impacts section already points toward who could benefit from the work.');
  } else {
    score -= 1.5;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'Broader impacts are still too generic.', 'Generic impacts make the proposal sound formulaic rather than genuinely significant.', 'Name the downstream users, educational communities, or societal settings that benefit and how they benefit.', 'Broader Impacts', issues.length)
    );
  }

  if (!clean(ideaInput.beneficiaries)) {
    score -= 1;
    issues.push(
      createCritiqueIssue(criticName, 'Medium', 'Beneficiaries and real-world significance need to be connected more explicitly.', 'A proposal is stronger when significance is tied to a concrete population or use case.', 'Link the broader impacts section back to the primary beneficiaries named in the intake or add them if missing.', 'Broader Impacts', issues.length)
    );
  }

  return buildCriticReview(criticName, 'Checks whether the proposal explains why the work matters beyond the immediate technical idea.', score, 'The proposal has a reasonable significance story, but it still needs more concrete intellectual merit and broader impact language.', strengths, issues, 'Make the significance sections more specific and tie them to identifiable beneficiaries.');
}

function buildCriticReview(criticName, criticRole, score, summary, strengths, issues, overallRecommendation) {
  return {
    criticName,
    criticRole,
    score: clampCritiqueScore(score),
    summary,
    strengths: strengths.length ? strengths : ['The proposal has enough structure to support a concrete revision pass.'],
    issues: sortCritiqueIssues(issues.length ? issues : [createCritiqueIssue(criticName, 'Low', 'No major issues were flagged by the template reviewer.', 'The fallback critique did not detect a specific weakness here.', 'Use a Gemini-backed critique run for a more nuanced review.', '', 0)]),
    overallRecommendation
  };
}

function createCritiqueIssue(criticName, priority, issue, whyItMatters, suggestedRevision, relatedSection, index) {
  return {
    id: `${toKebab(criticName)}-${index + 1}`,
    priority: normalizeCritiquePriority(priority),
    issue,
    whyItMatters,
    suggestedRevision,
    relatedSection: clean(relatedSection),
    criticName
  };
}

function collectTopCritiqueIssues(reviews) {
  return reviews
    .flatMap((review) => review.issues.map((issue) => ({ ...issue, criticName: issue.criticName || review.criticName })))
    .sort(compareCritiqueIssues)
    .slice(0, 5);
}

function buildCritiqueRevisionOrder(issues) {
  return issues.map((issue) =>
    clean(issue.relatedSection)
      ? `${issue.relatedSection}: ${issue.suggestedRevision}`
      : `${issue.criticName}: ${issue.suggestedRevision}`
  );
}

function averageCritiqueScore(reviews) {
  if (!reviews.length) return 0;

  const average = reviews.reduce((total, review) => total + clampCritiqueScore(review.score), 0) / reviews.length;
  return Number(average.toFixed(1));
}

function sortCritiqueIssues(issues) {
  return [...issues].sort(compareCritiqueIssues);
}

function compareCritiqueIssues(left, right) {
  const order = { High: 0, Medium: 1, Low: 2 };
  const priorityDelta = (order[left.priority] ?? 9) - (order[right.priority] ?? 9);

  if (priorityDelta !== 0) return priorityDelta;

  return clean(left.issue).localeCompare(clean(right.issue));
}

function normalizeCritiquePriority(value) {
  const normalized = clean(value).toLowerCase();

  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  return 'Low';
}

function clampCritiqueScore(value) {
  const numeric = Number(value);

  if (Number.isNaN(numeric)) return 5;

  return Math.min(10, Math.max(1, Number(numeric.toFixed ? numeric.toFixed(1) : numeric)));
}

function toKebab(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function dedupeSentences(parts) {
  return dedupeStrings(parts.map(clean).filter(Boolean)).join(' ');
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
  if (/goal/.test(text) && project.title) return 'Goal section is generated from the current proposal direction and contribution.';
  if (/motivation|gap|problem/.test(text) && project.problem) return project.problem;
  if (/method|workflow|approach/.test(text) && project.method) return project.method;
  if (/data|resource|budget|tool/.test(text) && project.resources) return project.resources;
  if (/evaluation|metric|test/.test(text) && project.evaluation) return project.evaluation;
  if (/expected|contribution|result|risk/.test(text) && (project.timeline || project.evaluation || project.problem)) {
    return project.timeline || 'Draft includes a concise contribution-and-risks section.';
  }
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

function coerceResult(result, project, checklist, proposalBlueprint) {
  return {
    proposalLatex: extractProposalLatex(result, project, proposalBlueprint),
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

function coerceCritiquePanelResult(result, ideaInput, proposalBlueprint, relatedWorkPlan) {
  const fallback = buildLocalCritiquePanelResult(ideaInput, proposalBlueprint, relatedWorkPlan);
  const reviews = readReviewArray(result, ['reviews'], fallback.reviews);
  const highestPriorityIssues = readIssueArray(
    result,
    ['highestPriorityIssues', 'highest_priority_issues'],
    collectTopCritiqueIssues(reviews)
  );

  return {
    overallScore: readFirstNumber(result, ['overallScore', 'overall_score'], averageCritiqueScore(reviews)),
    reviews,
    highestPriorityIssues,
    suggestedRevisionOrder: readStringArray(
      result,
      ['suggestedRevisionOrder', 'suggested_revision_order'],
      buildCritiqueRevisionOrder(highestPriorityIssues)
    )
  };
}

function coerceApplyRevisionResult(result, proposalBlueprint, revisionPlan) {
  const fallback = buildLocalApplyRevisionResult(proposalBlueprint, revisionPlan);

  return {
    revisedBlueprint: coerceBlueprintResult(result?.revisedBlueprint || result?.blueprint || result, {}, {}),
    changeSummary: readStringArray(result, ['changeSummary', 'change_summary'], fallback.changeSummary),
    changedSections: readChangedSectionArray(
      result,
      ['changedSections', 'changed_sections'],
      fallback.changedSections
    )
  };
}

function extractProposalLatex(result, project, proposalBlueprint) {
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
    if (looksLikeLatex(unwrapped) && matchesClassStyleProposal(unwrapped)) {
      return unwrapped;
    }
  }

  return buildLocalProposalLatex(project, proposalBlueprint);
}

function matchesClassStyleProposal(value) {
  const latex = clean(value);

  if (!latex) return false;

  const requiredSections = [
    '\\section{Project Goal}',
    '\\section{Motivation}',
    '\\section{Proposed Approach}',
    '\\section{Data and Evaluation Plan}',
    '\\section{Expected Contribution and Risks}',
    '\\section{References, Assumptions, or Source Notes}'
  ];
  const bannedPatterns = [
    /\\begin\{abstract\}/i,
    /\\begin\{figure\}/i,
    /\\section\{Figure\}/i,
    /\bStage 1\b/i,
    /\bAI Proposal Studio\b/i,
    /compliance matrix/i
  ];

  return (
    requiredSections.every((section) => latex.includes(section)) &&
    latex.includes('[Student Name]') &&
    latex.includes('[student@university.edu]') &&
    latex.includes('[University / Program]') &&
    bannedPatterns.every((pattern) => !pattern.test(latex))
  );
}

function sanitizeProposalTitle(value) {
  const sanitized = sanitizeProposalText(value)
    .replace(/\s+Revised based on accepted critique:.*$/i, '')
    .trim();

  return sanitized || 'Research Proposal';
}

function sanitizeProposalText(value) {
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

function buildGapSentence(value) {
  const gap = clean(value);

  if (!gap) return '';
  if (/^(while|there is|existing|current|despite)\b/i.test(gap)) {
    return gap;
  }

  return `A central gap in the current landscape is ${decapitalizeFirst(gap)}`;
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

function readChangedSectionArray(result, keys, fallback) {
  for (const key of keys) {
    const value = result?.[key];

    if (!Array.isArray(value)) continue;

    const sections = value
      .map((entry, index) => ({
        sectionName: clean(entry?.sectionName || entry?.section_name) || fallback[index]?.sectionName || 'Proposal Section',
        beforeSummary: clean(entry?.beforeSummary || entry?.before_summary) || fallback[index]?.beforeSummary || '',
        afterSummary: clean(entry?.afterSummary || entry?.after_summary) || fallback[index]?.afterSummary || '',
        reasonForChange:
          clean(entry?.reasonForChange || entry?.reason_for_change) ||
          fallback[index]?.reasonForChange ||
          'Updated to reflect the accepted critique suggestions.'
      }))
      .filter((entry) => entry.sectionName && (entry.beforeSummary || entry.afterSummary));

    if (sections.length) {
      return sections;
    }
  }

  return fallback;
}

function readReviewArray(result, keys, fallback) {
  for (const key of keys) {
    const value = result?.[key];

    if (!Array.isArray(value)) continue;

    const reviews = value
      .map((entry, index) => normalizeCriticReview(entry, fallback[index]))
      .filter(Boolean);

    if (reviews.length) {
      return reviews;
    }
  }

  return fallback;
}

function readIssueArray(result, keys, fallback) {
  for (const key of keys) {
    const value = result?.[key];

    if (!Array.isArray(value)) continue;

    const issues = value
      .map((entry, index) => normalizeCritiqueIssue(entry, fallback[index]))
      .filter(Boolean);

    if (issues.length) {
      return sortCritiqueIssues(issues).slice(0, 5);
    }
  }

  return fallback;
}

function normalizeRevisionSuggestionArray(items) {
  return Array.isArray(items)
    ? items
        .map((item, index) => normalizeRevisionSuggestion(item, index))
        .filter(Boolean)
    : [];
}

function normalizeRevisionSuggestion(item, index) {
  if (!item) return null;

  const issue = clean(item.issue);

  if (!issue) return null;

  return {
    id: clean(item.id) || `revision-suggestion-${index + 1}`,
    sourceCritic: clean(item.sourceCritic || item.source_critic || item.criticName || item.critic_name) || 'Critic',
    priority: normalizeCritiquePriority(item.priority || item.severity || 'Medium'),
    relatedSection: clean(item.relatedSection || item.related_section),
    issue,
    whyItMatters: clean(item.whyItMatters || item.why_it_matters) || 'This revision affects proposal quality and reviewer confidence.',
    suggestedRevision: clean(item.suggestedRevision || item.suggested_revision) || issue,
    status: clean(item.status).toLowerCase() || 'accepted',
    userNote: clean(item.userNote || item.user_note)
  };
}

function readFirstNumber(result, keys, fallback) {
  for (const key of keys) {
    const value = Number(result?.[key]);

    if (!Number.isNaN(value)) {
      return clampCritiqueScore(value);
    }
  }

  return clampCritiqueScore(fallback);
}

function normalizeCriticReview(entry, fallback) {
  const criticName = clean(entry?.criticName || entry?.critic_name) || fallback?.criticName || 'Proposal Critic';
  const criticRole = clean(entry?.criticRole || entry?.critic_role) || fallback?.criticRole || 'Reviews one dimension of the proposal.';
  const strengthsValue = entry?.strengths;
  const strengths = Array.isArray(strengthsValue)
    ? strengthsValue.map(clean).filter(Boolean)
    : clean(strengthsValue)
      ? [clean(strengthsValue)]
      : fallback?.strengths || [];
  const issues = Array.isArray(entry?.issues)
    ? entry.issues.map((item, index) => normalizeCritiqueIssue(item, fallback?.issues?.[index], criticName)).filter(Boolean)
    : fallback?.issues || [];

  if (!criticName) return null;

  return {
    criticName,
    criticRole,
    score: readFirstNumber({ score: entry?.score }, ['score'], fallback?.score || 5),
    summary: clean(entry?.summary) || fallback?.summary || 'This reviewer flagged areas that still need revision.',
    strengths: strengths.length ? strengths : fallback?.strengths || ['The proposal has enough structure for a concrete critique.'],
    issues: sortCritiqueIssues(issues.length ? issues : fallback?.issues || []),
    overallRecommendation:
      clean(entry?.overallRecommendation || entry?.overall_recommendation) ||
      fallback?.overallRecommendation ||
      'Revise the highlighted issues before treating the proposal as ready for the next stage.'
  };
}

function normalizeCritiqueIssue(entry, fallback, fallbackCriticName = '') {
  if (typeof entry === 'string' && clean(entry)) {
    return {
      id: fallback?.id || `${toKebab(fallbackCriticName || fallback?.criticName || 'critique-issue')}-fallback`,
      priority: fallback?.priority || 'Medium',
      issue: clean(entry),
      whyItMatters: fallback?.whyItMatters || 'This issue needs to be resolved before the proposal is considered stronger.',
      suggestedRevision: fallback?.suggestedRevision || 'Revise this section with more specific evidence and scope.',
      relatedSection: fallback?.relatedSection || '',
      criticName: fallbackCriticName || fallback?.criticName || ''
    };
  }

  const issue = clean(entry?.issue);

  if (!issue) {
    return fallback || null;
  }

  return {
    id: clean(entry?.id) || fallback?.id || `${toKebab(fallbackCriticName || fallback?.criticName || 'critique-issue')}-${toKebab(issue).slice(0, 24)}`,
    priority: normalizeCritiquePriority(entry?.priority || fallback?.priority),
    issue,
    whyItMatters: clean(entry?.whyItMatters || entry?.why_it_matters) || fallback?.whyItMatters || 'This issue affects proposal quality and reviewer confidence.',
    suggestedRevision:
      clean(entry?.suggestedRevision || entry?.suggested_revision) ||
      fallback?.suggestedRevision ||
      'Revise this area with more specific evidence and structure.',
    relatedSection: clean(entry?.relatedSection || entry?.related_section) || fallback?.relatedSection || '',
    criticName: clean(entry?.criticName || entry?.critic_name) || fallbackCriticName || fallback?.criticName || ''
  };
}

function groupSuggestionsByBlueprintField(suggestions) {
  const grouped = new Map();

  suggestions.forEach((suggestion) => {
    const fieldKey = mapSuggestionToBlueprintField(suggestion);
    const label = blueprintFieldLabel(fieldKey);
    const existing = grouped.get(fieldKey);

    if (existing) {
      existing.suggestions.push(suggestion);
      return;
    }

    grouped.set(fieldKey, {
      fieldKey,
      label,
      suggestions: [suggestion]
    });
  });

  return Array.from(grouped.values());
}

function mapSuggestionToBlueprintField(suggestion) {
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

function blueprintFieldLabel(fieldKey) {
  const labels = {
    workingTitle: 'Working Title',
    oneSentenceSummary: 'One-Sentence Summary',
    problemStatement: 'Problem Statement',
    motivation: 'Motivation / Why This Matters',
    researchGap: 'Research Gap',
    proposedContribution: 'Proposed Contribution',
    researchQuestions: 'Research Questions',
    hypotheses: 'Hypotheses',
    proposedMethod: 'Proposed Method / Technical Approach',
    datasetsToolsSystems: 'Possible Datasets, Tools, or Systems',
    evaluationPlan: 'Evaluation Plan',
    expectedResults: 'Expected Results',
    intellectualMerit: 'Intellectual Merit',
    broaderImpacts: 'Broader Impacts',
    missingInformation: 'Missing Information / Clarifying Questions',
    suggestedNextSteps: 'Suggested Next Steps'
  };

  return labels[fieldKey] || titleCase(fieldKey);
}

function reviseBlueprintField(fieldKey, value, suggestions) {
  if (Array.isArray(value)) {
    return reviseBlueprintArrayField(fieldKey, value, suggestions);
  }

  return reviseBlueprintStringField(fieldKey, value, suggestions);
}

function reviseBlueprintStringField(fieldKey, value, suggestions) {
  const base = clean(value);

  if (fieldKey === 'evaluationPlan') {
    return dedupeSentences([
      base,
      'Candidate success criteria should include explicit benchmarks, rubric dimensions, comparison baselines, and evidence of proposal quality improvement.'
    ]);
  }

  if (fieldKey === 'researchGap') {
    return dedupeSentences([
      base,
      'The revised gap should distinguish this staged, student-in-the-loop proposal workflow from more generic AI writing or reasoning systems and treat novelty as provisional until related work is verified.'
    ]);
  }

  if (fieldKey === 'proposedMethod') {
    return dedupeSentences([
      base,
      'The revised method should explicitly define the roles of generation, critique, verification, and student decision-making within the workflow.'
    ]);
  }

  if (fieldKey === 'broaderImpacts') {
    return dedupeSentences([
      base,
      'The revised broader-impact framing should identify concrete beneficiaries such as graduate students, advisors, and lower-resource educational settings that benefit from clearer proposal support.'
    ]);
  }

  if (fieldKey === 'datasetsToolsSystems') {
    return dedupeSentences([
      base,
      'The revision should identify candidate benchmark tasks, proposal examples, or evaluation resources that make feasibility and comparison more concrete.'
    ]);
  }

  if (fieldKey === 'intellectualMerit') {
    return dedupeSentences([
      base,
      'The revised intellectual-merit framing should emphasize the research insight gained from structuring critique, revision, and evaluation into one workflow rather than only describing a tool.'
    ]);
  }

  const revisionSentence = suggestions
    .map((suggestion) => `Revised based on accepted critique: ${clean(suggestion.suggestedRevision)}`)
    .filter(Boolean)
    .join(' ');

  return dedupeSentences([base, revisionSentence || `Revised based on accepted critique for ${blueprintFieldLabel(fieldKey)}.`]);
}

function reviseBlueprintArrayField(fieldKey, value, suggestions) {
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

    if (lower.includes('evaluation')) {
      return 'Strengthened the evaluation plan with clearer benchmarks, metrics, and baseline expectations.';
    }

    if (lower.includes('research gap')) {
      return 'Clarified the research gap and reduced unsupported novelty language.';
    }

    if (lower.includes('method')) {
      return 'Made the proposed method more concrete by defining workflow roles and feasibility details.';
    }

    if (lower.includes('broader impacts')) {
      return 'Made broader impacts more specific by naming concrete beneficiaries and outcomes.';
    }

    return `Revised ${section.sectionName.toLowerCase()} based on accepted critique suggestions.`;
  });

  return dedupeStrings(
    summaries.concat(
      acceptedSuggestions
        .map((suggestion) => clean(suggestion.suggestedRevision))
        .filter(Boolean)
        .slice(0, 2)
    )
  ).slice(0, 6);
}

function buildChangedSectionReason(suggestions) {
  return dedupeStrings(suggestions.map((suggestion) => clean(suggestion.suggestedRevision)).filter(Boolean)).join(' ');
}

function cloneBlueprintValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

function blueprintValuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function summarizeBlueprintValue(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean).join(' | ');
  }

  return clean(value);
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
