import { X } from "lucide-react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import type { PreviewModalProps } from "@/types";

const PreviewModal = ({ previewModal, closePreviewModal }: PreviewModalProps) => {
  return (
    <>
      {previewModal.isOpen && (
        <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div class="bg-background w-full h-full flex flex-col">
            {/* Modal Header */}
            <div class="flex items-center justify-between p-6 border-b border-border/40">
              <h2 class="text-2xl font-bold text-foreground tracking-tight">
                {previewModal.title || "Preview"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePreviewModal}
                class="text-muted-foreground hover:text-foreground"
              >
                <X class="w-6 h-6" />
              </Button>
            </div>

            {/* Modal Content */}
            <div class="flex-1 overflow-auto p-6">
              <div
                class="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: marked.parse(previewModal.content) as string }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreviewModal;
