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
        <div class="flex items-center h-5 leading-5 group/line">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCollapse(block.id)}
            class="h-4 w-4 p-0 mr-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {block.isCollapsed ? <ChevronRight class="w-3 h-3" /> : <ChevronDown class="w-3 h-3" />}
          </Button>
          <input
            value={block.title}
            onInput={async (e) => {
              const target = e.target as HTMLInputElement;
              await updateBlockTitle(block.id, target.value);
            }}
            class="border-none bg-transparent text-sm font-medium text-foreground focus:outline-none flex-1 placeholder:text-muted-foreground/50 font-mono h-5 leading-5 transition-colors"
            placeholder="Block title..."
          />

          {/* Actions - Visible on Group Hover */}
          <div class="flex items-center  opacity-0 group-hover:opacity-100 group-hover/line:opacity-100 transition-opacity duration-200 pr-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPreviewModal(block.content, block.title)}
              class="h-4 px-1 text-muted-foreground hover:text-foreground text-xs hover:bg-muted"
            >
              <Eye class="w-3 h-3 mr-1" />
              Preview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteBlock(block.id)}
              class="h-4 px-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <Trash2 class="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Content Lines - Line 2+ */}
        {!block.isCollapsed && (
          <textarea
            class="w-full bg-transparent text-foreground font-mono placeholder:text-muted-foreground/40"
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
