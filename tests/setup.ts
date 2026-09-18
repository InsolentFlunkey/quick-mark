// CodeMirror measures DOM ranges while focusing and drawing selections. jsdom
// does not implement these geometry methods, so provide neutral rectangles for
// integration tests that do not assert layout.
if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}
if (typeof Range !== "undefined" && !Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () => new DOMRect();
}
