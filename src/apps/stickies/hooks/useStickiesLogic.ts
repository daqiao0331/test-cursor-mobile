import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeStore } from "@/stores/useThemeStore";
import { helpItems } from "..";

type NoteColor = "yellow" | "pink" | "blue" | "green";

interface StickyNote {
  id: string;
  content: string;
  color: NoteColor;
}

let noteIdCounter = 0;

function createNote(color: NoteColor = "yellow"): StickyNote {
  noteIdCounter++;
  return {
    id: `note-${noteIdCounter}-${Date.now()}`,
    content: "",
    color,
  };
}

export function useStickiesLogic({
  instanceId,
}: {
  instanceId: string;
  isWindowOpen: boolean;
  isForeground: boolean;
}) {
  const { t } = useTranslation();
  const translatedHelpItems = useTranslatedHelpItems("stickies", helpItems);
  const currentTheme = useThemeStore((state) => state.current);
  const isXpTheme = currentTheme === "xp" || currentTheme === "win98";

  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [notes, setNotes] = useState<StickyNote[]>([
    createNote("yellow"),
  ]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleAddNote = useCallback((color: NoteColor = "yellow") => {
    const note = createNote(color);
    setNotes((prev) => [...prev, note]);
    setSelectedNoteId(note.id);
  }, []);

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    },
    [selectedNoteId]
  );

  const handleUpdateNote = useCallback((id: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, content } : n))
    );
  }, []);

  const handleChangeColor = useCallback((id: string, color: NoteColor) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, color } : n))
    );
  }, []);

  return {
    t,
    translatedHelpItems,
    isXpTheme,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    notes,
    selectedNoteId,
    setSelectedNoteId,
    handleAddNote,
    handleDeleteNote,
    handleUpdateNote,
    handleChangeColor,
    instanceId,
  };
}
