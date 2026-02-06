interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  helpItems: Array<{ icon: string; title: string; description: string }>;
}

export function HelpDialog({
  isOpen,
  onOpenChange,
  helpItems,
}: HelpDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Help</h2>
        <div className="space-y-3">
          {helpItems.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
}
