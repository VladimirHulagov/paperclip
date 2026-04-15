import type {
  InstanceExperimentalSettings,
  InstanceGeneralSettings,
  InstanceMessagingSettings,
  PatchInstanceGeneralSettings,
  PatchInstanceExperimentalSettings,
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
  getMessaging: () =>
    api.get<InstanceMessagingSettings>("/instance/settings/messaging"),
  updateMessaging: (patch: MessagingSettings) =>
    api.patch<InstanceMessagingSettings>("/instance/settings/messaging", patch),
};
