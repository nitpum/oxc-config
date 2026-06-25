import { describe, it, expect } from "vitest";
import { isGlobMatch, matchesAny } from "./glob";

describe("isGlobMatch - single segment", () => {
  it("matches exact names", () => {
    expect(isGlobMatch("index.ts", "index.ts")).toBe(true);
    expect(isGlobMatch("index.ts", "Index.ts")).toBe(false);
    expect(isGlobMatch("index.ts", "index.tsx")).toBe(false);
  });

  it("matches * within a segment (not crossing /)", () => {
    expect(isGlobMatch("*.ts", "app.ts")).toBe(true);
    expect(isGlobMatch("*.ts", "app.tsx")).toBe(false);
    expect(isGlobMatch("*.test.ts", "Button.test.ts")).toBe(true);
  });

  it("matches ? as a single char", () => {
    expect(isGlobMatch("?.ts", "a.ts")).toBe(true);
    expect(isGlobMatch("?.ts", "ab.ts")).toBe(false);
  });

  it("supports character classes", () => {
    expect(isGlobMatch("*.[jt]s", "app.js")).toBe(true);
    expect(isGlobMatch("*.[jt]s", "app.ts")).toBe(true);
    expect(isGlobMatch("*.[jt]s", "app.cs")).toBe(false);
  });

  it("supports negated character classes", () => {
    expect(isGlobMatch("*.[!t]s", "app.js")).toBe(true);
    expect(isGlobMatch("*.[!t]s", "app.ts")).toBe(false);
  });
});

describe("isGlobMatch - globstar", () => {
  it("matches ** alone against anything", () => {
    expect(isGlobMatch("**", "a.ts")).toBe(true);
    expect(isGlobMatch("**", "a/b/c.ts")).toBe(true);
  });

  it("matches trailing ** against a directory tree", () => {
    expect(isGlobMatch("src/**", "src")).toBe(true);
    expect(isGlobMatch("src/**", "src/a.ts")).toBe(true);
    expect(isGlobMatch("src/**", "src/sub/a.ts")).toBe(true);
    expect(isGlobMatch("src/**", "other/a.ts")).toBe(false);
    expect(isGlobMatch("src/**", "src2/a.ts")).toBe(false);
  });

  it("matches leading **/ from any depth", () => {
    expect(isGlobMatch("**/components/**", "components/Button.tsx")).toBe(true);
    expect(isGlobMatch("**/components/**", "src/components/Button.tsx")).toBe(true);
    expect(isGlobMatch("**/components/**", "src/a/components/b/c.tsx")).toBe(true);
    expect(isGlobMatch("**/components/**", "src/component/x.tsx")).toBe(false);
  });

  it("matches ** in the middle", () => {
    expect(isGlobMatch("src/**/index.ts", "src/index.ts")).toBe(true);
    expect(isGlobMatch("src/**/index.ts", "src/a/index.ts")).toBe(true);
    expect(isGlobMatch("src/**/index.ts", "src/a/b/index.ts")).toBe(true);
    expect(isGlobMatch("src/**/index.ts", "src/a/index.tsx")).toBe(false);
  });

  it("does not let * cross directory boundaries", () => {
    expect(isGlobMatch("src/*.ts", "src/a.ts")).toBe(true);
    expect(isGlobMatch("src/*.ts", "src/sub/a.ts")).toBe(false);
  });
});

describe("isGlobMatch - brace expansion", () => {
  it("expands {a,b} alternatives", () => {
    expect(isGlobMatch("*.{test,spec}.ts", "a.test.ts")).toBe(true);
    expect(isGlobMatch("*.{test,spec}.ts", "a.spec.ts")).toBe(true);
    expect(isGlobMatch("*.{test,spec}.ts", "a.ts")).toBe(false);
  });

  it("expands braces containing path segments", () => {
    expect(isGlobMatch("{src,app}/**", "src/a.ts")).toBe(true);
    expect(isGlobMatch("{src,app}/**", "app/a.ts")).toBe(true);
    expect(isGlobMatch("{src,app}/**", "lib/a.ts")).toBe(false);
  });
});

describe("isGlobMatch - absolute vs relative paths", () => {
  it("suffix-matches relative patterns against absolute filenames", () => {
    expect(isGlobMatch("src/components/**", "/home/me/project/src/components/Button.tsx")).toBe(true);
    expect(isGlobMatch("**/*.test.ts", "/home/me/project/src/a.test.ts")).toBe(true);
  });

  it("matches absolute patterns only from the root", () => {
    expect(isGlobMatch("/src/**", "/src/a.ts")).toBe(true);
    expect(isGlobMatch("/src/**", "/home/src/a.ts")).toBe(false);
  });

  it("normalizes backslashes", () => {
    expect(isGlobMatch("src/**", "src\\sub\\a.ts")).toBe(true);
  });

  it("ignores a leading ./ in patterns", () => {
    expect(isGlobMatch("./src/**", "src/a.ts")).toBe(true);
  });
});

describe("matchesAny", () => {
  it("returns true if any pattern matches", () => {
    expect(matchesAny(["src/**", "app/**"], "app/Button.tsx")).toBe(true);
    expect(matchesAny(["src/**", "app/**"], "lib/x.ts")).toBe(false);
    expect(matchesAny([], "anything.ts")).toBe(false);
  });
});
