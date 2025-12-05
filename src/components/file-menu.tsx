import { getCurrentWindow } from "@tauri-apps/api/window";
// import { File, FolderOpen } from "lucide-react";
import { LogOut, Plus, Save } from "lucide-react";
import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "@/components/ui/button";

export function FileMenu({ addNewBlock }: { addNewBlock: () => void }) {
  const appWindow = getCurrentWindow();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs px-2 gap-1 font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* <File className="w-3 h-3" /> */}
        File
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-40 bg-popover border border-border rounded-md shadow-md z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-1">
            <button
              type="button"
              className="w-full text-left flex items-center px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => {
                addNewBlock();
                setIsOpen(false);
              }}
            >
              <Plus className="w-3 h-3 mr-2" />
              New Note
            </button>
            {/* <button
                type="button"
                className="w-full text-left flex items-center px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <FolderOpen className="w-3 h-3 mr-2" />
                Open File
              </button> */}
            <button
              type="button"
              className="w-full text-left flex items-center px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Save className="w-3 h-3 mr-2" />
              Save
            </button>

            <div className="h-[1.5px] bg-border my-1 -mx-1" />

            <button
              type="button"
              className="w-full text-left flex items-center px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors text-destructive hover:text-destructive"
              onClick={() => appWindow.close()}
            >
              <LogOut className="w-3 h-3 mr-2" />
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
