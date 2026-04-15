import type { FeedbackDataSharingPreference } from "./feedback.js";

export type TimeFormat = "12h" | "24h";

export interface InstanceGeneralSettings {
  censorUsernameInLogs: boolean;
  keyboardShortcuts: boolean;
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  timezone: string;
  timeFormat: TimeFormat;
}

export interface InstanceExperimentalSettings {
  enableIsolatedWorkspaces: boolean;
  autoRestartDevServerWhenIdle: boolean;
}

export interface InstanceMessagingTelegramSettings {
  enabled: boolean;
  botToken?: string;
  chatId?: string;
  allowedUsers?: string;
  defaultTimeout: number;
}

export interface InstanceMessagingSettings {
  telegram?: InstanceMessagingTelegramSettings;
}

export interface InstanceSettings {
  id: string;
  general: InstanceGeneralSettings;
  experimental: InstanceExperimentalSettings;
  messaging: InstanceMessagingSettings;
  createdAt: Date;
  updatedAt: Date;
}
