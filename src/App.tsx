import { invoke } from "@tauri-apps/api/core";
import { Edit3, Eye, FileText, Plus, Trash2 } from "lucide-react";
import { marked } from "marked";
import { useEffect, useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface NoteBlock {
  id: string;
  title: string;
  content: string;
  isPreviewMode: boolean;
}

function App() {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);

  // Load notes on app start
  useEffect(() => {
    loadNotes();
  }, []);

  // Save notes whenever blocks change
  useEffect(() => {
    if (blocks.length > 0) {
      saveNotes();
    }
  }, [blocks]);

  const loadNotes = async () => {
    try {
      const loadedBlocks = await invoke<NoteBlock[]>("load_notes");
      setBlocks(loadedBlocks);
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  };

  const saveNotes = async () => {
    try {
      await invoke("save_notes", { notes: blocks });
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  const addNewBlock = () => {
    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      title: "",
      content: "",
      isPreviewMode: false,
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlockTitle = (id: string, title: string) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, title } : block)));
  };

  const updateBlockContent = (id: string, content: string) => {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, content } : block)));
  };

  const togglePreview = (id: string) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, isPreviewMode: !block.isPreviewMode } : block,
      ),
    );
  };

  const deleteBlock = async (id: string) => {
    try {
      const updatedBlocks = await invoke<NoteBlock[]>("delete_block", {
        notes: blocks,
        blockId: id,
      });
      setBlocks(updatedBlocks);
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const renderContent = (content: string, isPreviewMode: boolean, blockId: string) => {
    if (isPreviewMode) {
      const htmlContent = marked.parse(content) as string;
      return (
        <div
          class="prose prose-sm max-w-none dark:prose-invert min-h-[300px] p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content is safe as it's user-controlled
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }
    return (
      <textarea
        class="w-full min-h-[300px] p-4 border-0 bg-transparent text-gray-900 dark:text-gray-100 resize-none focus:outline-none font-mono text-sm leading-relaxed"
        value={content}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          updateBlockContent(blockId, target.value);
        }}
        placeholder="Start writing your notes here... Use markdown for formatting!"
      />
    );
  };

  return (
    <div class="h-screen w-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* App Title Bar */}
      <div class="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center space-x-3">
          <FileText class="w-6 h-6 text-blue-600" />
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Zen Notes</h1>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {blocks.length} {blocks.length === 1 ? "note" : "notes"}
          </span>
          <Button onClick={addNewBlock} size="sm">
            <Plus class="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div class="flex-1 overflow-auto">
        {blocks.length === 0 ? (
          <div class="flex flex-col items-center justify-center h-full text-center px-6">
            <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6">
              <FileText class="w-10 h-10 text-gray-400" />
            </div>
            <h3 class="text-2xl font-medium text-gray-900 dark:text-white mb-3">
              Welcome to Zen Notes
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-8 text-lg max-w-md">
              Create your first note to get started with your personal note-taking experience
            </p>
            <Button onClick={addNewBlock} size="lg">
              <Plus class="w-5 h-5 mr-2" />
              Create First Note
            </Button>
          </div>
        ) : (
          <div class="p-6 space-y-6">
            {blocks.map((block) => (
              <Card
                key={block.id}
                class="group hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700"
              >
                <CardHeader class="pb-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3 flex-1">
                      <Edit3 class="w-5 h-5 text-gray-400" />
                      <Input
                        value={block.title}
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement;
                          updateBlockTitle(block.id, target.value);
                        }}
                        class="border-none bg-transparent text-xl font-medium text-gray-900 dark:text-white focus:ring-0 p-0 flex-1 placeholder:text-gray-400"
                        placeholder="Untitled note..."
                      />
                    </div>
                    <div class="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePreview(block.id)}
                        class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        <Eye class="w-4 h-4 mr-2" />
                        {block.isPreviewMode ? "Edit" : "Preview"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlock(block.id)}
                        class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent class="pt-0">
                  {renderContent(block.content, block.isPreviewMode, block.id)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
