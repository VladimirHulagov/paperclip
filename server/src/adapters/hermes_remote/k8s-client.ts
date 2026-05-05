import type { HermesRemoteConfig, K8sDeployment, K8sService } from "./types.js";

export class K8sClient {
  private baseUrl: string;
  private token: string;
  private namespace: string;

  constructor(config: HermesRemoteConfig) {
    this.baseUrl = config.k8sApiUrl.replace(/\/+$/, "");
    this.token = config.k8sToken;
    this.namespace = config.k8sNamespace;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 409 && method === "POST") {
      throw new Error(`K8s resource already exists: ${path}`);
    }
    if (res.status === 404 && method === "GET") {
      return null as T;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`K8s API error ${res.status}: ${text.slice(0, 500)}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async applyConfigMap(name: string, data: Record<string, string>): Promise<void> {
    const body = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: { name, namespace: this.namespace, labels: { "managed-by": "paperclip" } },
      data,
    };
    await this.request("PUT", `/api/v1/namespaces/${this.namespace}/configmaps/${name}`, body).catch(
      async () => {
        await this.request("POST", `/api/v1/namespaces/${this.namespace}/configmaps`, body);
      }
    );
  }

  async applySecret(name: string, stringData: Record<string, string>): Promise<void> {
    const body = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: { name, namespace: this.namespace, labels: { "managed-by": "paperclip" } },
      type: "Opaque",
      stringData,
    };
    await this.request("PUT", `/api/v1/namespaces/${this.namespace}/secrets/${name}`, body).catch(
      async () => {
        await this.request("POST", `/api/v1/namespaces/${this.namespace}/secrets`, body);
      }
    );
  }

  async applyDeployment(name: string, deployment: K8sDeployment): Promise<void> {
    await this.request(
      "PUT",
      `/apis/apps/v1/namespaces/${this.namespace}/deployments/${name}`,
      deployment
    ).catch(async () => {
      await this.request("POST", `/apis/apps/v1/namespaces/${this.namespace}/deployments`, deployment);
    });
  }

  async applyService(name: string, service: K8sService): Promise<void> {
    await this.request("PUT", `/api/v1/namespaces/${this.namespace}/services/${name}`, service).catch(
      async () => {
        await this.request("POST", `/api/v1/namespaces/${this.namespace}/services`, service);
      }
    );
  }

  async isDeploymentReady(name: string): Promise<boolean> {
    const dep = await this.request<{
      status: { readyReplicas?: number; replicas?: number };
    }>("GET", `/apis/apps/v1/namespaces/${this.namespace}/deployments/${name}`);
    if (!dep) return false;
    return (dep.status?.readyReplicas ?? 0) >= 1;
  }

  async deleteDeployment(name: string): Promise<void> {
    await this.request("DELETE", `/apis/apps/v1/namespaces/${this.namespace}/deployments/${name}`).catch(
      () => {}
    );
  }

  async deleteService(name: string): Promise<void> {
    await this.request("DELETE", `/api/v1/namespaces/${this.namespace}/services/${name}`).catch(() => {});
  }

  async deleteConfigMap(name: string): Promise<void> {
    await this.request("DELETE", `/api/v1/namespaces/${this.namespace}/configmaps/${name}`).catch(() => {});
  }

  async deleteSecret(name: string): Promise<void> {
    await this.request("DELETE", `/api/v1/namespaces/${this.namespace}/secrets/${name}`).catch(() => {});
  }

  getNamespace(): string {
    return this.namespace;
  }
}
