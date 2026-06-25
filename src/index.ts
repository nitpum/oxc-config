import noSubdirectoryRelativeImports from "./no-subdirectory-relative-imports";
import singleDefaultExport from "./single-default-export";

export { rule, isSubdirectoryRelative, MESSAGE_ID } from "./no-subdirectory-relative-imports";
export { rule as singleDefaultExportRule } from "./single-default-export";
export { isGlobMatch, matchesAny } from "./single-default-export/glob";

const plugin = {
  meta: { name: "nitpum" },
  rules: {
    ...noSubdirectoryRelativeImports.rules,
    ...singleDefaultExport.rules,
  },
};

export default plugin;
