"use client";

import * as React from "react";
import { X } from "lucide-react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const Toaster = () => {
  const { toasts } = useToast();

  return (
    <ToastPrimitives.Provider>
      <ToastPrimitives.Viewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
      {toasts.map(({ id, title, description, action, ...props }) => {
        return (
          <ToastPrimitives.Root
            key={id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
              props.variant === "destructive" &&
                "destructive group border-destructive bg-destructive text-destructive-foreground"
            )}
            {...props}
          >
            <div className="grid gap-1">
              {title && <ToastPrimitives.Title className="text-sm font-semibold">{title}</ToastPrimitives.Title>}
              {description && (
                <ToastPrimitives.Description className="text-sm opacity-90">
                  {description}
                </ToastPrimitives.Description>
              )}
            </div>
            {action}
            <ToastPrimitives.Close className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600">
              <X className="h-4 w-4" />
              <span className="sr-only">关闭</span>
            </ToastPrimitives.Close>
          </ToastPrimitives.Root>
        );
      })}
    </ToastPrimitives.Provider>
  );
};

export { Toaster };