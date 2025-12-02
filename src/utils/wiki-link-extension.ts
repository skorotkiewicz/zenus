import {
  Decoration,
  type DecorationSet,
  type EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

export const wikiLinkPlugin = (onNavigate: (title: string) => void) => {
  const decorator = new MatchDecorator({
    regexp: /\[\[([^\]]+)\]\]/g,
    decoration: (match) => {
      const title = match[1];
      return Decoration.mark({
        class:
          "cm-wiki-link cursor-pointer text-primary underline decoration-primary/50 hover:decoration-primary",
        attributes: {
          "data-title": title,
          title: `Go to ${title}`,
        },
      });
    },
  });

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = decorator.updateDeco(update, this.decorations);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
      eventHandlers: {
        mousedown: (e) => {
          const target = e.target as HTMLElement;
          if (target.matches(".cm-wiki-link") || target.closest(".cm-wiki-link")) {
            const link = target.matches(".cm-wiki-link") ? target : target.closest(".cm-wiki-link");
            const title = (link as HTMLElement).getAttribute("data-title");
            if (title) {
              e.preventDefault();
              onNavigate(title);
            }
          }
        },
      },
    },
  );
};
