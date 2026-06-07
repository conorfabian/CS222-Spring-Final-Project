# Workflow Usage

## Context

This submission uses a simulated end-to-end pipeline run because the Gemini free-tier API quota was exhausted before a fresh live run could complete. The instructor allowed a simulated AI-agent output package in this situation. The evidence is labeled with `mode: simulated-api-output` and `provider: codex-simulated-gemini` so it is not presented as a live Gemini run.

The topic used throughout the run was:

- Predicting NBA player injury risk from publicly available data with interpretable machine learning

The run evidence is in `evidence/stage2-run-01/`.

## Step 1: Intake And Clarifying Question

The workflow accepted the research intake, converted it into project state, suggested missing fields, and asked a high-priority evaluation question.

Evidence:

- Image: [evidence/stage2-run-01/01-step1-agent-session.svg](evidence/stage2-run-01/01-step1-agent-session.svg)
- Raw log: [evidence/stage2-run-01/01-agent-start.json](evidence/stage2-run-01/01-agent-start.json)
- Raw log: [evidence/stage2-run-01/02-agent-answer.json](evidence/stage2-run-01/02-agent-answer.json)

The human answer added AUROC, precision, recall, F1, Brier score, calibration, false-positive/false-negative analysis, and comparison against logistic regression and a simple neural baseline.

## Step 2 And Step 3: Blueprint And Related Work

The simulated pipeline produced a proposal blueprint and related-work plan from the intake.

Evidence:

- Raw log: [evidence/stage2-run-01/03-blueprint-and-related-work.json](evidence/stage2-run-01/03-blueprint-and-related-work.json)

The blueprint defined the problem, research gap, contribution, method, evaluation plan, expected results, and missing information. The related-work plan identified NBA injury forecasting, interpretable sports injury models, and calibration/evaluation literature as the main search buckets.

## Step 4: Critique

The critique panel reviewed the blueprint from five perspectives: problem/motivation, novelty/related work, methods/feasibility, evaluation, and significance.

Evidence:

- Image: [evidence/stage2-run-01/02-step4-critique.svg](evidence/stage2-run-01/02-step4-critique.svg)
- Raw log: [evidence/stage2-run-01/04-critique.json](evidence/stage2-run-01/04-critique.json)

The critique identified the highest-priority issues: verify prior-work anchors, use a temporal split, define cautious success criteria, and state public-data assumptions.

## Step 5 And Step 6: Revision Loop

The workflow accepted the highest-value critique suggestions and applied them to the blueprint.

Evidence:

- Image: [evidence/stage2-run-01/03-step6-revision-comparison.svg](evidence/stage2-run-01/03-step6-revision-comparison.svg)
- Raw log: [evidence/stage2-run-01/05-revision-plan.json](evidence/stage2-run-01/05-revision-plan.json)
- Raw log: [evidence/stage2-run-01/06-apply-revisions.json](evidence/stage2-run-01/06-apply-revisions.json)

The revision loop improved:

- the novelty claim by grounding it in NBA comparison points;
- the method by specifying temporal splitting and feature families;
- the evaluation plan by adding calibration, ablation, subgroup checks, and a relative AUROC target;
- the source notes by making public-data assumptions explicit.

## Step 7: Proposal Output And Checks

The final step produced the proposal LaTeX, PDF, compliance matrix, and evaluation report.

Evidence:

- Image: [evidence/stage2-run-01/04-step7-evaluation-artifacts.svg](evidence/stage2-run-01/04-step7-evaluation-artifacts.svg)
- Raw log: [evidence/stage2-run-01/07-proposal-output.json](evidence/stage2-run-01/07-proposal-output.json)

The Step 7 output checks show:

- all required proposal sections are covered;
- the figure is captioned, labeled, and referenced;
- the evaluation plan includes concrete metrics and baselines;
- the generated proposal passes the submission-readiness validator;
- the PDF is 3 pages.

## Run Summary

- Summary: [evidence/stage2-run-01/run-summary.json](evidence/stage2-run-01/run-summary.json)
- Commands: [evidence/stage2-run-01/run-commands.txt](evidence/stage2-run-01/run-commands.txt)
- App snapshot: [public/latest-run-snapshot.json](public/latest-run-snapshot.json)

## Stage 3 Source Bundle

The final proposal source bundle for this same topic is in `proposal/`.

Important files:

- [proposal.pdf](proposal.pdf)
- [proposal.tex](proposal.tex)
- [proposal/proposal.tex](proposal/proposal.tex)
- [proposal/source_notes.md](proposal/source_notes.md)
- [proposal/figure_workflow.mmd](proposal/figure_workflow.mmd)
- [proposal/figure_workflow.svg](proposal/figure_workflow.svg)

The final proposal is under the 3-page limit and includes a readable workflow figure, prior-work/source notes, concrete evaluation metrics, milestones, risks, resources, and assumptions.
