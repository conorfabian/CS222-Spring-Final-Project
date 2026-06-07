# AI Usage Log

## Tools Used

- Codex in the local repository
- the proposal workflow app in this repository
- local Node scripts, tests, build, PDF rendering, and proposal validation

## Main Human Input

The research intake was:

- Topic: predicting NBA player injury risk from public data with interpretable machine learning
- Domain: sports analytics, machine learning, predictive modeling, and sports medicine informatics
- Problem: public-data injury modeling is more reproducible and accessible than private biometric systems, but must be evaluated carefully
- Methods: collect public injury reports, game logs, and player history; engineer workload/rest/history features; compare logistic regression, random forest, XGBoost, and a simple neural baseline
- Evaluation: AUROC, precision, recall, F1, Brier score, calibration, false-positive/false-negative analysis, ablation, subgroup checks, and neural baseline comparison

## Evidence of Proposal Generation

The raw files are in `evidence/stage2-run-01/`.

- Step 1 start: [01-agent-start.json](evidence/stage2-run-01/01-agent-start.json)
- Step 1 answer: [02-agent-answer.json](evidence/stage2-run-01/02-agent-answer.json)
- Step 2 and Step 3: [03-blueprint-and-related-work.json](evidence/stage2-run-01/03-blueprint-and-related-work.json)
- Step 4 critique: [04-critique.json](evidence/stage2-run-01/04-critique.json)
- Step 5 revision plan: [05-revision-plan.json](evidence/stage2-run-01/05-revision-plan.json)
- Step 6 apply revisions: [06-apply-revisions.json](evidence/stage2-run-01/06-apply-revisions.json)
- Step 7 proposal output: [07-proposal-output.json](evidence/stage2-run-01/07-proposal-output.json)

Visual proof files:

- [01-step1-agent-session.svg](evidence/stage2-run-01/01-step1-agent-session.svg)
- [02-step4-critique.svg](evidence/stage2-run-01/02-step4-critique.svg)
- [03-step6-revision-comparison.svg](evidence/stage2-run-01/03-step6-revision-comparison.svg)
- [04-step7-evaluation-artifacts.svg](evidence/stage2-run-01/04-step7-evaluation-artifacts.svg)

## Human Choices

- I supplied the NBA injury-risk research intake.
- I chose concrete evaluation metrics and baselines.
- I accepted high-priority critique suggestions about novelty grounding, temporal split, success criteria, and public-data assumptions.
- I deferred the final injury-label narrowing until the source audit because the proposal should not overclaim before data inspection.

## Checks And Commands

Commands used for this package:

- `npm run build`
- local validator/page-count checks for `proposal.tex` and `proposal.pdf`

Command log:

- [evidence/stage2-run-01/run-commands.txt](evidence/stage2-run-01/run-commands.txt)

Validation results:

- `proposal.tex` passes the submission-readiness validator.
- `proposal.pdf` is 3 pages.
- The Step 7 compliance matrix covers all required sections.

## Final Submission Files

- [workflow_usage.md](workflow_usage.md)
- [AI_USAGE.md](AI_USAGE.md)
- [proposal.pdf](proposal.pdf)
- [proposal.tex](proposal.tex)
- [proposal/proposal.tex](proposal/proposal.tex)
- [proposal/source_notes.md](proposal/source_notes.md)
- [proposal/figure_workflow.mmd](proposal/figure_workflow.mmd)
- [proposal/figure_workflow.svg](proposal/figure_workflow.svg)
- [evidence/stage2-run-01/](evidence/stage2-run-01/)
