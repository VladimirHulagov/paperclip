import { z } from "zod";
import { DEFAULT_FEEDBACK_DATA_SHARING_PREFERENCE } from "../types/feedback.js";
import {
  DAILY_RETENTION_PRESETS,
  WEEKLY_RETENTION_PRESETS,
  MONTHLY_RETENTION_PRESETS,
  DEFAULT_BACKUP_RETENTION,
  DEFAULT_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS,
  MAX_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS,
  MIN_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS,
} from "../types/instance.js";
import { feedbackDataSharingPreferenceSchema } from "./feedback.js";

function presetSchema<T extends readonly number[]>(presets: T, label: string) {
  return z.number().refine(
    (v): v is T[number] => (presets as readonly number[]).includes(v),
    { message: `${label} must be one of: ${presets.join(", ")}` },
  );
}

export const backupRetentionPolicySchema = z.object({
  dailyDays: presetSchema(DAILY_RETENTION_PRESETS, "dailyDays").default(DEFAULT_BACKUP_RETENTION.dailyDays),
  weeklyWeeks: presetSchema(WEEKLY_RETENTION_PRESETS, "weeklyWeeks").default(DEFAULT_BACKUP_RETENTION.weeklyWeeks),
  monthlyMonths: presetSchema(MONTHLY_RETENTION_PRESETS, "monthlyMonths").default(DEFAULT_BACKUP_RETENTION.monthlyMonths),
});

export const instanceGeneralSettingsSchema = z.object({
  censorUsernameInLogs: z.boolean().default(false),
  keyboardShortcuts: z.boolean().default(false),
  feedbackDataSharingPreference: feedbackDataSharingPreferenceSchema.default(
    DEFAULT_FEEDBACK_DATA_SHARING_PREFERENCE,
  ),
  backupRetention: backupRetentionPolicySchema.default(DEFAULT_BACKUP_RETENTION),
  timezone: z.string().default("UTC"),
  timeFormat: z.enum(["12h", "24h"]).default("24h"),
}).strict();

export const patchInstanceGeneralSettingsSchema = instanceGeneralSettingsSchema.partial();

export const instanceExperimentalSettingsSchema = z.object({
  enableEnvironments: z.boolean().default(false),
  enableIsolatedWorkspaces: z.boolean().default(false),
  autoRestartDevServerWhenIdle: z.boolean().default(false),
  enableIssueGraphLivenessAutoRecovery: z.boolean().default(false),
  issueGraphLivenessAutoRecoveryLookbackHours: z
    .number()
    .int()
    .min(MIN_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS)
    .max(MAX_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS)
    .default(DEFAULT_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS),
}).strict();

export const patchInstanceExperimentalSettingsSchema = instanceExperimentalSettingsSchema.partial();

export const issueGraphLivenessAutoRecoveryRequestSchema = z.object({
  lookbackHours: z
    .number()
    .int()
    .min(MIN_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS)
    .max(MAX_ISSUE_GRAPH_LIVENESS_AUTO_RECOVERY_LOOKBACK_HOURS)
    .optional(),
}).strict();

export const messagingSettingsSchema = z.object({
  telegram: z.object({
    enabled: z.boolean().default(false),
    botToken: z.string().optional(),
    chatId: z.string().optional(),
    allowedUsers: z.string().optional(),
    defaultTimeout: z.number().min(60).max(3600).default(600),
  }).optional(),
}).strict();

export const patchMessagingSettingsSchema = messagingSettingsSchema;

export const skillsSyncSettingsSchema = z.object({
  repoUrl: z.string().default(""),
  branch: z.string().default("main"),
  path: z.string().default("skills/"),
  token: z.string().default(""),
  author: z.string().default("Orchestrator <orchestrator@hermes>"),
}).strict();

export const patchSkillsSyncSettingsSchema = skillsSyncSettingsSchema.partial();

export const dayOfWeekSchema = z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

export const workingHoursSchema = z.object({
  enabled: z.boolean().default(false),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").default("09:00"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format").default("18:00"),
  days: z.array(dayOfWeekSchema).min(0).default(["mon", "tue", "wed", "thu", "fri"]),
}).strict();

export const patchWorkingHoursSchema = workingHoursSchema.partial();

export type InstanceGeneralSettings = z.infer<typeof instanceGeneralSettingsSchema>;
export type PatchInstanceGeneralSettings = z.infer<typeof patchInstanceGeneralSettingsSchema>;
export type InstanceExperimentalSettings = z.infer<typeof instanceExperimentalSettingsSchema>;
export type PatchInstanceExperimentalSettings = z.infer<typeof patchInstanceExperimentalSettingsSchema>;
export type IssueGraphLivenessAutoRecoveryRequest = z.infer<
  typeof issueGraphLivenessAutoRecoveryRequestSchema
>;
export type MessagingSettings = z.infer<typeof messagingSettingsSchema>;
export type PatchMessagingSettings = z.infer<typeof patchMessagingSettingsSchema>;
export type SkillsSyncSettings = z.infer<typeof skillsSyncSettingsSchema>;
export type PatchSkillsSyncSettings = z.infer<typeof patchSkillsSyncSettingsSchema>;
export type WorkingHours = z.infer<typeof workingHoursSchema>;
export type PatchWorkingHours = z.infer<typeof patchWorkingHoursSchema>;
