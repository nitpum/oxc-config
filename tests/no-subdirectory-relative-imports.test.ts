import { describe, it, expect } from "vitest";
import { RuleTester } from "eslint";
import { rule, isSubdirectoryRelative } from "../src/no-subdirectory-relative-imports";

describe("isSubdirectoryRelative", () => {
  it("allows same-level siblings", () => {
    expect(isSubdirectoryRelative("./sibling")).toBe(false);
    expect(isSubdirectoryRelative("./sibling.js")).toBe(false);
    expect(isSubdirectoryRelative("./index")).toBe(false);
  });

  it("rejects paths crossing into subdirectories", () => {
    expect(isSubdirectoryRelative("./a/")).toBe(true);
    expect(isSubdirectoryRelative("./a/b")).toBe(true);
    expect(isSubdirectoryRelative("./a/b/c")).toBe(true);
  });

  it("ignores non-relative and parent paths", () => {
    expect(isSubdirectoryRelative("lodash")).toBe(false);
    expect(isSubdirectoryRelative("@/utils/helper")).toBe(false);
    expect(isSubdirectoryRelative("../parent")).toBe(false);
  });
});

describe("no-subdirectory-relative-imports", () => {
  const ruleTester = new RuleTester({
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  });

  it("accepts valid imports", () => {
    ruleTester.run("no-subdirectory-relative-imports", rule as never, {
      valid: [
        { code: 'import a from "./sibling";' },
        { code: 'import a from "./sibling.js";' },
        { code: 'import a from "lodash";' },
        { code: 'import a from "@/utils/helper";' },
        { code: 'const a = require("./sibling");' },
        { code: 'const a = require("lodash");' },
        { code: 'import("./sibling");' },
        { code: 'export { x } from "./sibling";' },
        { code: 'export * from "./sibling";' },
      ],
      invalid: [],
    });
  });

  it("rejects subdirectory relative imports in all forms", () => {
    ruleTester.run("no-subdirectory-relative-imports", rule as never, {
      valid: [],
      invalid: [
        {
          code: 'import a from "./sub/file";',
          errors: [{ messageId: "subdirectory" }],
        },
        {
          code: 'import a from "./a/b/c";',
          errors: [{ messageId: "subdirectory" }],
        },
        {
          code: 'const a = require("./nested/x");',
          errors: [{ messageId: "subdirectory" }],
        },
        {
          code: 'import("./dynamic/y");',
          errors: [{ messageId: "subdirectory" }],
        },
        {
          code: 'export { x } from "./more/z";',
          errors: [{ messageId: "subdirectory" }],
        },
        {
          code: 'export * from "./more2/zz";',
          errors: [{ messageId: "subdirectory" }],
        },
      ],
    });
  });

  it("does not flag dynamic imports with non-literal sources", () => {
    ruleTester.run("no-subdirectory-relative-imports", rule as never, {
      valid: [
        { code: 'const p = "./dynamic/y"; import(p);' },
      ],
      invalid: [],
    });
  });
});
