'use client';

import { Toast, ToastViewport, ToastProvider, ToastAction } from '@/components/ui/Toast';
import { useToast } from '@/hooks/use-toast';
import { ReactNode } from 'react';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <div className="text-sm font-semibold">{title}</div>}
              {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            {action && <ToastAction altText={action.altText} onClick={action.onClick}>{action.children}</ToastAction>}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

export function ToasterWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}