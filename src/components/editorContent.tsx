import { ChevronDown, ChevronRight, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RenderBlockAsLines } from "@/types";

const EditorContent = ({
  block,
  toggleCollapse,
  updateBlockTitle,
  openPreviewModal,
  deleteBlock,
  updateBlockContent,
  lines,
}: RenderBlockAsLines) => {
  return (
    <div class="flex-1">
      <div class="">
        {/* <div class="p-2"> */}
        {/* First Line with Buttons */}
        <div class="flex items-center h-5 leading-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCollapse(block.id)}
            class="h-4 w-4 p-0 mr-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {block.isCollapsed ? <ChevronRight class="w-3 h-3" /> : <ChevronDown class="w-3 h-3" />}
          </Button>
          <input
            value={block.title}
            onInput={async (e) => {
              const target = e.target as HTMLInputElement;
              await updateBlockTitle(block.id, target.value);
            }}
            class="border-none bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none flex-1 placeholder:text-gray-400 font-mono h-5 leading-5"
            placeholder="Block title..."
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPreviewModal(block.content, block.title)}
            class="h-4 px-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xs hover:bg-gray-200 dark:hover:bg-gray-700 mr-1"
          >
            <Eye class="w-3 h-3 mr-1" />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteBlock(block.id)}
            class="h-4 px-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 text-xs"
          >
            <Trash2 class="w-3 h-3" />
          </Button>
        </div>

        {/* Content Lines - Line 2+ */}
        {!block.isCollapsed && (
          <textarea
            class="w-full bg-transparent text-gray-900 dark:text-gray-100 font-mono"
            value={block.content}
            onInput={async (e) => {
              const target = e.target as HTMLTextAreaElement;
              await updateBlockContent(block.id, target.value);
            }}
            placeholder="Main block content..."
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              height: `${lines.length * 20}px`,
              padding: "0",
              margin: "0",
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              boxSizing: "border-box",
              direction: "ltr",
              textAlign: "left",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EditorContent;
