import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,

  sortImports: {
    groups: [
      ["side-effect"],
      ["builtin"],
      ["external", "external-type"],
      ["internal", "internal-type"],
      ["parent", "parent-type"],
      ["sibling", "sibling-type"],
      ["index", "index-type"],
    ],
  },
});
