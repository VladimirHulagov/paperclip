import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { TimeFormat } from "@paperclipai/shared";
import { queryKeys } from "../lib/queryKeys";

interface TimeSettings {
  timezone: string;
  timeFormat: TimeFormat;
  formatDateTime: (date: Date | string) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
}

export function useTimeSettings(): TimeSettings {
  const queryClient = useQueryClient();
  const general = queryClient.getQueryData<{ timezone?: string; timeFormat?: TimeFormat }>(
    queryKeys.instance.generalSettings,
  );
  const timezone = general?.timezone ?? "UTC";
  const timeFormat = general?.timeFormat ?? "24h";
  const hour12 = timeFormat === "12h";

  const formatDateTime = useCallback(
    (date: Date | string) =>
      new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
        hour12,
      }),
    [timezone, hour12],
  );

  const formatDate = useCallback(
    (date: Date | string) =>
      new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: timezone,
      }),
    [timezone],
  );

  const formatTime = useCallback(
    (date: Date | string) =>
      new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12,
        timeZone: timezone,
      }),
    [timezone, hour12],
  );

  return { timezone, timeFormat, formatDateTime, formatDate, formatTime };
}
