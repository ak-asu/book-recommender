"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Provider as ReduxProvider } from "react-redux";

import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { store } from "@/store";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <ReduxProvider store={store}>
      <ToastProvider>
        <HeroUIProvider navigate={router.push}>
          <NextThemesProvider {...themeProps}>
            <AuthProvider>{children}</AuthProvider>
          </NextThemesProvider>
        </HeroUIProvider>
      </ToastProvider>
    </ReduxProvider>
  );
}
