export const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/i;

export function buildCorsOriginValidator(rawOrigins) {
  const configuredOrigins = String(rawOrigins || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (LOCAL_DEV_ORIGIN_PATTERN.test(origin)) {
      callback(null, true);
      return;
    }

    if (!configuredOrigins.length || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  };
}
