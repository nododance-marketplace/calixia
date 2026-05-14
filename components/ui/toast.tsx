"use client";

import * as React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "success" | "danger";
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...input }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[92vw] max-w-sm -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-surface p-4 shadow-2xl animate-slide-up",
              t.variant === "success"
                ? "border-success/40"
                : t.variant === "danger"
                  ? "border-danger/40"
                  : "border-border",
            )}
          >
            <div className="mt-0.5">
              {t.variant === "danger" ? (
                <AlertCircle className="h-4 w-4 text-danger" />
              ) : t.variant === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-xs text-text-secondary">{t.description}</p> : null}
            </div>
            <button
              type="button"
              className="text-text-secondary hover:text-text-primary"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
