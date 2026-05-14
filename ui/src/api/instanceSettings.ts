import type {
  InstanceExperimentalSettings,
  InstanceGeneralSettings,
  InstanceMessagingSettings,
  IssueGraphLivenessAutoRecoveryPreview,
  PatchInstanceGeneralSettings,
  PatchInstanceExperimentalSettings,
  WorkingHours,
  PatchWorkingHours,
} from "@paperclipai/shared";
import type { MessagingSettings } from "@paperclipai/shared";
import { api } from "./client";

export const instanceSettingsApi = {
  getGeneral: () =>
    api.get<InstanceGeneralSettings>("/instance/settings/general"),
  updateGeneral: (patch: PatchInstanceGeneralSettings) =>
    api.patch<InstanceGeneralSettings>("/instance/settings/general", patch),
  getExperimental: () =>
    api.get<InstanceExperimentalSettings>("/instance/settings/experimental"),
  updateExperimental: (patch: PatchInstanceExperimentalSettings) =>
    api.patch<InstanceExperimentalSettings>("/instance/settings/experimental", patch),
  previewIssueGraphLivenessAutoRecovery: (input: { lookbackHours?: number }) =>
    api.post<IssueGraphLivenessAutoRecoveryPreview>(
      "/instance/settings/experimental/issue-graph-liveness-auto-recovery/preview",
      input,
    ),
  runIssueGraphLivenessAutoRecovery: (input: { lookbackHours?: number }) =>
    api.post<{
      findings: number;
      autoRecoveryEnabled: boolean;
      lookbackHours: number;
      cutoff: string;
      escalationsCreated: number;
      existingEscalations: number;
      skipped: number;
      skippedAutoRecoveryDisabled: number;
      skippedOutsideLookback: number;
      escalationIssueIds: string[];
    }>(
      "/instance/settings/experimental/issue-graph-liveness-auto-recovery/run",
      input,
    ),
  getMessaging: () =>
    api.get<InstanceMessagingSettings>("/instance/settings/messaging"),
  updateMessaging: (patch: MessagingSettings) =>
    api.patch<InstanceMessagingSettings>("/instance/settings/messaging", patch),
  getWorkingHours: () =>
    api.get<WorkingHours>("/instance/settings/working-hours"),
  updateWorkingHours: (patch: PatchWorkingHours) =>
    api.patch<WorkingHours>("/instance/settings/working-hours", patch),
};
