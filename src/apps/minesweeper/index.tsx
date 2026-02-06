export const appMetadata = {
  name: "Minesweeper",
  version: "1.0.0",
  creator: { name: "Ryo Lu", url: "https://ryo.lu" },
  github: "https://github.com/ryokun6/ryos",
  icon: "/icons/default/minesweeper.png",
};

export const helpItems = [
  {
    icon: "🖱️",
    title: "Reveal Cells",
    description: "Left-click to reveal a cell",
  },
  {
    icon: "🚩",
    title: "Flag Mines",
    description: "Right-click to flag suspected mines",
  },
  {
    icon: "🔢",
    title: "Number Clues",
    description: "Numbers show how many adjacent mines exist",
  },
  {
    icon: "🏆",
    title: "Win Condition",
    description: "Reveal all non-mine cells to win",
  },
];
