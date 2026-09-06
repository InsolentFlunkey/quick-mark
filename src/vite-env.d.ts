/// <reference types="vite/client" />

import type MarkdownIt from "markdown-it";

declare global {
  interface QuickMarkRenderer {
    render(markdown?: string, options?: { sourceMap?: boolean }): string;
  }

  interface QuickMarkMarkdownApi {
    createMarkdownRenderer(markdownIt: typeof MarkdownIt): QuickMarkRenderer;
    installCodeCopyHandler(
      eventRoot: Element | Document,
      notify?: (message: string) => void,
      feedbackDurationMs?: number,
    ): () => void;
  }

  interface QuickMarkEditorApi {
    isTabKey(event: KeyboardEvent): boolean;
    installMarkdownEditorBehavior(editor: HTMLTextAreaElement): () => void;
  }

  interface NavigatorUAData {
    readonly platform: string;
  }

  interface Navigator {
    readonly userAgentData?: NavigatorUAData;
  }

  var QuickMarkMarkdown: QuickMarkMarkdownApi;
  var QuickMarkEditor: QuickMarkEditorApi;
}
