import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface HelpItem {
  icon: string;
  title: string;
  description: string;
}

export function useTranslatedHelpItems(appId: string, helpItems: HelpItem[]) {
  const { t } = useTranslation();

  return useMemo(() => {
    return helpItems.map((item) => {
      const key = item.title
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+(.)/g, (_, c: string) => c.toUpperCase())
        .replace(/^\w/, (c) => c.toLowerCase());

      const titleKey = `apps.${appId}.help.${key}.title`;
      const descKey = `apps.${appId}.help.${key}.description`;

      return {
        icon: item.icon,
        title: t(titleKey, { defaultValue: item.title }),
        description: t(descKey, { defaultValue: item.description }),
      };
    });
  }, [appId, helpItems, t]);
}
