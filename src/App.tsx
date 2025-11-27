import { Snowflake } from "@skorotkiewicz/snowflake-id";
import { invoke } from "@tauri-apps/api/core";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "preact/hooks";
import EditorContent from "@/components/editorContent";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import PreviewModal from "./components/previewModal";
import type { NoteBlock } from "./types";

function App() {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [snowflake] = useState(() => new Snowflake(1)); // machine ID 1
  const endBlocksRef = useRef<HTMLDivElement>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    content: string;
    title: string;
  }>({
    isOpen: false,
    content: "",
    title: "",
  });

  // Load notes on app start
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const loadedBlocks = await invoke<NoteBlock[]>("load_notes");
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const saveBlock = async (block: NoteBlock) => {
    try {
      await invoke("save_block", { block });
    } catch (error) {
      console.error("Failed to save block:", error);
    }
  };

  const addNewBlock = async () => {
    try {
      const id = await snowflake.generate();
      const newBlock: NoteBlock = {
        id: id.toString(),
        title: "",
        content: "",
        isCollapsed: false,
      };
      setBlocks([...blocks, newBlock]);
      await saveBlock(newBlock);

      // Scroll to the new block after it's added
      if (endBlocksRef.current) {
        endBlocksRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    } catch (error) {
      console.error("Failed to create new block:", error);
    }
  };

  const updateBlockTitle = async (id: string, title: string) => {
    const updatedBlocks = blocks.map((block) => (block.id === id ? { ...block, title } : block));
    setBlocks(updatedBlocks);
    const updatedBlock = updatedBlocks.find((block) => block.id === id);
    if (updatedBlock) {
      await saveBlock(updatedBlock);
    }
  };

  const updateBlockContent = async (id: string, content: string) => {
    const updatedBlocks = blocks.map((block) => (block.id === id ? { ...block, content } : block));
    setBlocks(updatedBlocks);
    const updatedBlock = updatedBlocks.find((block) => block.id === id);
    if (updatedBlock) {
      await saveBlock(updatedBlock);
    }
  };

  const toggleCollapse = async (id: string) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === id ? { ...block, isCollapsed: !block.isCollapsed } : block,
    );
    setBlocks(updatedBlocks);

    // Save the updated block to persist collapse state
    const updatedBlock = updatedBlocks.find((block) => block.id === id);
    if (updatedBlock) {
      await saveBlock(updatedBlock);
    }
  };

  const openPreviewModal = (content: string, title: string) => {
    setPreviewModal({
      isOpen: true,
      content,
      title,
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      content: "",
      title: "",
    });
  };

  const deleteBlock = async (id: string) => {
    try {
      await invoke("delete_block", { blockId: id });
      setBlocks(blocks.filter((block) => block.id !== id));
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const renderBlockAsLines = (block: NoteBlock) => {
    const lines = block.content.split("\n");
    const lineCount = block.isCollapsed ? 1 : lines.length; // +1 dla linii tytułu
    // const lineCount = block.isCollapsed ? 1 : lines.length + 1; // +1 dla linii tytułu

    return (
      <div class="bg-card group hover:bg-muted/30 transition-colors duration-200">
        <div class="flex">
          {/* Line Numbers */}
          <div class="NO_CALC_VARIABLES flex-shrink-0 bg-muted/30 px-3 py-2 text-right text-sm text-muted-foreground/60 font-mono border-r border-border/50 min-w-[50px] select-none">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} class="h-5 leading-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Editor Content */}
          <EditorContent
            block={block}
            toggleCollapse={toggleCollapse}
            updateBlockTitle={updateBlockTitle}
            openPreviewModal={openPreviewModal}
            deleteBlock={deleteBlock}
            updateBlockContent={updateBlockContent}
            lines={lines}
          />
        </div>
      </div>
    );
  };

  return (
    <div class="h-screen w-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* App Title Bar */}
      <div class="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="flex items-center space-x-3">
          <h1 class="text-xl font-semibold tracking-tight">Zen Notes</h1>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-muted-foreground font-medium">
            {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
          </span>
          <ModeToggle />
          <Button onClick={addNewBlock} size="sm" class="shadow-sm">
            <Plus class="w-4 h-4 mr-2" />
            New Block
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div class="flex-1 overflow-auto bg-gradient-to-b from-background to-muted/20">
        {blocks.length === 0 ? (
          <div class="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in zoom-in-95 duration-500">
            <div class="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Plus class="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 class="text-2xl font-semibold tracking-tight mb-2">Welcome to Zen Notes</h3>
            <p class="text-muted-foreground mb-8 text-lg max-w-md leading-relaxed">
              Your space for clarity and focus. Create your first block to get started.
            </p>
            <Button
              onClick={addNewBlock}
              size="lg"
              class="shadow-md hover:shadow-lg transition-all"
            >
              <Plus class="w-5 h-5 mr-2" />
              Create First Block
            </Button>
          </div>
        ) : (
          <div>
            <div class="bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden divide-y divide-border/50">
              {blocks.map((block) => (
                <div key={block.id}>{renderBlockAsLines(block)}</div>
              ))}
            </div>
          </div>
        )}
        <div ref={endBlocksRef} />
      </div>

      {/* Full Screen Preview Modal */}
      <PreviewModal previewModal={previewModal} closePreviewModal={closePreviewModal} />
    </div>
  );
}

export default App;
