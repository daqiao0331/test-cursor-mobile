import { cn } from "@/lib/utils";
import { Menubar } from "@/components/ui/menubar";

interface MenuBarProps {
  children: React.ReactNode;
  inWindowFrame?: boolean;
}

export function MenuBar({ children, inWindowFrame }: MenuBarProps) {
  return (
    <Menubar
      className={cn(
        "border-none rounded-none bg-transparent shadow-none h-auto p-0 space-x-0",
        inWindowFrame && "bg-white border-b border-gray-200"
      )}
    >
      {children}
    </Menubar>
  );
}
