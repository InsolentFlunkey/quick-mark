(function (global) {
  "use strict";

  const indentText = "    ";

  function lineStartFor(value, position) {
    return value.lastIndexOf("\n", position - 1) + 1;
  }

  function lineEndFor(value, position) {
    const lineEnd = value.indexOf("\n", position);
    return lineEnd === -1 ? value.length : lineEnd;
  }

  function replaceEditorText(editor, value, replaceStart, replaceEnd, text, selectionStart, selectionEnd) {
    editor.value = value.substring(0, replaceStart) + text + value.substring(replaceEnd);
    editor.selectionStart = selectionStart;
    editor.selectionEnd = selectionEnd === undefined ? selectionStart : selectionEnd;
    const EventConstructor = editor.ownerDocument.defaultView.Event;
    editor.dispatchEvent(new EventConstructor("input", { bubbles: true }));
  }

  function handleSelectedLinesTab(editor, event, value, start, end, startLineStart, endLineEnd) {
    if (start === end || endLineEnd <= startLineStart) return false;
    const selectedLines = value.substring(startLineStart, endLineEnd).split("\n");
    const newText = selectedLines
      .map((line) => (event.shiftKey ? line.replace(/^ {1,4}/, "") : indentText + line))
      .join("\n");
    replaceEditorText(editor, value, startLineStart, endLineEnd, newText, startLineStart, startLineStart + newText.length);
    return true;
  }

  function outdentCurrentLine(editor, value, start, currentLineStart, currentLineEnd, currentLine) {
    const spaceMatch = currentLine.match(/^ {1,4}/);
    if (!spaceMatch) return;
    const removeLength = spaceMatch[0].length;
    const newLine = currentLine.substring(removeLength);
    const selection = Math.max(currentLineStart, start - removeLength);
    replaceEditorText(editor, value, currentLineStart, currentLineEnd, newLine, selection);
  }

  function indentedListPrefix(prefixMatch) {
    if (prefixMatch[4]) return prefixMatch[1] + indentText + "1. ";
    return prefixMatch[1] + indentText + prefixMatch[3];
  }

  function indentListPrefix(editor, value, start, currentLineStart, currentLineEnd, currentLine) {
    const prefixMatch = currentLine.match(/^(\s*)(([-*+]\s+)|(\d+)\.\s+)/);
    if (!prefixMatch || start > currentLineStart + prefixMatch[0].length) return false;
    const newPrefix = indentedListPrefix(prefixMatch);
    const afterPrefix = currentLine.substring(prefixMatch[0].length);
    replaceEditorText(editor, value, currentLineStart, currentLineEnd, newPrefix + afterPrefix, currentLineStart + newPrefix.length);
    return true;
  }

  function handleTabKey(editor, event) {
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    const startLineStart = lineStartFor(value, start);
    const endLineEnd = lineEndFor(value, end);
    if (handleSelectedLinesTab(editor, event, value, start, end, startLineStart, endLineEnd)) return;
    const currentLineEnd = lineEndFor(value, start);
    const currentLine = value.substring(startLineStart, currentLineEnd);
    if (event.shiftKey) {
      outdentCurrentLine(editor, value, start, startLineStart, currentLineEnd, currentLine);
      return;
    }
    if (indentListPrefix(editor, value, start, startLineStart, currentLineEnd, currentLine)) return;
    replaceEditorText(editor, value, start, end, indentText, start + indentText.length);
  }

  function prefixForNextLine(match) {
    if (match[2]) return match[1] + match[2];
    if (match[3]) return match[1] + (Number.parseInt(match[3], 10) + 1) + ". ";
    return match[1];
  }

  function handleEnterKey(editor, event) {
    const start = editor.selectionStart;
    const value = editor.value;
    const currentLineStart = lineStartFor(value, start);
    const currentLine = value.substring(currentLineStart, start);
    const match = currentLine.match(/^(\s*)(?:([-*+]\s+)|(\d+)\.\s+)?/);
    if (!match || !match[0]) return;
    event.preventDefault();
    const prefix = match[0];
    if (prefix.trim().length > 0 && prefix === currentLine) {
      replaceEditorText(editor, value, currentLineStart, start, "\n", currentLineStart + 1);
      return;
    }
    const newPrefix = prefixForNextLine(match);
    replaceEditorText(editor, value, start, start, "\n" + newPrefix, start + 1 + newPrefix.length);
  }

  function installMarkdownEditorBehavior(editor) {
    if (!editor) throw new TypeError("An editor element is required");
    let allowFocusExit = false;
    const handleKeydown = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Escape") {
        allowFocusExit = true;
        return;
      }
      if (event.key === "Tab" && allowFocusExit) {
        allowFocusExit = false;
        return;
      }
      allowFocusExit = false;
      if (event.key === "Tab") {
        handleTabKey(editor, event);
        return;
      }
      if (event.key === "Enter") handleEnterKey(editor, event);
    };
    editor.addEventListener("keydown", handleKeydown);
    return () => editor.removeEventListener("keydown", handleKeydown);
  }

  global.QuickMarkEditor = Object.freeze({ installMarkdownEditorBehavior });
})(globalThis);
