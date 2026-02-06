import React from "react";
import type { AppProps, AnyApp, WindowConstraints } from "@/apps/base/types";
import { assetPath } from "@/lib/utils";
import {
  appMetadata as finderMetadata,
  helpItems as finderHelpItems,
} from "@/apps/finder";
import {
  appMetadata as texteditMetadata,
  helpItems as texteditHelpItems,
} from "@/apps/textedit";
import {
  appMetadata as minesweeperMetadata,
  helpItems as minesweeperHelpItems,
} from "@/apps/minesweeper";
import {
  appMetadata as terminalMetadata,
  helpItems as terminalHelpItems,
} from "@/apps/terminal";
import {
  appMetadata as controlPanelsMetadata,
  helpItems as controlPanelsHelpItems,
} from "@/apps/control-panels";
import {
  appMetadata as stickiesMetadata,
  helpItems as stickiesHelpItems,
} from "@/apps/stickies";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyFinderApp = React.lazy<React.ComponentType<AppProps<any>>>(() =>
  import("@/apps/finder/components/FinderAppComponent").then((m) => ({
    default: m.FinderAppComponent,
  }))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyTextEditApp = React.lazy<React.ComponentType<AppProps<any>>>(() =>
  import("@/apps/textedit/components/TextEditAppComponent").then((m) => ({
    default: m.TextEditAppComponent,
  }))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyMinesweeperApp = React.lazy<React.ComponentType<AppProps<any>>>(() =>
  import("@/apps/minesweeper/components/MinesweeperAppComponent").then((m) => ({
    default: m.MinesweeperAppComponent,
  }))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyTerminalApp = React.lazy<React.ComponentType<AppProps<any>>>(() =>
  import("@/apps/terminal/components/TerminalAppComponent").then((m) => ({
    default: m.TerminalAppComponent,
  }))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyControlPanelsApp = React.lazy<React.ComponentType<AppProps<any>>>(
  () =>
    import(
      "@/apps/control-panels/components/ControlPanelsAppComponent"
    ).then((m) => ({
      default: m.ControlPanelsAppComponent,
    }))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LazyStickiesApp = React.lazy<React.ComponentType<AppProps<any>>>(() =>
  import("@/apps/stickies/components/StickiesAppComponent").then((m) => ({
    default: m.StickiesAppComponent,
  }))
);

export const appRegistry: Record<string, AnyApp> = {
  finder: {
    id: "finder",
    name: "Finder",
    icon: { type: "image", src: assetPath(finderMetadata.icon) },
    description: "File manager with Quick Access",
    component: LazyFinderApp as unknown as React.ComponentType<AppProps>,
    helpItems: finderHelpItems,
    metadata: finderMetadata,
    windowConfig: {
      defaultSize: { width: 650, height: 475 },
      minSize: { width: 400, height: 300 },
    } as WindowConstraints,
  },
  textedit: {
    id: "textedit",
    name: "TextEdit",
    icon: { type: "image", src: assetPath(texteditMetadata.icon) },
    description: "Rich text editor",
    component: LazyTextEditApp as unknown as React.ComponentType<AppProps>,
    helpItems: texteditHelpItems,
    metadata: texteditMetadata,
    windowConfig: {
      defaultSize: { width: 430, height: 475 },
      minSize: { width: 300, height: 200 },
    } as WindowConstraints,
  },
  minesweeper: {
    id: "minesweeper",
    name: "Minesweeper",
    icon: { type: "image", src: assetPath(minesweeperMetadata.icon) },
    description: "Classic minesweeper game",
    component: LazyMinesweeperApp as unknown as React.ComponentType<AppProps>,
    helpItems: minesweeperHelpItems,
    metadata: minesweeperMetadata,
    windowConfig: {
      defaultSize: { width: 305, height: 400 },
      minSize: { width: 305, height: 400 },
    } as WindowConstraints,
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    icon: { type: "image", src: assetPath(terminalMetadata.icon) },
    description: "Command-line interface",
    component: LazyTerminalApp as unknown as React.ComponentType<AppProps>,
    helpItems: terminalHelpItems,
    metadata: terminalMetadata,
    windowConfig: {
      defaultSize: { width: 600, height: 400 },
      minSize: { width: 400, height: 300 },
    } as WindowConstraints,
  },
  "control-panels": {
    id: "control-panels",
    name: "Control Panels",
    icon: { type: "image", src: assetPath(controlPanelsMetadata.icon) },
    description: "System preferences",
    component:
      LazyControlPanelsApp as unknown as React.ComponentType<AppProps>,
    helpItems: controlPanelsHelpItems,
    metadata: controlPanelsMetadata,
    windowConfig: {
      defaultSize: { width: 365, height: 415 },
      minSize: { width: 300, height: 300 },
    } as WindowConstraints,
  },
  stickies: {
    id: "stickies",
    name: "Stickies",
    icon: { type: "image", src: assetPath(stickiesMetadata.icon) },
    description: "Sticky notes",
    component: LazyStickiesApp as unknown as React.ComponentType<AppProps>,
    helpItems: stickiesHelpItems,
    metadata: stickiesMetadata,
    windowConfig: {
      defaultSize: { width: 500, height: 400 },
      minSize: { width: 300, height: 250 },
    } as WindowConstraints,
  },
};
