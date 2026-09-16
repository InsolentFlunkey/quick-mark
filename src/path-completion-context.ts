export interface CompletionContext {
  start: number;
  end: number;
  directory: string;
  prefix: string;
  image: boolean;
  angled: boolean;
}

/** Encode a filename as one URL segment, including Markdown delimiters. */
export function encodePathSegment(name: string) {
  return encodeURIComponent(name).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function escaped(text: string, index: number) {
  let count = 0;
  while (index > 0 && text[--index] === "\\") count++;
  return count % 2 !== 0;
}

/** Conservative inline-link parser: never complete prose, titles or code. */
export function completionContext(source: string, caret: number, selectionEnd = caret): CompletionContext | null {
  if (caret !== selectionEnd || caret < 0 || caret > source.length) return null;
  const lineStart = source.lastIndexOf("\n", caret - 1) + 1;
  const before = source.slice(0, lineStart);
  let fence: { char: string; length: number } | null = null;
  let inlineRun = 0;
  for (const line of before.split("\n").slice(0, -1)) {
    const content = line.replace(/^ {0,3}(?:> ?)+/, "");
    const marker = content.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) { fence = { char: marker[1][0], length: marker[1].length }; inlineRun = 0; }
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
    } else if (!fence) {
      if (!content.trim()) { inlineRun = 0; continue; }
      for (const match of content.matchAll(/`+/g)) {
        if (escaped(content, match.index!)) continue;
        if (!inlineRun) inlineRun = match[0].length;
        else if (inlineRun === match[0].length) inlineRun = 0;
      }
    }
  }
  const line = source.slice(lineStart, source.indexOf("\n", caret) < 0 ? source.length : source.indexOf("\n", caret));
  if (fence || /^(?: {4}|\t| {0,3}(?:`{3,}|~{3,}))/.test(line)) return null;
  const position = caret - lineStart;
  const labels: number[] = [];
  for (let i = 0; i < position; i++) {
    if (inlineRun) {
      if (line[i] === "`") {
        const run = line.slice(i).match(/^`+/)![0];
        if (run.length === inlineRun) inlineRun = 0;
        i += run.length - 1;
      }
      continue;
    }
    if (escaped(line, i)) continue;
    if (line[i] === "`") {
      const run = line.slice(i).match(/^`+/)![0];
      let close = line.indexOf(run, i + run.length);
      while (close >= 0 && (line[close - 1] === "`" || line[close + run.length] === "`")) close = line.indexOf(run, close + run.length);
      if (close >= 0) {
        if (position <= close + run.length) return null;
        i = close + run.length - 1;
        continue;
      }
      // An unfinished code span is left alone while typing.
      return null;
    }
    if (line[i] === "[") labels.push(i);
    if (line[i] !== "]") continue;
    const label = labels.pop();
    if (label === undefined || line[i + 1] !== "(") continue;
    let start = i + 2;
    while (line[start] === " " || line[start] === "\t") start++;
    const angled = line[start] === "<";
    if (angled) start++;
    if (position < start) continue;
    let end = start;
    let depth = 0;
    for (; end < line.length; end++) {
      if (escaped(line, end)) continue;
      const char = line[end];
      if (char === "?" || char === "#") break;
      if (angled ? char === ">" : /\s/.test(char) || (char === ")" && depth === 0)) break;
      if (!angled && char === "(") depth++;
      if (!angled && char === ")") depth--;
    }
    if (position > end) { i = end; continue; }
    const raw = line.slice(start, position);
    if (/[?#]/.test(raw)) return null;
    // Decode Markdown punctuation escapes first, then URL encoding exactly once.
    const unescaped = raw.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, "$1");
    let decoded: string;
    try { decoded = decodeURIComponent(unescaped); } catch { return null; }
    if (/^(?:[\\/]|[a-z][a-z0-9+.-]*:)/i.test(decoded) || /[\u0000-\u001f\u007f]/.test(decoded)) return null;
    // Forward slashes are portable and match rendered resource references.
    if (decoded.includes("\\")) return null;
    const slash = decoded.lastIndexOf("/");
    const directory = decoded.slice(0, slash + 1).split("/").map(encodePathSegment).join("/");
    return { start: lineStart + start, end: lineStart + end, directory, angled,
      prefix: decoded.slice(slash + 1), image: label > 0 && line[label - 1] === "!" && !escaped(line, label - 1) };
  }
  return null;
}

/** Finish only this destination, retaining its fragment/title and following prose. */
export function completedFileEdit(source: string, context: CompletionContext, name: string) {
  let end = context.end;
  let suffix = "";
  if (source[end] === "#" || source[end] === "?") {
    const start = end;
    let depth = 0;
    for (; end < source.length; end++) {
      if (escaped(source, end)) continue;
      const char = source[end];
      if (/\s/.test(char) || (context.angled ? char === ">" : char === ")" && depth === 0)) break;
      if (char === "(") depth++;
      if (char === ")") depth--;
    }
    suffix += source.slice(start, end);
  }
  if (context.angled) {
    suffix += ">";
    if (source[end] === ">") end++;
  }
  const title = source.slice(end).match(/^[ \t]+(?:"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\((?:\\.|[^)\\\n])*\))/)?.[0];
  if (title) { suffix += title; end += title.length; }
  const closing = source.slice(end).match(/^[ \t]*\)/)?.[0];
  if (closing) { suffix += closing; end += closing.length; }
  else suffix += ")";
  return { end, text: context.directory + encodePathSegment(name) + suffix };
}
