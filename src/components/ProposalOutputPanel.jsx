import { AlertTriangle, Download, FileCode2, FileText, Loader2, RefreshCw } from 'lucide-react';

function ProposalOutputPanel({
  currentVersionId,
  onGenerate,
  onTabChange,
  proposalOutput,
  proposalOutputError,
  proposalOutputGeneratedAt,
  proposalOutputMode,
  proposalOutputStale,
  proposalOutputStatus,
  proposalOutputTab,
  proposalPdfUrl,
  proposalVersions,
  revisionApplicationStale
}) {
  const hasOutput = Boolean(proposalOutput?.proposalLatex);
  const currentVersion = proposalVersions.find((version) => version.id === currentVersionId) || proposalVersions.at(-1) || null;
  const modeLabel = proposalOutputMode === 'api' ? 'Gemini' : proposalOutputMode === 'template' ? 'Template' : 'Waiting';
  const canGenerate = proposalVersions.length >= 2 && !revisionApplicationStale && proposalOutputStatus !== 'generating';

  return (
    <section className="proposal-output-panel panel-card">
      <div className="panel-header-row">
        <div>
          <span className="eyebrow">Step 7</span>
          <h2>Proposal Output</h2>
          <p>This step shows the current proposal artifact as a PDF and a compile-ready LaTeX document built from the latest revised draft.</p>
        </div>
        <span className={proposalOutputMode ? 'mode-pill is-ready' : 'mode-pill'}>{modeLabel}</span>
      </div>

      <div className="action-row summary-actions">
        <button className="secondary" disabled={!canGenerate} type="button" onClick={onGenerate}>
          {proposalOutputStatus === 'generating' ? <Loader2 className="spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          {hasOutput ? 'Regenerate Proposal Output' : 'Generate Proposal Output'}
        </button>
      </div>

      {revisionApplicationStale ? (
        <div className="stale-banner">Apply revisions again before generating Step 7 so the output matches the latest accepted revision plan.</div>
      ) : null}

      {proposalOutputStale ? (
        <div className="stale-banner">The current proposal output is based on an older saved draft. Regenerate it to match the latest revised blueprint.</div>
      ) : null}

      {proposalOutputError ? (
        <p className="error-banner inline-banner">
          <AlertTriangle size={16} aria-hidden="true" />
          {proposalOutputError}
        </p>
      ) : null}

      {!hasOutput && proposalOutputStatus === 'idle' ? (
        <div className="blueprint-empty-state">
          <FileText size={28} aria-hidden="true" />
          <h3>Proposal output pending</h3>
          <p>Generate Step 7 to create the current PDF and LaTeX proposal artifact from the latest revised blueprint.</p>
        </div>
      ) : null}

      {proposalOutputStatus === 'generating' && !hasOutput ? (
        <div className="blueprint-empty-state">
          <Loader2 className="spin" size={28} aria-hidden="true" />
          <h3>Generating proposal output</h3>
          <p>The latest revised blueprint is being converted into a LaTeX document and compiled into PDF.</p>
        </div>
      ) : null}

      {hasOutput ? (
        <>
          <div className="blueprint-meta-row">
            <span>
              <FileText size={16} aria-hidden="true" />
              {proposalOutputGeneratedAt ? `Generated ${formatSavedAt(proposalOutputGeneratedAt)}` : 'Generated recently'}
            </span>
            <span>
              <FileCode2 size={16} aria-hidden="true" />
              {currentVersion ? `Built from ${currentVersion.label}` : 'Built from latest revised draft'}
            </span>
          </div>

          <div className="proposal-output-tabs" role="tablist" aria-label="Proposal output tabs">
            <button
              className={`proposal-output-tab${proposalOutputTab === 'pdf' ? ' is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('pdf')}
            >
              <FileText size={16} aria-hidden="true" />
              PDF
            </button>
            <button
              className={`proposal-output-tab${proposalOutputTab === 'latex' ? ' is-active' : ''}`}
              type="button"
              onClick={() => onTabChange('latex')}
            >
              <FileCode2 size={16} aria-hidden="true" />
              LaTeX
            </button>
          </div>

          <div className="proposal-output-stage">
            {proposalOutputTab === 'pdf' ? (
              <div className="proposal-output-view">
                <div className="proposal-output-toolbar">
                  <span className="issue-section-chip">PDF preview</span>
                  <a className={`secondary output-download-link${proposalPdfUrl ? '' : ' is-disabled'}`} download="proposal.pdf" href={proposalPdfUrl || '#'} onClick={(event) => (!proposalPdfUrl ? event.preventDefault() : null)}>
                    <Download size={16} aria-hidden="true" />
                    Download PDF
                  </a>
                </div>

                {proposalPdfUrl ? (
                  <iframe className="proposal-pdf-frame" src={proposalPdfUrl} title="Proposal PDF preview" />
                ) : (
                  <div className="blueprint-empty-state is-compact-state">
                    <AlertTriangle size={24} aria-hidden="true" />
                    <h3>PDF preview unavailable</h3>
                    <p>The LaTeX document is still available below. Regenerate the output to retry PDF compilation.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="proposal-output-view">
                <div className="proposal-output-toolbar">
                  <span className="issue-section-chip">Compile-ready source</span>
                  <a
                    className="secondary output-download-link"
                    download="proposal.tex"
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(proposalOutput.proposalLatex)}`}
                  >
                    <Download size={16} aria-hidden="true" />
                    Download .tex
                  </a>
                </div>

                <pre className="latex-source-view">
                  <code>{proposalOutput.proposalLatex}</code>
                </pre>
              </div>
            )}
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

export default ProposalOutputPanel;
