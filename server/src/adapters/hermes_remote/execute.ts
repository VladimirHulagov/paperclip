import type { AdapterExecutionContext, AdapterExecutionResult } from "../types.js";
import { K8sClient } from "./k8s-client.js";
import { buildRemoteConfigYaml, buildSoulMd, buildEnvFile } from "./config-builder.js";
import { agentResourceName } from "./types.js";
import type { HermesRemoteConfig, K8sDeployment, K8sService } from "./types.js";

function parseConfig(raw: Record<string, unknown>): HermesRemoteConfig {
  return {
    k8sApiUrl: String(raw.k8sApiUrl ?? ""),
    k8sNamespace: String(raw.k8sNamespace ?? "agents"),
    k8sToken: String(raw.k8sToken ?? ""),
    k8sCAData: raw.k8sCAData ? String(raw.k8sCAData) : undefined,
    agentImage: String(raw.agentImage ?? "hermes-agent-remote:latest"),
    imagePullSecret: raw.imagePullSecret ? String(raw.imagePullSecret) : undefined,
    resources: raw.resources as { cpu: string; memory: string } | undefined,
    mcpEndpoints: raw.mcpEndpoints as HermesRemoteConfig["mcpEndpoints"],
    providerKeys: raw.providerKeys as Record<string, string>,
    timeoutSec: Number(raw.timeoutSec) || 3600,
  };
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const config = parseConfig(ctx.config as Record<string, unknown>);
  if (!config.k8sApiUrl) throw new Error("hermes_remote adapter missing k8sApiUrl");
  if (!config.k8sToken) throw new Error("hermes_remote adapter missing k8sToken");

  const k8s = new K8sClient(config);
  const agentId = ctx.agent.id;
  const companyId = ctx.agent.companyId;
  const name = agentResourceName(agentId);
  const ns = k8s.getNamespace();
  const agentName = ctx.agent.name ?? "Agent";
  const role = ((ctx.agent as Record<string, unknown>).role as string) ?? "general";

  const apiKey = ctx.authToken ?? "";
  const paperclipApiUrl = process.env.PAPERCLIP_API_URL ?? "http://paperclip-server:3100/api";
  const hermesApiKey = process.env.HERMES_API_SERVER_KEY ?? "";
  const outlineApiKey = process.env.MCP_OUTLINE_API_KEY ?? "";

  const configYaml = buildRemoteConfigYaml(config, {
    agentId,
    companyId,
    paperclipApiKey: apiKey,
    agentName,
  });
  const soulMd = buildSoulMd(role, agentName);
  const envFile = buildEnvFile(config, {
    paperclipApiUrl,
    paperclipApiKey: apiKey,
    hermesApiServerKey: hermesApiKey,
    outlineApiKey,
  });

  await k8s.applyConfigMap(`${name}-config`, {
    "config.yaml": configYaml,
    "SOUL.md": soulMd,
    ".env": envFile,
  });

  await k8s.applySecret(`${name}-secrets`, {
    PAPERCLIP_API_KEY: apiKey,
    ...(config.providerKeys ?? {}),
  });

  const resources = config.resources ?? { cpu: "1", memory: "2Gi" };
  const deployment: K8sDeployment = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name,
      namespace: ns,
      labels: { app: "hermes-agent", "agent-id": agentId, "managed-by": "paperclip" },
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { "agent-id": agentId } },
      template: {
        metadata: { labels: { app: "hermes-agent", "agent-id": agentId, "managed-by": "paperclip" } },
        spec: {
          containers: [
            {
              name: "agent",
              image: config.agentImage,
              ports: [{ containerPort: 8642 }],
              envFrom: [{ secretRef: { name: `${name}-secrets` } }],
              volumeMounts: [{ name: "config", mountPath: "/etc/hermes" }],
              resources: {
                requests: { cpu: resources.cpu, memory: resources.memory },
                limits: { cpu: resources.cpu, memory: resources.memory },
              },
            },
          ],
          volumes: [{ name: "config", configMap: { name: `${name}-config` } }],
          ...(config.imagePullSecret ? { imagePullSecrets: [{ name: config.imagePullSecret }] } : {}),
        },
      },
    },
  };
  await k8s.applyDeployment(name, deployment);

  const service: K8sService = {
    apiVersion: "v1",
    kind: "Service",
    metadata: { name, namespace: ns, labels: { "managed-by": "paperclip" } },
    spec: {
      selector: { "agent-id": agentId },
      ports: [{ port: 8642, targetPort: 8642 }],
      type: "ClusterIP",
    },
  };
  await k8s.applyService(name, service);

  const readyTimeout = Date.now() + 120_000;
  while (Date.now() < readyTimeout) {
    if (await k8s.isDeploymentReady(name)) break;
    await new Promise((r) => setTimeout(r, 3_000));
  }
  if (!(await k8s.isDeploymentReady(name))) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      summary: `Agent pod ${name} not ready after 120s`,
      resultJson: { summary: `Agent pod ${name} not ready after 120s` },
    };
  }

  const agentUrl = `http://${name}.${ns}:8642`;

  const input = buildInputMessage(ctx);
  const instructions = soulMd;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (config.timeoutSec ?? 3600) * 1000);

  try {
    const runRes = await fetch(`${agentUrl}/v1/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        instructions,
        paperclip_api_key: apiKey,
        heartbeat_run_id: ctx.runId,
      }),
      signal: controller.signal,
    });

    if (!runRes.ok) {
      const errText = await runRes.text();
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        summary: `Agent POST /v1/runs failed: ${runRes.status} ${errText.slice(0, 300)}`,
        resultJson: { summary: `Agent error: ${runRes.status}` },
      };
    }

    const { run_id: runId } = (await runRes.json()) as { run_id: string; status: string };
    if (!runId) {
      return {
        exitCode: 1,
        signal: null,
        timedOut: false,
        summary: "Agent returned no run_id",
        resultJson: { summary: "Agent returned no run_id" },
      };
    }

    return await streamSSEEvents(agentUrl, runId, controller);
  } finally {
    clearTimeout(timer);
  }
}

function buildInputMessage(ctx: AdapterExecutionContext): string {
  const agentName = ctx.agent.name ?? "Agent";
  const runId = ctx.runId;
  const parts = [`[HEARTBEAT RUN ${runId}]`];
  parts.push(`You are ${agentName}, an AI agent.`);
  if (ctx.context?.taskId) {
    parts.push(`Your assigned task ID: ${ctx.context.taskId}`);
  }
  if (ctx.context?.wakeReason) {
    parts.push(`Wake reason: ${ctx.context.wakeReason}`);
  }
  parts.push(
    "Check your assigned issues with mcp_paperclip_paperclip_list_issues, work on the highest priority task, update the checklist, and report results."
  );
  return parts.join("\n");
}

async function streamSSEEvents(
  agentUrl: string,
  runId: string,
  controller: AbortController
): Promise<AdapterExecutionResult> {
  const eventsUrl = `${agentUrl}/v1/runs/${runId}/events`;
  const eventsRes = await fetch(eventsUrl, {
    headers: { Accept: "text/event-stream" },
    signal: controller.signal,
  });

  if (!eventsRes.ok) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      summary: `SSE stream failed: ${eventsRes.status}`,
      resultJson: { summary: `SSE stream failed: ${eventsRes.status}` },
    };
  }

  const body = eventsRes.body;
  if (!body) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      summary: "No SSE body",
      resultJson: { summary: "No SSE body" },
    };
  }

  let finalText = "";
  let toolCount = 0;
  let usage: Record<string, unknown> | null = null;
  let runFailed = false;
  let errorMsg = "";
  const decoder = new TextDecoder();
  const reader = body.getReader();

  try {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const evt = JSON.parse(jsonStr) as { event?: string; data?: Record<string, unknown> };
          const eventType = evt.event ?? evt.data?.type;
          const data = evt.data ?? {};

          if (eventType === "message.delta") {
            finalText += String(data.content ?? "");
          } else if (eventType === "tool.started" || eventType === "tool.completed") {
            toolCount++;
          } else if (eventType === "run.completed") {
            usage = ((data as Record<string, unknown>).usage as Record<string, unknown>) ?? null;
            finalText = String((data as Record<string, unknown>).response ?? finalText);
          } else if (eventType === "run.failed") {
            runFailed = true;
            errorMsg = String((data as Record<string, unknown>).error ?? "Unknown error");
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  } catch (e) {
    if (controller.signal.aborted) {
      return {
        exitCode: 1,
        signal: "SIGTERM",
        timedOut: true,
        summary: "Run timed out",
        resultJson: { summary: "Run timed out" },
      };
    }
    throw e;
  }

  if (runFailed) {
    return {
      exitCode: 1,
      signal: null,
      timedOut: false,
      summary: errorMsg,
      resultJson: { summary: errorMsg },
    };
  }

  const summary = finalText.slice(0, 2000) || "Run completed";
  return {
    exitCode: 0,
    signal: null,
    timedOut: false,
    summary,
    resultJson: { summary, toolCount },
    usage: usage as AdapterExecutionResult["usage"],
  };
}

export async function testEnvironment(): Promise<{ ok: boolean; error?: string }> {
  return { ok: true };
}
