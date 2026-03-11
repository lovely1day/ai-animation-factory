'use client';
import * as React from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
  open?: boolean;
}

type ToastState = {
  toasts: Toast[];
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(toasts: Toast[]) {
  memoryState = { toasts };
  listeners.forEach((l) => l(memoryState));
}

export function toast({ title, description, variant = 'default', action }: Omit<Toast, 'id'>) {
  const id = genId();
  const newToast: Toast = { id, title, description, variant, action, open: true };

  dispatch([newToast, ...memoryState.toasts].slice(0, TOAST_LIMIT));

  setTimeout(() => {
    dispatch(memoryState.toasts.filter((t) => t.id !== id));
  }, TOAST_REMOVE_DELAY);

  return id;
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { toasts: state.toasts, toast };
}
