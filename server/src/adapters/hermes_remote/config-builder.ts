import type { HermesRemoteConfig } from "./types.js";

export function buildRemoteConfigYaml(
  config: HermesRemoteConfig,
  opts: {
    agentId: string;
    companyId: string;
    paperclipApiKey: string;
    agentName: string;
  }
): string {
  const mcp = config.mcpEndpoints ?? {};
  const paperclipUrl = mcp.paperclip ?? "http://localhost:8082/mcp";
  const ragUrl = mcp.rag ?? "http://localhost:8081/mcp";
  const memoryUrl = mcp.memory ?? "http://localhost:8680/mcp";
  const outlineUrl = mcp.outline ?? "https://outline.collaborationism.tech/mcp";

  return `model:
  default: glm-5.1
  provider: zai
agent:
  tool_use_enforcement: auto
  max_turns: 90
  reasoning_effort: "none"
terminal:
  backend: local
  cwd: .
  timeout: 180
  persistent_shell: true
compression:
  enabled: true
  threshold: 0.85
  target_ratio: 0.2
  protect_last_n: 20
  summary_model: glm-5
  summary_provider: auto
auxiliary:
  vision:
    provider: zai
    model: glm-4.6v
  web_extract:
    provider: auto
    timeout: 360
  session_search:
    provider: auto
    timeout: 30
display:
  compact: true
  personality: kawaii
  streaming: false
  tool_progress: result
memory:
  memory_enabled: true
  user_profile_enabled: true
  nudge_interval: 10
  memory_char_limit: 8000
approvals:
  mode: off
  timeout: 60
web:
  backend: parallel
mcp_servers:
  rag:
    url: ${ragUrl}
    enabled: true
    timeout: 120
    connect_timeout: 60
  paperclip:
    url: ${paperclipUrl}
    headers:
      X-Paperclip-Api-Key: "${opts.paperclipApiKey}"
      X-Paperclip-Company-Id: "${opts.companyId}"
      X-Paperclip-Agent-Id: "${opts.agentId}"
    enabled: true
    timeout: 60
    connect_timeout: 30
  outline:
    url: ${outlineUrl}
    enabled: true
    timeout: 120
    connect_timeout: 60
  memory:
    url: ${memoryUrl}
    enabled: true
    timeout: 30
    connect_timeout: 10
_config_version: 12
security:
  redact_secrets: true
`;
}

export function buildSoulMd(role: string, name: string): string {
  const outlineGuidance = `Outline (knowledge base):
- Use mcp_outline_search to search existing documents before creating new ones.
- Use mcp_outline_create_document to create documents. Always search first to avoid duplicates.
- After creating, use mcp_outline_search to verify the document was created.`;

  const paperclipGuidance = `Paperclip (task management):
- Use mcp_paperclip_paperclip_list_issues to see your tasks.
- Use mcp_paperclip_paperclip_update_issue to update task status.
- Use mcp_paperclip_paperclip_set_checklist to set task checklist.
- Tool names have mcp_paperclip_ prefix (double prefix is correct).`;

  if (role === "ceo" || role === "cto") {
    return `You are ${name}, a managing agent in a remote environment.
${outlineGuidance}
${paperclipGuidance}`;
  }
  return `You are ${name}, a worker agent running in a remote Kubernetes Pod.
${outlineGuidance}
${paperclipGuidance}`;
}

export function buildEnvFile(
  config: HermesRemoteConfig,
  opts: {
    paperclipApiUrl: string;
    paperclipApiKey: string;
    hermesApiServerKey: string;
    outlineApiKey: string;
  }
): string {
  const lines = [
    `PAPERCLIP_API_URL=${opts.paperclipApiUrl}`,
    `PAPERCLIP_RUN_API_KEY=${opts.paperclipApiKey}`,
    `HERMES_API_SERVER_KEY=${opts.hermesApiServerKey}`,
    `OUTLINE_API_KEY=${opts.outlineApiKey}`,
  ];
  const keys = config.providerKeys ?? {};
  for (const [k, v] of Object.entries(keys)) {
    lines.push(`${k}=${v}`);
  }
  return lines.join("\n");
}
