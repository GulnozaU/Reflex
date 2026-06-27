/** File paths that must never be recorded (not even redacted). */
export const SKIP_FILE_PATTERNS: RegExp[] = [
  /(?:^|[/\\])\.env(?:\.|$)/i,
  /\.pem$/i,
  /\.key$/i,
  /(?:^|[/\\])credentials[^/\\]*/i,
  /(?:^|[/\\])secrets(?:[/\\]|[^/\\]*)/i
];

export const REDACTION_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // OpenAI / generic API keys
  { pattern: /\bsk-[A-Za-z0-9]{20,}\b/g, replacement: '[REDACTED_API_KEY]' },
  { pattern: /\b(api[_-]?key|apikey|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]?[^\s'"]+['"]?/gi, replacement: '$1=[REDACTED]' },
  // Bearer tokens
  { pattern: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer [REDACTED]' },
  // AWS access key id
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, replacement: '[REDACTED_AWS_KEY]' },
  // AWS secret (40 char base64-ish)
  { pattern: /\b[A-Za-z0-9/+=]{40}\b/g, replacement: '[REDACTED_SECRET]' },
  // GitHub tokens
  { pattern: /\bghp_[A-Za-z0-9]{36,}\b/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  // Private key blocks
  {
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY_BLOCK]'
  }
];

export function shouldSkipFile(path: string): boolean {
  const normalized = path.replace(/\\/g, '/');
  return SKIP_FILE_PATTERNS.some((re) => re.test(normalized));
}

export function redactString(input: string): string {
  let out = input;
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
