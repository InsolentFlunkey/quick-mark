export type TableAlignment = "left" | "center" | "right";

export interface TableDefinition {
  readonly headers: readonly string[];
  readonly alignments: readonly TableAlignment[];
  readonly bodyRows: number;
}

export interface GeneratedTable {
  readonly markdown: string;
  readonly firstBodyCellOffset: number;
}

export interface TableInsertion {
  readonly content: string;
  readonly caret: number;
}

const delimiters: Record<TableAlignment, string> = {
  left: ":---",
  center: ":---:",
  right: "---:",
};

export function escapeTableCell(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
}

export function generateMarkdownTable(definition: TableDefinition): GeneratedTable {
  const columns = definition.headers.length;
  if (columns < 1 || columns > 20) throw new RangeError("Tables must have between 1 and 20 columns.");
  if (!Number.isInteger(definition.bodyRows) || definition.bodyRows < 1 || definition.bodyRows > 100) {
    throw new RangeError("Tables must have between 1 and 100 body rows.");
  }
  if (definition.alignments.length !== columns) throw new RangeError("Each column must have an alignment.");

  const header = `| ${definition.headers.map(escapeTableCell).join(" | ")} |`;
  const delimiter = `| ${definition.alignments.map((alignment) => delimiters[alignment]).join(" | ")} |`;
  const body = `| ${Array.from({ length: columns }, () => "").join(" | ")} |`;
  const markdown = [header, delimiter, ...Array.from({ length: definition.bodyRows }, () => body)].join("\n");
  return { markdown, firstBodyCellOffset: header.length + delimiter.length + 4 };
}

export function insertMarkdownTable(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  table: GeneratedTable,
): TableInsertion {
  const start = Math.max(0, Math.min(selectionStart, selectionEnd, content.length));
  const end = Math.max(start, Math.min(Math.max(selectionStart, selectionEnd), content.length));
  const before = content.slice(0, start);
  const after = content.slice(end);
  const prefix = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const suffix = after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
  return {
    content: before + prefix + table.markdown + suffix + after,
    caret: before.length + prefix.length + table.firstBodyCellOffset,
  };
}
