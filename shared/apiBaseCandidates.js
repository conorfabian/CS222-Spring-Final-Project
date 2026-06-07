function dedupeStrings(items) {
  return [...new Set(items.map((item) => String(item ?? '').trim()))];
}

export function getApiBaseCandidatesForEnvironment({ hostname = '', isDev = false } = {}) {
  const normalizedHost = String(hostname || '').trim();
  const isLocalHost = ['127.0.0.1', 'localhost', '::1'].includes(normalizedHost);
  const candidates = [''];

  if (isDev || isLocalHost) {
    candidates.push(
      `http://${normalizedHost || '127.0.0.1'}:8787`,
      'http://127.0.0.1:8787',
      'http://localhost:8787'
    );
  }

  return dedupeStrings(candidates);
}
