"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// Single source of truth for non-blocking notifications. Replaces
// window.alert() / SuccessModal callsites.
//
//   const { toast } = useToast();
//   toast.success("Pedido actualizado");
//   toast.error("No se pudo guardar");

export type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastInput {
  variant?: ToastVariant;
  title?: string;
  description?: string;
  durationMs?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends Required<Pick<ToastInput, "durationMs">> {
  id: string;
  variant: ToastVariant;
  title?: string;
  description?: string;
  action?: ToastInput["action"];
}

const DEFAULT_DURATION = 4500;
const MAX_STACK = 3;

interface ToastApi {
  show: (input: ToastInput) => void;
  success: (msg: string, opts?: Omit<ToastInput, "variant" | "title">) => void;
  error: (msg: string, opts?: Omit<ToastInput, "variant" | "title">) => void;
  info: (msg: string, opts?: Omit<ToastInput, "variant" | "title">) => void;
  warning: (msg: string, opts?: Omit<ToastInput, "variant" | "title">) => void;
  dismiss: (id: string) => void;
}

interface ToastContextValue {
  toast: ToastApi;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

let idCounter = 0;
const nextId = () => `toast-${++idCounter}`;

// All toasts share the same neutral surface so they feel like a single family.
// Variant identity is carried by the icon color + an accent stripe on the left
// edge (via `before:` overlay), so success/error/info/warning are scannable
// without needing four different background tints.
const VARIANT_ACCENT: Record<ToastVariant, string> = {
  success:
    "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-success",
  error:
    "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-danger",
  info: "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-brand",
  warning:
    "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-warning",
};

const VARIANT_ICON_TEXT: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-brand",
  warning: "text-warning",
};

function VariantIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="m8 12 3 3 5-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 9v4m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v5m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [mounted, setMounted] = useState(false);

  // Standard SSR-safe portal gate: server renders without the portal, client
  // sets mounted on first paint so the toast viewport hydrates cleanly.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      const id = nextId();
      const item: ToastItem = {
        id,
        variant: input.variant ?? "info",
        title: input.title,
        description: input.description,
        durationMs: input.durationMs ?? DEFAULT_DURATION,
        action: input.action,
      };
      setItems((prev) => {
        const next = [...prev, item];
        return next.length > MAX_STACK ? next.slice(next.length - MAX_STACK) : next;
      });
      const timer = setTimeout(() => dismiss(id), item.durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (msg, opts) => show({ ...opts, variant: "success", title: msg }),
      error: (msg, opts) => show({ ...opts, variant: "error", title: msg }),
      info: (msg, opts) => show({ ...opts, variant: "info", title: msg }),
      warning: (msg, opts) => show({ ...opts, variant: "warning", title: msg }),
      dismiss,
    }),
    [show, dismiss]
  );

  const ctxValue = useMemo<ToastContextValue>(() => ({ toast: api }), [api]);

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="false"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-6 sm:right-6 sm:left-auto sm:items-end sm:px-0"
          >
            {items.map((item) => (
              <div
                key={item.id}
                role={item.variant === "error" || item.variant === "warning" ? "alert" : "status"}
                className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-lg border border-line-soft bg-white pl-5 pr-4 py-3 text-ink shadow-lg ${VARIANT_ACCENT[item.variant]}`}
              >
                <span className={`mt-0.5 shrink-0 ${VARIANT_ICON_TEXT[item.variant]}`}>
                  <VariantIcon variant={item.variant} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {item.title && (
                    <p className="text-[14px] font-semibold leading-5">{item.title}</p>
                  )}
                  {item.description && (
                    <p className="text-[13px] leading-5 text-ink-muted">{item.description}</p>
                  )}
                  {item.action && (
                    <button
                      type="button"
                      onClick={() => {
                        item.action?.onClick();
                        dismiss(item.id);
                      }}
                      className="mt-1 self-start text-[13px] font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xs"
                    >
                      {item.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Cerrar notificación"
                  className="-mr-1 -mt-1 shrink-0 rounded-xs p-1 text-ink-subtle hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="m3 3 8 8M11 3l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
