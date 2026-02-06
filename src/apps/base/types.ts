import React from "react";

export interface AppProps<TInitialData = unknown> {
  isWindowOpen: boolean;
  onClose: () => void;
  isForeground: boolean;
  instanceId: string;
  skipInitialSound: boolean;
  initialData?: TInitialData;
}

export interface WindowConstraints {
  defaultSize: { width: number; height: number };
  minSize: { width: number; height: number };
}

export interface AppIcon {
  type: "image";
  src: string;
}

export interface AnyApp {
  id: string;
  name: string;
  icon: AppIcon;
  description: string;
  component: React.ComponentType<AppProps>;
  helpItems: Array<{ icon: string; title: string; description: string }>;
  metadata: {
    name: string;
    version: string;
    creator: { name: string; url: string };
    github: string;
    icon: string;
  };
  windowConfig: WindowConstraints;
}
