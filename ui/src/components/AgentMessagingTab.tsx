import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { agentsApi } from "../api/agents";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

interface AgentMessagingTabProps {
  agent: {
    id: string;
    companyId?: string;
    adapterConfig?: Record<string, unknown>;
  };
  onUpdated?: () => void;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

export function AgentMessagingTab({ agent, onUpdated }: AgentMessagingTabProps) {
  const [actionError, setActionError] = useState<string | null>(null);

  const messaging = asRecord(asRecord(agent.adapterConfig)?.messaging);
  const telegram = asRecord(messaging?.telegram);
  const telegramEnabled = telegram?.enabled === true;

  const [messagingDraft, setMessagingDraft] = useState<{
    botToken: string;
    chatId: string;
    allowedUsers: string;
    defaultTimeout: number;
  }>({
    botToken: "",
    chatId: "",
    allowedUsers: "",
    defaultTimeout: 600,
  });

  useEffect(() => {
    if (telegram) {
      setMessagingDraft({
        botToken: (telegram.botToken as string) ?? "",
        chatId: (telegram.chatId as string) ?? "",
        allowedUsers: (telegram.allowedUsers as string) ?? "",
        defaultTimeout: (telegram.defaultTimeout as number) ?? 600,
      });
    }
  }, [telegram]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      agentsApi.update(agent.id, data, agent.companyId),
    onSuccess: () => {
      setActionError(null);
      onUpdated?.();
    },
    onError: (error) => {
      setActionError(
        error instanceof Error ? error.message : "Failed to update messaging settings."
      );
    },
  });

  const saveTelegram = (tgPatch: Record<string, unknown>) => {
    const currentMessaging = messaging ?? {};
    const currentTelegram = telegram ?? {};
    saveMutation.mutate({
      adapterConfig: {
        ...agent.adapterConfig,
        messaging: {
          ...currentMessaging,
          telegram: { ...currentTelegram, enabled: true, ...tgPatch },
        },
      },
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Messaging</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure messaging platforms for this agent. Overrides instance-level messaging settings.
        </p>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Telegram Q&A</h2>
            </div>
            <ToggleSwitch
              checked={telegramEnabled}
              onCheckedChange={() =>
                saveMutation.mutate({
                  adapterConfig: {
                    ...agent.adapterConfig,
                    messaging: {
                      ...(messaging ?? {}),
                      telegram: {
                        ...(telegram ?? { defaultTimeout: 600 }),
                        enabled: !telegramEnabled,
                      },
                    },
                  },
                })
              }
              disabled={saveMutation.isPending}
              aria-label="Toggle Telegram Q&A"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enable Telegram Q&A to let this agent ask clarifying questions via a Telegram bot and receive replies.
          </p>
          {telegramEnabled && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="agent-telegram-bot-token" className="text-sm font-medium">
                  Bot Token
                </label>
                <input
                  id="agent-telegram-bot-token"
                  type="password"
                  placeholder="From @BotFather"
                  value={messagingDraft.botToken}
                  disabled={saveMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({ ...d, botToken: e.target.value }))
                  }
                  onBlur={() => {
                    if (messagingDraft.botToken !== ((telegram?.botToken as string) ?? "")) {
                      saveTelegram({
                        botToken: messagingDraft.botToken || undefined,
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="agent-telegram-chat-id" className="text-sm font-medium">
                  Chat ID
                </label>
                <input
                  id="agent-telegram-chat-id"
                  type="text"
                  placeholder="-1001234567890"
                  value={messagingDraft.chatId}
                  disabled={saveMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({ ...d, chatId: e.target.value }))
                  }
                  onBlur={() => {
                    if (messagingDraft.chatId !== ((telegram?.chatId as string) ?? "")) {
                      saveTelegram({
                        chatId: messagingDraft.chatId || undefined,
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="agent-telegram-allowed-users" className="text-sm font-medium">
                  Allowed Users
                </label>
                <input
                  id="agent-telegram-allowed-users"
                  type="text"
                  placeholder="Comma-separated Telegram user IDs"
                  value={messagingDraft.allowedUsers}
                  disabled={saveMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({ ...d, allowedUsers: e.target.value }))
                  }
                  onBlur={() => {
                    if (messagingDraft.allowedUsers !== ((telegram?.allowedUsers as string) ?? "")) {
                      saveTelegram({
                        allowedUsers: messagingDraft.allowedUsers || undefined,
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="agent-telegram-timeout" className="text-sm font-medium">
                  Response Timeout (seconds)
                </label>
                <input
                  id="agent-telegram-timeout"
                  type="number"
                  min={60}
                  max={3600}
                  value={messagingDraft.defaultTimeout}
                  disabled={saveMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({
                      ...d,
                      defaultTimeout: Math.max(60, Math.min(3600, Number(e.target.value) || 600)),
                    }))
                  }
                  onBlur={() => {
                    const val = Math.max(60, Math.min(3600, messagingDraft.defaultTimeout));
                    setMessagingDraft((d) => ({ ...d, defaultTimeout: val }));
                    if (val !== ((telegram?.defaultTimeout as number) ?? 600)) {
                      saveTelegram({ defaultTimeout: val });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  How long this agent waits for a reply (60–3600 seconds, default 600).
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
