import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vite-plus/test";
import plugin from "../src/index.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const cwd = "/test-project";
const filename = "/test-project/src/pages/home.ts";

const tester = new RuleTester({
  cwd,
  languageOptions: {
    parserOptions: { lang: "ts" },
  },
});

tester.run(
  "no-relative-import-paths",
  plugin.rules["no-relative-import-paths"] as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      { name: "package import", code: `import x from "react";`, filename },
      { name: "absolute prefix import", code: `import x from "@/lib/x";`, filename },
      { name: "type import from package", code: `import type { X } from "react";`, filename },
      { name: "export from package", code: `export { x } from "react";`, filename },
      { name: "export star from package", code: `export * from "react";`, filename },
      { name: "local export is not a specifier", code: `export const x = 1;`, filename },
      { name: "re-export local binding", code: `const x = 1; export { x };`, filename },
      { name: "dynamic import is ignored", code: `const x = import("../lib/x");`, filename },
      { name: "require is ignored", code: `const x = require("../lib/x");`, filename },
      {
        name: "same-folder import when allowed",
        code: `import x from "./utils";`,
        filename,
        options: [{ allowSameFolder: true }],
      },
      {
        name: "nested same-folder import when allowed",
        code: `import x from "./nested/utils";`,
        filename,
        options: [{ allowSameFolder: true }],
      },
      {
        name: "parent import within allowed depth",
        code: `import x from "../lib/x";`,
        filename,
        options: [{ allowedDepth: 1 }],
      },
      {
        name: "parent import outside rootDir is ignored",
        code: `import x from "../../outside";`,
        filename,
        options: [{ rootDir: "src" }],
      },
    ],
    invalid: [
      {
        name: "parent import",
        code: `import x from "../lib/x";`,
        filename,
        errors: [{ messageId: "import" }],
        output: `import x from "src/lib/x";`,
      },
      {
        name: "same-folder import",
        code: `import x from "./utils";`,
        filename,
        errors: [{ messageId: "import" }],
        output: `import x from "src/pages/utils";`,
      },
      {
        name: "nested same-folder import",
        code: `import x from "./nested/utils";`,
        filename,
        errors: [{ messageId: "import" }],
        output: `import x from "src/pages/nested/utils";`,
      },
      {
        name: "single quotes are preserved",
        code: `import x from '../lib/x';`,
        filename,
        errors: [{ messageId: "import" }],
        output: `import x from 'src/lib/x';`,
      },
      {
        name: "type import",
        code: `import type { X } from "../lib/x";`,
        filename,
        errors: [{ messageId: "import" }],
        output: `import type { X } from "src/lib/x";`,
      },
      {
        name: "side-effect import",
        code: `import "../lib/x";`,
        filename,
        errors: [{ messageId: "import" }],
        output: `import "src/lib/x";`,
      },
      {
        name: "named export from",
        code: `export { x } from "../lib/x";`,
        filename,
        errors: [{ messageId: "export" }],
        output: `export { x } from "src/lib/x";`,
      },
      {
        name: "type export from",
        code: `export type { X } from "../lib/x";`,
        filename,
        errors: [{ messageId: "export" }],
        output: `export type { X } from "src/lib/x";`,
      },
      {
        name: "export star from",
        code: `export * from "../lib/x";`,
        filename,
        errors: [{ messageId: "export" }],
        output: `export * from "src/lib/x";`,
      },
      {
        name: "rootDir strips the root segment",
        code: `import x from "../lib/x";`,
        filename,
        options: [{ rootDir: "src" }],
        errors: [{ messageId: "import" }],
        output: `import x from "lib/x";`,
      },
      {
        name: "prefix is prepended",
        code: `import x from "../lib/x";`,
        filename,
        options: [{ prefix: "@" }],
        errors: [{ messageId: "import" }],
        output: `import x from "@/src/lib/x";`,
      },
      {
        name: "prefix and rootDir together",
        code: `import x from "../lib/x";`,
        filename,
        options: [{ prefix: "@", rootDir: "src" }],
        errors: [{ messageId: "import" }],
        output: `import x from "@/lib/x";`,
      },
      {
        name: "normalized ./../ is a parent import",
        code: `import x from "./../lib/x";`,
        filename,
        options: [{ allowSameFolder: true }],
        errors: [{ messageId: "import" }],
        output: `import x from "src/lib/x";`,
      },
      {
        name: "parent import deeper than allowedDepth",
        code: `import x from "../../lib/x";`,
        filename,
        options: [{ allowedDepth: 1 }],
        errors: [{ messageId: "import" }],
        output: `import x from "lib/x";`,
      },
      {
        name: "normalized ./../ counts as depth 1",
        code: `import x from "./../../lib/x";`,
        filename,
        options: [{ allowedDepth: 1 }],
        errors: [{ messageId: "import" }],
        output: `import x from "lib/x";`,
      },
    ],
  },
);
