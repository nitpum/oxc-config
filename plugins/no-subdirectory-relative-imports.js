const MESSAGE =
  "Relative import '{{source}}' crosses into a subdirectory. Use an absolute/alias path, or import a sibling file directly (e.g. './file').";

function isSubdirectoryRelative(value) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("./")) return false;
  return value.slice(2).includes("/");
}

function checkPath(value, reportNode, context) {
  if (!isSubdirectoryRelative(value)) return;
  context.report({
    node: reportNode,
    messageId: "subdirectory",
    data: { source: value },
  });
}

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow relative imports that cross into subdirectories; only same-level siblings are allowed.",
    },
    messages: { subdirectory: MESSAGE },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source) checkPath(node.source.value, node.source, context);
      },
      ImportExpression(node) {
        checkPath(node.source.value, node.source, context);
      },
      ExportNamedDeclaration(node) {
        if (node.source) checkPath(node.source.value, node.source, context);
      },
      ExportAllDeclaration(node) {
        if (node.source) checkPath(node.source.value, node.source, context);
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "require"
        ) {
          const arg = node.arguments[0];
          if (arg && arg.type === "Literal") {
            checkPath(arg.value, arg, context);
          }
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
