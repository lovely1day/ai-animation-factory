"use client";

/**
 * StatusBanner — proactive service health alert banner
 * Shows automatically when any JL service is degraded or down.
 * JackoLeeno JL — نُبلّغ قبل أن يسألنا المستخدم
 */

import { useState } from "react";
import { AlertTriangle, XCircle, X } from "lucide-react";
import { useSystemStatus } from "@/hooks/useSystemStatus";

interface StatusBannerProps {
  project?: string;
  lang?: "ar" | "en";
  className?: string;
}

export function StatusBanner({ project, lang = "ar", className = "" }: StatusBannerProps) {
  const isAr = lang === "ar";
  const { services, hasIssue, isLoading } = useSystemStatus(project);
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (isLoading || !hasIssue) return null;

  const affected = services.filter(
    s => (s.status === "degraded" || s.status === "down") && !dismissed.includes(s.id)
  );

  if (affected.length === 0) return null;

  return (
    <div className={`w-full space-y-1 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      {affected.map(svc => {
        const isDown    = svc.status === "down";
        const name      = isAr ? (svc.service_name_ar || svc.service_name) : svc.service_name;
        const customMsg = isAr ? svc.message_ar : svc.message;
        const etr       = svc.etr_minutes;

        const defaultMsg = isDown
          ? (isAr
              ? `خدمة "${name}" غير متاحة حالياً — نعمل على الإصلاح${etr ? ` · ETR: ${etr} دقيقة` : ""}`
              : `"${name}" is temporarily unavailable — we're working on it${etr ? ` · ETR: ${etr} min` : ""}`)
          : (isAr
              ? `خدمة "${name}" تعاني من بطء مؤقت${etr ? ` · ETR: ${etr} دقيقة` : ""}`
              : `"${name}" is experiencing slowness${etr ? ` · ETR: ${etr} min` : ""}`);

        const msg = customMsg || defaultMsg;

        return (
          <div
            key={svc.id}
            className={`flex items-start gap-2 px-4 py-2 text-sm rounded-lg ${
              isDown
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"
            }`}
          >
            {isDown
              ? <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            }
            <span className="flex-1">{msg}</span>
            <button
              type="button"
              onClick={() => setDismissed(prev => [...prev, svc.id])}
              className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
