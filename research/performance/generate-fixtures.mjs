import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CASES, fixture, dimensions } from "./fixtures.mjs";
const directory = resolve("research/performance/runs/fixtures");
mkdirSync(directory, { recursive: true });
for (const name of CASES) {
  const source = fixture(name);
  writeFileSync(resolve(directory, `${name}.md`), source, { flag: "wx" });
  console.log(name, dimensions(source));
}
