/**
 * useSystemStatus — polls system_status from the JL monitoring Supabase.
 * Used by StatusBanner to show proactive alerts when a service is down.
 * JackoLeeno JL — "كل كود صُنع بحب"
 */

import { useState, useEffect, useCallback } from "react";

// Monitoring lives on the FTM Supabase instance (centralized health data)
const MONITOR_URL  = process.env.NEXT_PUBLIC_MONITOR_URL || "https://huzekvothmihiljegmor.supabase.co/rest/v1/system_status";
const MONITOR_KEY  = process.env.NEXT_PUBLIC_MONITOR_KEY || "";

export type ServiceStatus = "ok" | "degraded" | "down" | "maintenance" | "unknown";

export interface SystemService {
  id: string;
  project: string;
  service_name: string;
  service_name_ar: string;
  status: ServiceStatus;
  etr_minutes: number | null;
  message: string | null;
  message_ar: string | null;
  last_check: string | null;
}

export function useSystemStatus(project?: string, interval = 30_000) {
  const [services, setServices] = useState<SystemService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        select: "id,project,service_name,service_name_ar,status,etr_minutes,message,message_ar,last_check",
      });
      if (project) params.append("project", `eq.${project}`);

      const res = await fetch(`${MONITOR_URL}?${params}`, {
        headers: {
          "apikey": MONITOR_KEY,
          "Authorization": `Bearer ${MONITOR_KEY}`,
          "Accept": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setServices(data as SystemService[]);
      }
    } catch {
      // fail silently
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, interval);
    return () => clearInterval(timer);
  }, [fetchStatus, interval]);

  const hasIssue    = services.some(s => s.status === "degraded" || s.status === "down");
  const hasCritical = services.some(s => s.status === "down");

  return { services, hasIssue, hasCritical, isLoading, refresh: fetchStatus };
}
