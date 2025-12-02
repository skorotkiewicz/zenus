import {
  DragDropContext,
  Draggable,
  type DraggableProvided,
  Droppable,
  type DroppableProvided,
} from "@hello-pangea/dnd";
import { Snowflake } from "@skorotkiewicz/snowflake-id";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Archive, ArchiveRestore, Minus, Plus, Search, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "preact/hooks";
import EditorContent from "@/components/editorContent";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import PreviewModal from "./components/previewModal";
import type { NoteBlock } from "./types";

function App() {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [showArchived, setShowArchived] = useState(false);

  // Load notes on app start and when showArchived changes
  useEffect(() => {
    loadNotes();
  }, [showArchived]);

  const filteredBlocks = blocks.filter(
    (block) =>
      block.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const loadNotes = async () => {
    try {
      const subdir = showArchived ? "archive" : null;
      const loadedBlocks = await invoke<NoteBlock[]>("load_notes", { subdir });
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const saveBlock = async (block: NoteBlock) => {
    // setSaveStatus("saving");
    try {
      await invoke("save_block", { block });
      // setTimeout(() => setSaveStatus("idle"), 100);
    } catch (error) {
      console.error("Failed to save block:", error);
      setSaveStatus("error");
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
        order: blocks.length,
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
      const subdir = showArchived ? "archive" : null;
      await invoke("delete_block", { blockId: id, subdir });
      setBlocks(blocks.filter((block) => block.id !== id));
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const toggleArchive = async (id: string) => {
    try {
      const command = showArchived ? "unarchive_block" : "archive_block";
      await invoke(command, { blockId: id });
      setBlocks(blocks.filter((block) => block.id !== id));
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  };

  const appWindow = getCurrentWindow();

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col selection:bg-primary/20 border border-border/50 rounded-lg overflow-hidden">
      {/* App Title Bar */}
      <div className="sticky top-0 z-50 flex items-center h-10 px-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 select-none">
        {/* Left Side - Draggable Title */}
        <div data-tauri-drag-region className="flex items-center space-x-3 flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              saveStatus === "saving"
                ? "bg-yellow-500 animate-pulse"
                : saveStatus === "error"
                  ? "bg-red-500"
                  : "bg-primary/20" // idle state
            }`}
          />
        </div>

        {/* Flexible Spacer - Draggable */}
        <div data-tauri-drag-region className="flex-1 h-full" />

        {/* Right Side - Interactive Controls */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-muted/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-ring transition-colors h-7"
            />
          </div>

          <div className="h-4 w-[1px] bg-border/50 mx-2" />

          <ModeToggle />

          <Button
            onClick={addNewBlock}
            size="sm"
            className="h-7 text-xs shadow-sm px-2"
            disabled={showArchived}
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>

          <Button
            variant={showArchived ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs shadow-sm px-2"
            onClick={() => setShowArchived(!showArchived)}
            title={showArchived ? "Show Active Notes" : "Show Archived Notes"}
          >
            {showArchived ? (
              <ArchiveRestore className="w-3 h-3 mr-1" />
            ) : (
              <Archive className="w-3 h-3 mr-1" />
            )}
            {showArchived ? "Archived" : "Archive"}
          </Button>

          <div className="h-4 w-[1px] bg-border/50 mx-2" />

          {/* Window Actions */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={() => appWindow.minimize()}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted"
              onClick={() => appWindow.toggleMaximize()}
            >
              <Square className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => appWindow.close()}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-background to-muted/20">
        {blocks.length === 0 ? (
          showArchived ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Archive className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-2">Archive is Empty</h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md leading-relaxed">
                No archived notes found.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Plus className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight mb-2">Welcome to Zen Notes</h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md leading-relaxed">
                Your space for clarity and focus. Create your first block to get started.
              </p>
              <Button
                onClick={addNewBlock}
                size="lg"
                className="shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Block
              </Button>
            </div>
          )
        ) : (
          <div>
            <DragDropContext
              onDragEnd={async (result) => {
                if (!result.destination) return;

                const items = Array.from(blocks);
                const [reorderedItem] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, reorderedItem);

                // Recalculate orders
                const updatedItems = items.map((item, index) => ({
                  ...item,
                  order: index,
                }));

                setBlocks(updatedItems);

                // Save new order to backend
                // setSaveStatus("saving");
                try {
                  const orders = updatedItems.map(
                    (item) => [item.id, item.order] as [string, number],
                  );
                  await invoke("update_orders", { orders });
                  // setTimeout(() => setSaveStatus("idle"), 100);
                } catch (error) {
                  console.error("Failed to update orders:", error);
                  setSaveStatus("error");
                }
              }}
            >
              <Droppable droppableId="blocks">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-card border border-border/50 shadow-sm overflow-hidden divide-y divide-border/50"
                  >
                    {filteredBlocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided: DraggableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={provided.draggableProps.style as any}
                            className="bg-card group hover:bg-muted/30 transition-colors duration-200"
                          >
                            <div className="flex">
                              {/* Drag Handle */}
                              <div
                                {...(provided.dragHandleProps as any)}
                                className="cursor-grab active:cursor-grabbing flex-shrink-0 bg-muted/30 px-3 py-2 text-sm text-muted-foreground/60 font-mono border-r border-border/50 min-w-[30px] select-none flex items-center justify-center"
                                title="Drag to reorder"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <title>Drag handle</title>
                                  <circle cx="9" cy="12" r="1" />
                                  <circle cx="9" cy="5" r="1" />
                                  <circle cx="9" cy="19" r="1" />
                                  <circle cx="15" cy="12" r="1" />
                                  <circle cx="15" cy="5" r="1" />
                                  <circle cx="15" cy="19" r="1" />
                                </svg>
                              </div>

                              {/* Editor Content */}
                              <EditorContent
                                block={block}
                                toggleCollapse={toggleCollapse}
                                updateBlockTitle={updateBlockTitle}
                                openPreviewModal={openPreviewModal}
                                deleteBlock={deleteBlock}
                                updateBlockContent={updateBlockContent}
                                toggleArchive={toggleArchive}
                                isArchived={showArchived}
                                lines={block.content.split("\n")}
                              />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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
