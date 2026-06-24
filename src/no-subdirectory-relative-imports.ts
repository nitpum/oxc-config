import type { TSESLint, TSESTree } from "@typescript-eslint/utils";

export const MESSAGE_ID = "subdirectory" as const;

export function isSubdirectoryRelative(value: string): boolean {
  return value.startsWith("./") && value.slice(2).includes("/");
}

export const rule: TSESLint.RuleModule<typeof MESSAGE_ID, []> = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow relative imports that cross into subdirectories; only same-level siblings are allowed.",
    },
    messages: {
      subdirectory:
        "Relative import '{{source}}' crosses into a subdirectory. Use an absolute/alias path, or import a sibling file directly (e.g. './file').",
    },
    schema: [],
  },
  create(context) {
    function reportIfSubdirectory(node: TSESTree.Node): void {
      if (node.type !== "Literal") return;
      if (typeof node.value !== "string") return;
      if (!isSubdirectoryRelative(node.value)) return;
      context.report({
        node,
        messageId: MESSAGE_ID,
        data: { source: node.value },
      });
    }

    return {
      ImportDeclaration(node) {
        reportIfSubdirectory(node.source);
      },
      ImportExpression(node) {
        reportIfSubdirectory(node.source);
      },
      ExportNamedDeclaration(node) {
        if (node.source) reportIfSubdirectory(node.source);
      },
      ExportAllDeclaration(node) {
        reportIfSubdirectory(node.source);
      },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require") {
          const arg = node.arguments[0];
          if (arg) reportIfSubdirectory(arg);
        }
      },
    };
  },
};

const plugin = {
  meta: { name: "nitpum" },
  rules: { "no-subdirectory-relative-imports": rule },
};

export default plugin;
