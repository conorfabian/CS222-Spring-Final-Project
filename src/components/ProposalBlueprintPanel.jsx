import { AlertTriangle, ArrowRight, BookOpenText, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';
import BlueprintSectionCard from './BlueprintSectionCard.jsx';

function ProposalBlueprintPanel({
  blueprint,
  blueprintError,
  blueprintGeneratedAt,
  blueprintMode,
  blueprintStatus,
  blueprintStale,
  onGenerate,
  onGenerateRelatedWork,
  relatedWorkPlanExists,
  relatedWorkStale,
  relatedWorkStatus
}) {
  const modeLabel = blueprintMode === 'api' ? 'Gemini' : blueprintMode === 'template' ? 'Template' : 'Waiting';

  const framingItems = blueprint
    ? [
        { label: 'Working Title', value: blueprint.workingTitle },
        { label: 'One-Sentence Summary', value: blueprint.oneSentenceSummary },
        { label: 'Problem Statement', value: blueprint.problemStatement },
        { label: 'Motivation / Why This Matters', value: blueprint.motivation },
        { label: 'Research Gap', value: blueprint.researchGap },
        { label: 'Proposed Contribution', value: blueprint.proposedContribution }
      ]
    : [];

  const researchDesignItems = blueprint
    ? [
        { label: 'Research Questions', value: blueprint.researchQuestions },
        { label: 'Hypotheses', value: blueprint.hypotheses },
        { label: 'Proposed Method / Technical Approach', value: blueprint.proposedMethod },
        { label: 'Possible Datasets, Tools, or Systems', value: blueprint.datasetsToolsSystems },
        { label: 'Evaluation Plan', value: blueprint.evaluationPlan }
      ]
    : [];

  const impactItems = blueprint
    ? [
        { label: 'Expected Results', value: blueprint.expectedResults },
        { label: 'Intellectual Merit', value: blueprint.intellectualMerit },
        { label: 'Broader Impacts', value: blueprint.broaderImpacts },
        { label: 'Missing Information / Clarifying Questions', value: blueprint.missingInformation },
        { label: 'Suggested Next Steps', value: blueprint.suggestedNextSteps }
      ]
    : [];

  return (
    <section className="blueprint-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Step 2</span>
          <h2>Proposal Blueprint</h2>
          <p>This blueprint organizes the rough idea into the core parts of a graduate-style research proposal scaffold.</p>
        </div>
        <span className={blueprintMode ? 'mode-pill is-ready' : 'mode-pill'}>{modeLabel}</span>
      </div>

      <div className="action-row summary-actions">
        <button className="secondary" disabled={blueprintStatus === 'generating'} type="button" onClick={onGenerate}>
          {blueprintStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          {blueprint ? 'Regenerate Blueprint' : 'Generate Proposal Blueprint'}
        </button>
        <button
          className="ghost"
          disabled={!blueprint || blueprintStale || relatedWorkStatus === 'generating'}
          type="button"
          onClick={onGenerateRelatedWork}
        >
          {relatedWorkStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
          {relatedWorkPlanExists ? 'Regenerate Related Work Plan' : 'Generate Related Work Plan'}
        </button>
      </div>

      {blueprintStale ? <div className="stale-banner">This blueprint is based on an older Step 1 intake. Regenerate it before moving forward.</div> : null}

      {blueprintError ? (
        <p className="error-banner inline-banner">
          <AlertTriangle size={16} aria-hidden="true" />
          {blueprintError}
        </p>
      ) : null}

      {blueprintStatus === 'generating' && !blueprint ? (
        <div className="blueprint-empty-state">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <h3>Generating proposal blueprint</h3>
          <p>The server is turning the structured idea intake into a research-oriented blueprint scaffold.</p>
        </div>
      ) : null}

      {blueprintStatus === 'error' && !blueprint ? (
        <div className="blueprint-empty-state">
          <AlertTriangle size={28} aria-hidden="true" />
          <h3>Blueprint generation failed</h3>
          <p>Try again to request a fresh Step 2 blueprint. Your Step 1 intake is still saved.</p>
        </div>
      ) : null}

      {!blueprint && blueprintStatus === 'idle' ? (
        <div className="blueprint-empty-state">
          <BookOpenText size={28} aria-hidden="true" />
          <h3>Blueprint pending</h3>
          <p>Generate the proposal blueprint to turn the Step 1 intake into a structured scaffold for critique and revision.</p>
        </div>
      ) : null}

      {blueprint ? (
        <>
          <div className="blueprint-meta-row">
            <span>
              <BookOpenText size={16} aria-hidden="true" />
              {blueprintGeneratedAt ? `Generated ${formatSavedAt(blueprintGeneratedAt)}` : 'Generated recently'}
            </span>
            <span>
              <Sparkles size={16} aria-hidden="true" />
              {blueprintStale
                ? 'Refresh required before later stages'
                : relatedWorkPlanExists && !relatedWorkStale
                  ? 'Related work planning is current'
                  : 'Ready for related work planning'}
            </span>
          </div>

          <div className="blueprint-card-grid">
            <BlueprintSectionCard items={framingItems} title="Framing" />
            <BlueprintSectionCard items={researchDesignItems} title="Research Design" />
            <BlueprintSectionCard items={impactItems} title="Impact And Revision Targets" />
          </div>

          <div className="next-stage-note muted-note">
            <ArrowRight size={16} aria-hidden="true" />
            <p>Next, turn this blueprint into literature search directions before critique and revision agents start making claims about novelty.</p>
          </div>
        </>
      ) : null}
    </section>
  );
}

function formatSavedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'recently';

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default ProposalBlueprintPanel;
