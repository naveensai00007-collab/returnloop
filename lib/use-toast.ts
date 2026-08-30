"use client";

import * as React from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  action?: ToastAction;
  variant?: "default" | "success" | "error";
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let memoryToasts: ToastItem[] = [];
let listeners: ToastListener[] = [];

function notify() {
  listeners.forEach((listener) => listener([...memoryToasts]));
}

export function toast({
  title,
  description,
  action,
  variant = "default",
  duration = 5000,
}: Omit<ToastItem, "id">) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = {
    id,
    title,
    description,
    action,
    variant,
    duration,
  };

  memoryToasts = [newToast, ...memoryToasts].slice(0, 3);
  notify();

  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
}

export function dismissToast(id: string) {
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  notify();
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(memoryToasts);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: dismissToast,
  };
}
