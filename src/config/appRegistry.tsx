import React from "react";
import type { AppProps, AnyApp, WindowConstraints } from "@/apps/base/types";
import {
  appMetadata as finderMetadata,
  helpItems as finderHelpItems,
} from "@/apps/finder";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyFinderApp = React.lazy<React.ComponentType<AppProps<any>>>(() =>
  import("@/apps/finder/components/FinderAppComponent").then((m) => ({
    default: m.FinderAppComponent,
  }))
);

export const appRegistry: Record<string, AnyApp> = {
  finder: {
    id: "finder",
    name: "Finder",
    icon: { type: "image", src: finderMetadata.icon },
    description: "File manager with Quick Access",
    component: LazyFinderApp as unknown as React.ComponentType<AppProps>,
    helpItems: finderHelpItems,
    metadata: finderMetadata,
    windowConfig: {
      defaultSize: { width: 650, height: 475 },
      minSize: { width: 400, height: 300 },
    } as WindowConstraints,
  },
};
