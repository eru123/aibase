import { useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet, X } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  subject?: string;
}

type ViewMode = "desktop" | "tablet" | "mobile";

const DEVICE_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
};

export function EmailPreviewModal({
  isOpen,
  onClose,
  htmlContent,
  subject,
}: EmailPreviewModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [scale, setScale] = useState(1);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !containerEl) return;

    const calculateScale = () => {
      const container = containerEl;
      const padding = 64; // p-8 total
      const availableWidth = container.clientWidth - padding;
      const availableHeight = container.clientHeight - padding;

      const device = DEVICE_SIZES[viewMode];

      // For desktop, we might want to fill more naturally,
      // but let's treat it as a 1200px wide "target" for consistency if the modal is small.
      const targetWidth = viewMode === "desktop" ? 1150 : device.width;
      const targetHeight = viewMode === "desktop" ? 800 : device.height;

      const scaleW = availableWidth / targetWidth;
      const scaleH = availableHeight / targetHeight;

      const newScale = Math.min(scaleW, scaleH, 1);
      setScale(newScale);
    };

    calculateScale();
    const observer = new ResizeObserver(calculateScale);
    observer.observe(containerEl);

    return () => observer.disconnect();
  }, [isOpen, viewMode, containerEl]);

  return (
    <Modal show={isOpen} onClose={onClose} xl maxWidth="1280px">
      <div className="flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-start gap-4 border-b pb-2 px-1">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Email Preview
            </h3>
            {subject && (
              <p className="text-xs text-gray-500 truncate max-w-[400px]">
                Subject: {subject}
              </p>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2" />

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode("desktop")}
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  viewMode === "desktop"
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
                )}
                title="Desktop View"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("tablet")}
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  viewMode === "tablet"
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
                )}
                title="Tablet View"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={cn(
                  "p-2 rounded-md transition-all duration-200",
                  viewMode === "mobile"
                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
                )}
                title="Mobile View"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          ref={setContainerEl}
          className="flex-1 bg-gray-100/50 overflow-hidden relative flex items-center justify-center p-8"
        >
          <div
            className={cn(
              "bg-white shadow-2xl transition-all duration-300 origin-center border border-gray-200 shrink-0 overflow-hidden",
              viewMode === "mobile" &&
                "rounded-[2.5rem] border-[12px] border-gray-900 ring-4 ring-gray-800/20 overflow-hidden",
              viewMode === "tablet" &&
                "rounded-[2rem] border-[12px] border-gray-900 ring-4 ring-gray-800/20 overflow-hidden",
              viewMode === "desktop" && "rounded-lg",
            )}
            style={{
              width:
                viewMode === "desktop"
                  ? "1150px"
                  : `${DEVICE_SIZES[viewMode].width}px`,
              height:
                viewMode === "desktop"
                  ? "800px"
                  : `${DEVICE_SIZES[viewMode].height}px`,
              transform: `scale(${scale})`,
            }}
          >
            <iframe
              title="Email Preview"
              srcDoc={htmlContent}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-same-origin"
            />
          </div>

          {/* Zoom/Scale Indicator */}
          {scale < 1 && (
            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-2 py-1 rounded border text-[10px] font-medium text-gray-500">
              Scaled to {Math.round(scale * 100)}%
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
