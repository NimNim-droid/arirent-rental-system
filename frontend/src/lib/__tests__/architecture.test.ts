import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(__dirname, "../..");

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function toPosixRelative(filePath: string): string {
  return path.relative(SRC_ROOT, filePath).split(path.sep).join("/");
}

describe("Frontend layered architecture", () => {
  const allFiles = walkFiles(SRC_ROOT);

  it("restricts axios usage strictly to lib/services, lib/axios.ts, and lib/errors.ts", () => {
    const allowed = new Set(["lib/axios.ts", "lib/errors.ts"]);
    const violations: string[] = [];

    for (const file of allFiles) {
      const rel = toPosixRelative(file);
      if (allowed.has(rel) || rel.startsWith("lib/services/") || rel.includes("__tests__/")) {
        continue;
      }

      const content = fs.readFileSync(file, "utf8");
      if (/from\s+["'](?:axios|@\/lib\/axios)["']/.test(content)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps route pages thin by preventing direct lib/services imports in src/pages", () => {
    const pageFiles = walkFiles(path.join(SRC_ROOT, "pages"));
    const violations: string[] = [];

    for (const file of pageFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (/from\s+["']@\/lib\/services\//.test(content)) {
        violations.push(toPosixRelative(file));
      }
    }

    expect(violations).toEqual([]);
  });

  it("has no unreachable dead files inside src/components/features", () => {
    function resolveImport(fromFile: string, specifier: string): string | null {
      let base: string;
      if (specifier.startsWith("@/")) {
        base = path.join(SRC_ROOT, specifier.slice(2));
      } else if (specifier.startsWith(".")) {
        base = path.resolve(path.dirname(fromFile), specifier);
      } else {
        return null;
      }

      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        path.join(base, "index.ts"),
        path.join(base, "index.tsx"),
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return path.resolve(candidate);
        }
      }

      return null;
    }

    const importGraph = new Map<
      string,
      Array<{ clause: string; target: string; isReExport: boolean }>
    >();

    for (const file of allFiles) {
      const src = fs.readFileSync(file, "utf8");
      const edges: Array<{ clause: string; target: string; isReExport: boolean }> = [];
      const staticRe = /(?:import|export)\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
      let match: RegExpExecArray | null;

      while ((match = staticRe.exec(src))) {
        const target = resolveImport(file, match[2]);
        if (target) {
          edges.push({
            clause: match[1].trim(),
            target,
            isReExport: match[0].startsWith("export"),
          });
        }
      }

      const dynamicRe = /import\(\s*["']([^"']+)["']\s*\)/g;
      while ((match = dynamicRe.exec(src))) {
        const target = resolveImport(file, match[1]);
        if (target) {
          edges.push({ clause: "*", target, isReExport: false });
        }
      }

      importGraph.set(file, edges);
    }

    const reachable = new Set<string>();
    const queue: string[] = [];
    const enqueue = (file: string) => {
      if (!reachable.has(file)) {
        reachable.add(file);
        queue.push(file);
      }
    };

    enqueue(path.join(SRC_ROOT, "main.tsx"));

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of importGraph.get(current) ?? []) {
        if (edge.isReExport) continue;

        const isBarrel =
          path.basename(edge.target) === "index.ts" &&
          edge.target.includes(`${path.sep}components${path.sep}`);

        if (isBarrel) {
          reachable.add(edge.target);
          const brace = edge.clause.match(/\{([\s\S]*?)\}/);
          const importedNames = brace
            ? brace[1]
                .split(",")
                .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
                .filter(Boolean)
            : ["*"];

          for (const reExp of importGraph.get(edge.target) ?? []) {
            if (!reExp.isReExport) continue;
            if (importedNames.includes("*") || reExp.clause === "*") {
              enqueue(reExp.target);
              continue;
            }
            const rBrace = reExp.clause.match(/\{([\s\S]*?)\}/);
            const exportedNames = rBrace
              ? rBrace[1]
                  .split(",")
                  .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()!.trim())
                  .filter(Boolean)
              : [];
            if (importedNames.some((name) => exportedNames.includes(name))) {
              enqueue(reExp.target);
            }
          }
        } else {
          enqueue(edge.target);
        }
      }
    }

    const deadFeatureFiles = walkFiles(path.join(SRC_ROOT, "components", "features"))
      .filter((file) => !reachable.has(file))
      .map(toPosixRelative);

    expect(deadFeatureFiles).toEqual([]);
  });
});
