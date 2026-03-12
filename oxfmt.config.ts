import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,

  sortImports: {
    groups: [
      ["side_effect"],
      ["builtin"],
      ["external", "type-external"],
      ["internal", "type-internal"],
      ["parent", "type-parent"],
      ["sibling", "type-sibling"],
      ["index", "type-index"],
      ["unknown"],
    ],
  },
});
