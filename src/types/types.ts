export interface HelpItem {
  icon: string;
  title: string;
  description: string;
}

export interface AppMetadata {
  name: string;
  version: string;
  creator: { name: string; url: string };
  github: string;
  icon: string;
}
