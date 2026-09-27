/* Demo provider: canned "[DEMO]" output so the AI screens can be previewed without an API key.
   Enable only for local testing:  PORCHI_AI_PROVIDER=demo npm start */
function fill(schema, key = "") {
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, fill(v, k)]));
  if (schema.type === "array") return [`[DEMO] ${key.replace(/_/g, " ")} 1`, `[DEMO] ${key.replace(/_/g, " ")} 2`];
  if (schema.type === "number") return 6;
  return `[DEMO] ${key.replace(/_/g, " ")} — real feedback appears when an AI provider is configured.`;
}
module.exports = { create: () => ({ name: "demo", model: "demo",
  complete: async ({ schema }) => schema ? fill(schema) : "[DEMO] This is a sample AI Teacher reply. Configure ANTHROPIC_API_KEY for real answers." }) };
