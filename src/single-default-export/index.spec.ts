import { describe, it } from "vitest";
import { RuleTester } from "eslint";
import parser from "@typescript-eslint/parser";
import { rule } from ".";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser,
  },
});

describe("single-default-export - core behavior (no options)", () => {
  it("accepts a single default export", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [
        { code: 'export default function () {};' },
        { code: 'export default 42;' },
        { code: 'const x = 1; export default x;' },
        { code: 'export default class {};' },
      ],
      invalid: [],
    });
  });

  it("accepts a file with no exports", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [
        { code: 'const a = 1; const b = 2; a + b;' },
        { code: 'import x from "lodash"; console.log(x);' },
      ],
      invalid: [],
    });
  });

  it("rejects named declarations", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [],
      invalid: [
        {
          code: 'export const a = 1;',
          errors: [{ messageId: "noNamedExport" }],
        },
        {
          code: 'export function foo() {}',
          errors: [{ messageId: "noNamedExport" }],
        },
        {
          code: 'export class Foo {}',
          errors: [{ messageId: "noNamedExport" }],
        },
        {
          code: 'const a = 1, b = 2; export { a, b };',
          errors: [{ messageId: "noNamedExport" }],
        },
      ],
    });
  });

  it("rejects re-exports", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [],
      invalid: [
        {
          code: 'export * from "lodash";',
          errors: [{ messageId: "noReexport" }],
        },
        {
          code: 'export { x } from "./mod";',
          errors: [{ messageId: "noNamedExport" }],
        },
        {
          code: 'export * as ns from "./mod";',
          errors: [{ messageId: "noReexport" }],
        },
      ],
    });
  });

  it("flags named exports alongside a default export", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [],
      invalid: [
        {
          code: 'export const a = 1; export default a;',
          errors: [{ messageId: "noNamedExport" }],
        },
      ],
    });
  });
});

describe("single-default-export - allowTypeExports", () => {
  it("allows `export type` / `export interface` when enabled", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [
        { code: 'export default 1; export type Foo = string;', options: [{ allowTypeExports: true }] },
        { code: 'export default 1; export interface Bar {}', options: [{ allowTypeExports: true }] },
        { code: 'export type T = number;', options: [{ allowTypeExports: true }] },
      ],
      invalid: [],
    });
  });

  it("still rejects runtime named exports when allowTypeExports is true", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [],
      invalid: [
        {
          code: 'export const a = 1;',
          options: [{ allowTypeExports: true }],
          errors: [{ messageId: "noNamedExport" }],
        },
        {
          code: 'export * from "lodash";',
          options: [{ allowTypeExports: true }],
          errors: [{ messageId: "noReexport" }],
        },
      ],
    });
  });
});

describe("single-default-export - file patterns", () => {
  it("only applies to files matching `include`", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [
        {
          code: 'export const a = 1;',
          filename: "/project/src/utils/helper.ts",
          options: [{ include: ["src/components/**", "src/pages/**"] }],
        },
      ],
      invalid: [
        {
          code: 'export const a = 1;',
          filename: "/project/src/components/Button.tsx",
          options: [{ include: ["src/components/**", "src/pages/**"] }],
          errors: [{ messageId: "noNamedExport" }],
        },
      ],
    });
  });

  it("skips files matching `exclude` even when they match `include`", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [
        {
          code: 'export const a = 1;',
          filename: "/project/src/components/Button.test.tsx",
          options: [{ include: ["src/components/**"], exclude: ["**/*.test.*", "**/index.*"] }],
        },
        {
          code: 'export const a = 1;',
          filename: "/project/src/pages/index.ts",
          options: [{ include: ["src/**"], exclude: ["**/index.*"] }],
        },
      ],
      invalid: [
        {
          code: 'export const a = 1;',
          filename: "/project/src/components/Button.tsx",
          options: [{ include: ["src/**"], exclude: ["**/*.test.*", "**/index.*"] }],
          errors: [{ messageId: "noNamedExport" }],
        },
      ],
    });
  });

  it("applies to all files when neither include nor exclude is given", () => {
    ruleTester.run("single-default-export", rule as never, {
      valid: [],
      invalid: [
        {
          code: 'export const a = 1;',
          filename: "/anywhere/file.ts",
          errors: [{ messageId: "noNamedExport" }],
        },
      ],
    });
  });
});
