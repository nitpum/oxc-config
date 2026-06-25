import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import { matchesAny } from "../utils/isGlobMatch";

export const MESSAGE_IDS = {
  named: "noNamedExport",
  reexport: "noReexport",
} as const;

type MessageId = (typeof MESSAGE_IDS)[keyof typeof MESSAGE_IDS];

export interface RuleOptions {
  include?: string[];
  exclude?: string[];
  allowTypeExports?: boolean;
}

type Options = [RuleOptions?];

function specifierName(spec: TSESTree.ExportSpecifier): string {
  const exported = spec.exported;
  return exported.type === "Identifier" ? exported.name : String(exported.value);
}

function namedExportName(node: TSESTree.ExportNamedDeclaration): string {
  const declaration = node.declaration;
  if (declaration) {
    if (declaration.type === "VariableDeclaration") {
      const names = declaration.declarations
        .map((d) => (d.id.type === "Identifier" ? d.id.name : "(destructured)"))
        .join(", ");
      return names || "variable";
    }
    if ("id" in declaration && declaration.id && "name" in declaration.id) {
      return declaration.id.name;
    }
    return declaration.type;
  }
  if (node.specifiers.length > 0) {
    return node.specifiers.map(specifierName).join(", ");
  }
  return "export";
}

export const rule: TSESLint.RuleModule<MessageId, Options> = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that a module exports a single default export (no named exports or re-exports). Scope it to specific files via include/exclude glob patterns.",
    },
    messages: {
      noNamedExport:
        "Only a single default export is allowed in this file. Remove '{{name}}' or make it the default export.",
      noReexport:
        "Only a single default export is allowed in this file. Re-exports are not allowed here.",
    },
    schema: [
      {
        type: "object",
        properties: {
          include: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns of files this rule applies to. If omitted, applies to all files.",
          },
          exclude: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns of files this rule should skip (takes precedence over include).",
          },
          allowTypeExports: {
            type: "boolean",
            description: "When true, `export type` / `export interface` statements are allowed alongside the default export.",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] ?? {};
    const filename = context.filename ?? "";

    if (options.exclude && options.exclude.length > 0 && matchesAny(options.exclude, filename)) {
      return {};
    }
    if (options.include && options.include.length > 0 && !matchesAny(options.include, filename)) {
      return {};
    }

    const allowTypeExports = options.allowTypeExports === true;

    function isTypeOnly(node: TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration): boolean {
      return node.exportKind === "type";
    }

    return {
      ExportNamedDeclaration(node) {
        if (allowTypeExports && isTypeOnly(node)) return;
        context.report({
          node,
          messageId: MESSAGE_IDS.named,
          data: { name: namedExportName(node) },
        });
      },
      ExportAllDeclaration(node) {
        if (allowTypeExports && isTypeOnly(node)) return;
        context.report({ node, messageId: MESSAGE_IDS.reexport });
      },
    };
  },
};

const plugin = {
  meta: { name: "nitpum" },
  rules: { "single-default-export": rule },
};

export default plugin;
