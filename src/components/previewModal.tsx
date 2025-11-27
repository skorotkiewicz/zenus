import { X } from "lucide-react";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import type { PreviewModalProps } from "@/types";

const PreviewModal = ({ previewModal, closePreviewModal }: PreviewModalProps) => {
  return (
    <>
      {previewModal.isOpen && (
        <div class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div class="bg-white dark:bg-gray-900 w-full h-full flex flex-col">
            {/* Modal Header */}
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {previewModal.title || "Preview"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePreviewModal}
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
