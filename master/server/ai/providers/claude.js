/* Claude provider (official @anthropic-ai/sdk). Optional: `npm install` in master/ to enable AI features. */
let Anthropic;
try { Anthropic = require("@anthropic-ai/sdk"); Anthropic = Anthropic.default || Anthropic; } catch { Anthropic = null; }

const MODEL = process.env.PORCHI_AI_MODEL || "claude-opus-5";

function create() {
  if (!Anthropic) return null;
  const client = new Anthropic(); // credentials: ANTHROPIC_API_KEY (or an `ant auth login` profile)

  /* One request → text or schema-valid JSON. Refusals fall back server-side to Anthropic's recommended model. */
  async function complete({ system, messages, schema, effort = "medium", maxTokens = 16000 }) {
    let response;
    try {
      response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        thinking: { type: "adaptive" },
        output_config: { effort, ...(schema ? { format: { type: "json_schema", schema } } : {}) },
        system,
        messages
      });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) throw Object.assign(new Error("AI is busy — try again in a minute"), { status: 429 });
      if (e instanceof Anthropic.AuthenticationError) throw Object.assign(new Error("AI is not configured (API key)"), { status: 503 });
      if (e instanceof Anthropic.APIError) throw Object.assign(new Error("AI service error"), { status: 502, cause: e });
      throw Object.assign(new Error("AI service unreachable"), { status: 502, cause: e });
    }
    if (response.stop_reason === "refusal") throw Object.assign(new Error("The AI declined this request"), { status: 422 });
    if (response.stop_reason === "max_tokens") throw Object.assign(new Error("AI response was too long — try a shorter input"), { status: 502 });
    const text = response.content.filter(b => b.type === "text").map(b => b.text).join("");
    return schema ? JSON.parse(text) : text;
  }
  return { name: "claude", model: MODEL, complete };
}
module.exports = { create };
