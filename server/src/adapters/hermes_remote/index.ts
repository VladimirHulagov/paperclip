import type { ServerAdapterModule } from "../types.js";
import { execute, testEnvironment } from "./execute.js";

export const hermesRemoteAdapter: ServerAdapterModule = {
  type: "hermes_remote",
  execute,
  testEnvironment,
  supportsLocalAgentJwt: true,
  models: [],
  agentConfigurationDoc: `# hermes_remote agent configuration

Adapter: hermes_remote — runs agent on a remote Kubernetes cluster.

Core fields:
- k8sApiUrl (string, required): k8s API server URL (e.g. "https://k8s.example.com:6443")
- k8sNamespace (string, required): k8s namespace for agent pods (e.g. "agents")
- k8sToken (string, required): ServiceAccount bearer token for k8s API
- k8sCAData (string, optional): Base64-encoded CA certificate
- agentImage (string, required): Docker image for agent pod (e.g. "hermes-agent-remote:latest")
- imagePullSecret (string, optional): k8s Secret name for private registry
- resources (object, optional): { cpu: "1", memory: "2Gi" }
- mcpEndpoints (object, optional): HTTPS URLs for MCP servers
- providerKeys (object, optional): LLM provider API keys
- timeoutSec (number, optional): run timeout, default 3600
`,
};
