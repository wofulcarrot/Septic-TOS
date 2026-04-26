// Lazily-initialized Anthropic client.
//
// In demo mode (no ANTHROPIC_API_KEY set), the cert agent short-circuits to
// a deterministic stub so the full demo flow works end-to-end without
// requiring an API key. This mirrors the Stripe demo-mode pattern.

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (_client) return _client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith("sk-ant-REPLACE") || key === "DEMO") return null;
  _client = new Anthropic({ apiKey: key });
  return _client;
}

export function isAnthropicLive(): boolean {
  return getAnthropic() !== null;
}

export const CERT_MODEL = "claude-sonnet-4-5";
