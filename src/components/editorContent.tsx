import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
// import { oneDark } from "@codemirror/theme-one-dark";
// import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { xcodeDark, xcodeLight } from "@uiw/codemirror-theme-xcode";
import CodeMirror from "@uiw/react-codemirror";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Eye,
  Hash,
  Trash2,
  X,
} from "lucide-react";
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
  updateBlockTags,
  toggleArchive,
  isArchived,
  onNavigate,
}: RenderBlockAsLines) => {
  const { theme } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = block.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        updateBlockTags(block.id, [...currentTags, newTag.trim()]);
      }
      setNewTag("");
      setIsAddingTag(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = block.tags || [];
    updateBlockTags(
      block.id,
      currentTags.filter((tag) => tag !== tagToRemove),
    );
  };

  // Generate a consistent color for a tag
  const getTagColor = (tag: string) => {
    const colors = [
      "text-red-500 bg-red-500/10 border-red-500/20",
      "text-orange-500 bg-orange-500/10 border-orange-500/20",
      "text-amber-500 bg-amber-500/10 border-amber-500/20",
      "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      "text-lime-500 bg-lime-500/10 border-lime-500/20",
      "text-green-500 bg-green-500/10 border-green-500/20",
      "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      "text-teal-500 bg-teal-500/10 border-teal-500/20",
      "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
      "text-sky-500 bg-sky-500/10 border-sky-500/20",
      "text-blue-500 bg-blue-500/10 border-blue-500/20",
      "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      "text-violet-500 bg-violet-500/10 border-violet-500/20",
      "text-purple-500 bg-purple-500/10 border-purple-500/20",
      "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
      "text-pink-500 bg-pink-500/10 border-pink-500/20",
      "text-rose-500 bg-rose-500/10 border-rose-500/20",
    ];

    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex-1">
      <div className="flex items-center h-5 leading-5 group/line">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleCollapse(block.id)}
          className="h-4 w-4 p-0 mr-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {block.isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>

        {/* Task Progress Indicator */}
        {(() => {
          const totalTasks = (block.content.match(/- \[[ x]\]/g) || []).length;
          const completedTasks = (block.content.match(/- \[x\]/g) || []).length;

          if (totalTasks > 0) {
            return (
              <div
                className={`mr-2 text-[10px] font-mono px-1 rounded-sm border ${
                  completedTasks === totalTasks
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-muted text-muted-foreground border-border"
                }`}
                title={`${completedTasks} of ${totalTasks} tasks completed`}
              >
                {completedTasks}/{totalTasks}
              </div>
            );
          }
          return null;
        })()}

        <input
          value={block.title}
          onInput={async (e) => {
            const target = e.target as HTMLInputElement;
            await updateBlockTitle(block.id, target.value);
          }}
          className="border-none bg-transparent text-sm font-medium text-foreground focus:outline-none flex-1 placeholder:text-muted-foreground/50 font-mono h-5 leading-5 transition-colors min-w-[100px]"
          placeholder="Block title..."
          // disabled={isArchived}
        />

        {/* Tags Display */}
        <div className="flex items-center gap-1 mx-2 overflow-hidden group/tags">
          {block.tags?.map((tag) => (
            <div
              key={tag}
              className={`flex items-center px-1 rounded-sm border text-[10px] font-medium ${getTagColor(tag)} group/tag cursor-default`}
            >
              {/* <span className="mr-0.5">#</span> */}
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hidden group-hover/tag:inline-flex hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {isAddingTag ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newTag}
                onInput={(e) => setNewTag((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag();
                  if (e.key === "Escape") setIsAddingTag(false);
                }}
                onBlur={() => {
                  if (newTag) handleAddTag();
                  setIsAddingTag(false);
                }}
                autoFocus
                className="w-24 h-5 text-xs bg-background border border-input rounded-sm px-1.5 focus:outline-none placeholder:text-muted-foreground/50 shadow-sm transition-all"
                placeholder="New label..."
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingTag(true)}
              className="ml-3 h-4 w-4 p-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 group-hover/line:opacity-100 transition-opacity"
              title="Add label"
            >
              <Hash className="w-3 h-3 mr-1" />
            </Button>
          )}
        </div>

        <div className="flex items-center opacity-0 group-hover:opacity-100 group-hover/line:opacity-100 transition-opacity duration-200 pr-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openPreviewModal(block.content, block.title)}
            className="h-4 px-1 text-muted-foreground hover:text-foreground text-xs hover:bg-muted"
          >
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleArchive(block.id)}
            className="h-4 px-1 text-muted-foreground hover:text-foreground text-xs hover:bg-muted"
            title={isArchived ? "Unarchive" : "Archive"}
          >
            {isArchived ? (
              <ArchiveRestore className="w-3 h-3 mr-1" />
            ) : (
              <Archive className="w-3 h-3 mr-1" />
            )}
            {isArchived ? "Unarchive" : "Archive"}
          </Button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 ml-1 bg-background/80 backdrop-blur-sm rounded-sm border border-border/50 px-1">
              <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                Sure?
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBlock(block.id)}
                className="h-3 px-1 text-destructive hover:bg-destructive/10 text-[10px] font-bold"
              >
                Yes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-3 px-1 text-muted-foreground hover:text-foreground text-[10px]"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-4 px-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {!block.isCollapsed && (
        <div className="codemirror-wrapper">
          <CodeMirror
            key={`${block.id}-${theme}`}
            value={block.content}
            onChange={(value: string) => updateBlockContent(block.id, value)}
            extensions={[markdown(), wikiLinkPlugin(onNavigate), EditorView.lineWrapping]}
            // theme={theme === "dark" ? oneDark : xcodeLight}
            theme={theme === "dark" ? xcodeDark : xcodeLight}
            // theme={theme === "dark" ? githubDark : githubLight}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: false,
              highlightActiveLine: false,
              foldGutter: false,
              lineWrapping: true,
            }}
            placeholder="Write something..."
            className="codemirror-editor"
            // editable={!isArchived}
          />
        </div>
      )}
    </div>
  );
};

export default EditorContent;
