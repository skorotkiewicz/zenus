export interface NoteBlock {
  id: string;
  title: string;
  content: string;
  isCollapsed: boolean;
  order: number;
  tags: string[];
}

export interface PreviewModalProps {
  previewModal: { isOpen: boolean; content: string; title: string };
  closePreviewModal: () => void;
}

export interface NewBlock {
  id: string;
  title: string;
  content: string;
  isCollapsed: boolean;
  tags: string[];
}

export interface RenderBlockAsLines {
  block: NoteBlock;
  toggleCollapse: (id: string) => void;
  updateBlockTitle: (id: string, title: string) => void;
  openPreviewModal: (content: string, title: string) => void;
  deleteBlock: (id: string) => void;
  updateBlockContent: (id: string, content: string) => void;
  toggleArchive: (id: string) => void;
  updateBlockTags: (id: string, tags: string[]) => void;
  isArchived: boolean;
  onNavigate: (title: string) => void;
  lines: string[];
}
