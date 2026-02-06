import { assetPath } from "@/lib/utils";

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metadata: {
    name: string;
    version: string;
    creator: { name: string; url: string };
    icon: string;
  };
  appId: string;
}

export function AboutDialog({
  isOpen,
  onOpenChange,
  metadata,
}: AboutDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={assetPath(metadata.icon)}
          alt={metadata.name}
          className="w-16 h-16 mx-auto mb-3"
        />
        <h2 className="text-lg font-bold">{metadata.name}</h2>
        <p className="text-sm text-gray-500">Version {metadata.version}</p>
        <p className="text-sm text-gray-600 mt-2">
          by{" "}
          <a
            href={metadata.creator.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {metadata.creator.name}
          </a>
        </p>
        <button
          onClick={() => onOpenChange(false)}
          className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm w-full"
        >
          OK
        </button>
      </div>
    </div>
  );
}
