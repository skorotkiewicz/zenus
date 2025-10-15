import { Snowflake } from "@skorotkiewicz/snowflake-id";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, ChevronRight, Eye, Plus, Trash2, X } from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "preact/hooks";
import { Button } from "@/components/ui/button";

interface NoteBlock {
  id: string;
  title: string;
  content: string;
  isCollapsed: boolean;
}

function App() {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [snowflake] = useState(() => new Snowflake(1)); // machine ID 1
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

  const toggleCollapse = (id: string) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, isCollapsed: !block.isCollapsed } : block,
      ),
    );
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
    // When collapsed, show only 1 line. When expanded, show actual content length with minimum of 5
    const lineCount = block.isCollapsed ? 1 : Math.max(lines.length, 5);

    return (
      <div class="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <div class="flex">
          {/* Line Numbers */}
          <div class="flex-shrink-0 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-right text-sm text-gray-500 dark:text-gray-400 font-mono border-r border-gray-300 dark:border-gray-600 min-w-[50px]">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} class="h-5 leading-5 select-none">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Editor Content */}
          <div class="flex-1">
            <div class="p-2">
              {/* First Line with Buttons */}
              <div class="flex items-center h-5 leading-5 mb-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCollapse(block.id)}
                  class="h-4 w-4 p-0 mr-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {block.isCollapsed ? (
                    <ChevronRight class="w-3 h-3" />
                  ) : (
                    <ChevronDown class="w-3 h-3" />
                  )}
                </Button>
                <input
                  value={block.title}
                  onInput={async (e) => {
                    const target = e.target as HTMLInputElement;
                    await updateBlockTitle(block.id, target.value);
                  }}
                  class="border-none bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none flex-1 placeholder:text-gray-400 font-mono"
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

              {/* Content Lines */}
              {!block.isCollapsed && (
                <div class="mt-2">
                  <textarea
                    class="w-full border-0 bg-transparent text-gray-900 dark:text-gray-100 resize-none focus:outline-none font-mono text-sm leading-5"
                    value={block.content}
                    onInput={async (e) => {
                      const target = e.target as HTMLTextAreaElement;
                      await updateBlockContent(block.id, target.value);
                    }}
                    placeholder="   Linia 2: po kliknieciu na zwiń block, nie bedzie widać tego tekstu.&#10;Linia 3: ani tego&#10;Linia 4: [rozwin block btn] -------- a tutaj mam zawiniete -------- [preview btn] [remove btn]"
                    style={{
                      lineHeight: "20px",
                      fontFamily:
                        'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                      height: `${Math.max(lines.length, 5) * 20}px`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div class="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* App Title Bar */}
      <div class="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center space-x-3">
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Zen Notes</h1>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
          </span>
          <Button onClick={addNewBlock} size="sm">
            <Plus class="w-4 h-4 mr-2" />
            New Block
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div class="flex-1 overflow-auto">
        {blocks.length === 0 ? (
          <div class="flex flex-col items-center justify-center h-full text-center px-6">
            <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6">
              <Plus class="w-10 h-10 text-gray-400" />
            </div>
            <h3 class="text-2xl font-medium text-gray-900 dark:text-white mb-3">
              Welcome to Zen Notes
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-md">
              Create your first block to get started
            </p>
            <Button onClick={addNewBlock} size="lg">
              <Plus class="w-5 h-5 mr-2" />
              Create First Block
            </Button>
          </div>
        ) : (
          <div class="p-6 space-y-4">
            {blocks.map((block) => (
              <div key={block.id}>{renderBlockAsLines(block)}</div>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Preview Modal */}
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
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content is safe as it's user-controlled
                dangerouslySetInnerHTML={{ __html: marked.parse(previewModal.content) as string }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
