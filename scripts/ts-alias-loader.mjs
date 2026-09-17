import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = join(process.cwd(), specifier.slice(2));
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}.js`, base]) {
      if (existsSync(candidate)) {
        return { shortCircuit: true, url: pathToFileURL(candidate).href };
      }
    }
  }
  return nextResolve(specifier, context);
}
