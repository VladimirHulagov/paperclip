export interface HermesRemoteConfig {
  k8sApiUrl: string;
  k8sNamespace: string;
  k8sToken: string;
  k8sCAData?: string;

  agentImage: string;
  imagePullSecret?: string;

  resources?: {
    cpu: string;
    memory: string;
  };

  mcpEndpoints?: {
    paperclip?: string;
    rag?: string;
    memory?: string;
    outline?: string;
  };

  providerKeys?: Record<string, string>;

  timeoutSec?: number;
}

export interface K8sDeployment {
  apiVersion: "apps/v1";
  kind: "Deployment";
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
  };
  spec: {
    replicas: number;
    selector: { matchLabels: Record<string, string> };
    template: {
      metadata: { labels: Record<string, string> };
      spec: {
        containers: Array<{
          name: string;
          image: string;
          ports: Array<{ containerPort: number }>;
          envFrom: Array<{ secretRef: { name: string } }>;
          volumeMounts: Array<{ name: string; mountPath: string }>;
          resources?: { limits: Record<string, string>; requests: Record<string, string> };
        }>;
        volumes: Array<{
          name: string;
          configMap: { name: string };
        }>;
        imagePullSecrets?: Array<{ name: string }>;
      };
    };
  };
}

export interface K8sService {
  apiVersion: "v1";
  kind: "Service";
  metadata: { name: string; namespace: string; labels: Record<string, string> };
  spec: {
    selector: Record<string, string>;
    ports: Array<{ port: number; targetPort: number }>;
    type: string;
  };
}

export interface K8sConfigMap {
  apiVersion: "v1";
  kind: "ConfigMap";
  metadata: { name: string; namespace: string; labels: Record<string, string> };
  data: Record<string, string>;
}

export interface K8sSecret {
  apiVersion: "v1";
  kind: "Secret";
  metadata: { name: string; namespace: string; labels: Record<string, string> };
  type: "Opaque";
  stringData: Record<string, string>;
}

export interface SSEEvent {
  event?: string;
  data: Record<string, unknown>;
}

export function agentResourceName(agentId: string): string {
  return `agent-${agentId.slice(0, 8)}`;
}
