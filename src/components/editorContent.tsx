import { markdown } from "@codemirror/lang-markdown";
// import { oneDark } from "@codemirror/theme-one-dark";
// import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { xcodeDark, xcodeLight } from "@uiw/codemirror-theme-xcode";
import CodeMirror from "@uiw/react-codemirror";
import { Archive, ArchiveRestore, ChevronDown, ChevronRight, Eye, Trash2 } from "lucide-react";
import { useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import type { RenderBlockAsLines } from "@/types";
import { wikiLinkPlugin } from "@/utils/wiki-link-extension";

const EditorContent = ({
  block,
  toggleCollapse,
  updateBlockTitle,
  openPreviewModal,
  deleteBlock,
  updateBlockContent,
  toggleArchive,
  isArchived,
  onNavigate,
}: RenderBlockAsLines) => {
  const { theme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div class="flex-1">
      <div class="">
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
            // disabled={isArchived}
          />

          <div class="flex items-center opacity-0 group-hover:opacity-100 group-hover/line:opacity-100 transition-opacity duration-200 pr-4">
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
              onClick={() => toggleArchive(block.id)}
              class="h-4 px-1 text-muted-foreground hover:text-foreground text-xs hover:bg-muted"
              title={isArchived ? "Unarchive" : "Archive"}
            >
              {isArchived ? (
                <ArchiveRestore class="w-3 h-3 mr-1" />
              ) : (
                <Archive class="w-3 h-3 mr-1" />
              )}
              {isArchived ? "Unarchive" : "Archive"}
            </Button>

            {showDeleteConfirm ? (
              <div class="flex items-center gap-1 ml-1 bg-background/80 backdrop-blur-sm rounded-sm border border-border/50 px-1">
                <span class="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                  Sure?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteBlock(block.id)}
                  class="h-3 px-1 text-destructive hover:bg-destructive/10 text-[10px] font-bold"
                >
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  class="h-3 px-1 text-muted-foreground hover:text-foreground text-[10px]"
                >
                  No
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                class="h-4 px-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
              >
                <Trash2 class="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {!block.isCollapsed && (
          <div class="codemirror-wrapper">
            <CodeMirror
              key={`${block.id}-${theme}`}
              value={block.content}
              onChange={(value: string) => updateBlockContent(block.id, value)}
              extensions={[markdown(), wikiLinkPlugin(onNavigate)]}
              // theme={theme === "dark" ? oneDark : xcodeLight}
              theme={theme === "dark" ? xcodeDark : xcodeLight}
              // theme={theme === "dark" ? githubDark : githubLight}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: false,
                highlightActiveLine: false,
                foldGutter: false,
                // lineWrapping: true,
              }}
              placeholder="Write something..."
              className="codemirror-editor"
              // editable={!isArchived}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorContent;
