import { invoke } from "@tauri-apps/api/core";
import { Eye, Plus, Trash2 } from "lucide-react";
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

  const addNewBlock = () => {
    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      title: "New Block",
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

  const renderContent = (content: string, isPreviewMode: boolean, blockId: string) => {
    if (isPreviewMode) {
      const htmlContent = marked.parse(content) as string;
      return (
        <div
          class="prose prose-sm max-w-none dark:prose-invert"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Markdown content is safe as it's user-controlled
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }
    return (
      <textarea
        class="w-full min-h-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={content}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          updateBlockContent(blockId, target.value);
        }}
        placeholder="Write your notes here..."
      />
    );
  };

  return (
    <main class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">Zen Notes</h1>
          <p class="text-gray-600 dark:text-gray-400">
            Your personal note-taking app with markdown preview
          </p>
        </div>

        {blocks.map((block) => (
          <Card key={block.id} class="w-full">
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between">
                <Input
                  value={block.title}
                  onInput={(e) => {
                    const target = e.target as HTMLInputElement;
                    updateBlockTitle(block.id, target.value);
                  }}
                  class="border-none bg-transparent text-lg font-medium text-gray-900 dark:text-white focus:ring-0 p-0 flex-1"
                  placeholder="Block title..."
                />
                <div class="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => togglePreview(block.id)}>
                    <Eye class="h-4 w-4 mr-2" />
                    {block.isPreviewMode ? "Edit" : "Preview"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBlock(block.id)}
                    class="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderContent(block.content, block.isPreviewMode, block.id)}</CardContent>
          </Card>
        ))}

        <Card class="w-full border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <CardContent class="flex items-center justify-center py-12">
            <Button onClick={addNewBlock} variant="outline" class="text-lg px-8 py-4 h-auto">
              <Plus class="h-5 w-5 mr-2" />
              Add New Block
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default App;
