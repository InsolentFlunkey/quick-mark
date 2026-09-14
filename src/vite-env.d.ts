/// <reference types="vite/client" />

import type MarkdownIt from "markdown-it";

declare global {
  interface QuickMarkRenderer {
    render(markdown?: string, options?: { sourceMap?: boolean }): string;
    fragmentIssues(markdown: string): { href: string; line: number }[];
  }

  interface QuickMarkMarkdownApi {
    decodeFragment(href: string): string | null;
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
