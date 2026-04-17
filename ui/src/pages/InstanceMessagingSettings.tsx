import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

export function InstanceMessagingSettings() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings" },
      { label: "Messaging" },
    ]);
  }, [setBreadcrumbs]);

  const messagingQuery = useQuery({
    queryKey: queryKeys.instance.messagingSettings,
    queryFn: () => instanceSettingsApi.getMessaging(),
  });

  const updateMessagingMutation = useMutation({
    mutationFn: instanceSettingsApi.updateMessaging,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance.messagingSettings });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to update messaging settings.");
    },
  });

  const telegram = messagingQuery.data?.telegram;
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
    if (messagingQuery.data?.telegram) {
      setMessagingDraft({
        botToken: messagingQuery.data.telegram.botToken ?? "",
        chatId: messagingQuery.data.telegram.chatId ?? "",
        allowedUsers: messagingQuery.data.telegram.allowedUsers ?? "",
        defaultTimeout: messagingQuery.data.telegram.defaultTimeout ?? 600,
      });
    }
  }, [messagingQuery.data]);

  if (messagingQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading messaging settings...</div>;
  }

  if (messagingQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {messagingQuery.error instanceof Error
          ? messagingQuery.error.message
          : "Failed to load messaging settings."}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Messaging</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure messaging platforms for agent Q&A. Agents can ask clarifying questions and receive replies.
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
                updateMessagingMutation.mutate({
                  telegram: {
                    enabled: !telegramEnabled,
                    botToken: telegram?.botToken,
                    chatId: telegram?.chatId,
                    allowedUsers: telegram?.allowedUsers,
                    defaultTimeout: telegram?.defaultTimeout ?? 600,
                  },
                })
              }
              disabled={updateMessagingMutation.isPending}
              aria-label="Toggle Telegram Q&A"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enable Telegram Q&A to let agents ask clarifying questions via a Telegram bot and receive replies.
          </p>
          {telegramEnabled && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="telegram-bot-token" className="text-sm font-medium">
                  Bot Token
                </label>
                <input
                  id="telegram-bot-token"
                  type="password"
                  placeholder="From @BotFather"
                  value={messagingDraft.botToken}
                  disabled={updateMessagingMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({ ...d, botToken: e.target.value }))
                  }
                  onBlur={() => {
                    if (messagingDraft.botToken !== (telegram?.botToken ?? "")) {
                      updateMessagingMutation.mutate({
                        telegram: { ...telegram, enabled: true, botToken: messagingDraft.botToken || undefined },
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="telegram-chat-id" className="text-sm font-medium">
                  Chat ID
                </label>
                <input
                  id="telegram-chat-id"
                  type="text"
                  placeholder="-1001234567890"
                  value={messagingDraft.chatId}
                  disabled={updateMessagingMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({ ...d, chatId: e.target.value }))
                  }
                  onBlur={() => {
                    if (messagingDraft.chatId !== (telegram?.chatId ?? "")) {
                      updateMessagingMutation.mutate({
                        telegram: { ...telegram, enabled: true, chatId: messagingDraft.chatId || undefined },
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="telegram-allowed-users" className="text-sm font-medium">
                  Allowed Users
                </label>
                <input
                  id="telegram-allowed-users"
                  type="text"
                  placeholder="Comma-separated Telegram user IDs"
                  value={messagingDraft.allowedUsers}
                  disabled={updateMessagingMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({ ...d, allowedUsers: e.target.value }))
                  }
                  onBlur={() => {
                    if (messagingDraft.allowedUsers !== (telegram?.allowedUsers ?? "")) {
                      updateMessagingMutation.mutate({
                        telegram: { ...telegram, enabled: true, allowedUsers: messagingDraft.allowedUsers || undefined },
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="telegram-timeout" className="text-sm font-medium">
                  Response Timeout (seconds)
                </label>
                <input
                  id="telegram-timeout"
                  type="number"
                  min={60}
                  max={3600}
                  value={messagingDraft.defaultTimeout}
                  disabled={updateMessagingMutation.isPending}
                  onChange={(e) =>
                    setMessagingDraft((d) => ({
                      ...d,
                      defaultTimeout: Math.max(60, Math.min(3600, Number(e.target.value) || 600)),
                    }))
                  }
                  onBlur={() => {
                    const val = Math.max(60, Math.min(3600, messagingDraft.defaultTimeout));
                    setMessagingDraft((d) => ({ ...d, defaultTimeout: val }));
                    if (val !== (telegram?.defaultTimeout ?? 600)) {
                      updateMessagingMutation.mutate({
                        telegram: { ...telegram, enabled: true, defaultTimeout: val },
                      });
                    }
                  }}
                  className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  How long agents wait for a reply (60–3600 seconds, default 600).
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
