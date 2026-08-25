# oxlint-plugin-no-relative-import-paths

Oxlint plugin that flags relative `import` and `export ... from` specifiers and rewrites them to paths based on the working directory.

## Install

```sh
pnpm add -D oxlint-plugin-no-relative-import-paths
```

Peer dependency: `oxlint` >= 1.

## Usage

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: ["oxlint-plugin-no-relative-import-paths"],
  rules: {
    "no-relative-import-paths/no-relative-import-paths": "error",
  },
});
```

JSON config:

```json
{
  "jsPlugins": ["oxlint-plugin-no-relative-import-paths"],
  "rules": {
    "no-relative-import-paths/no-relative-import-paths": [
      "error",
      { "allowSameFolder": true, "rootDir": "src", "prefix": "@" }
    ]
  }
}
```

## Options

| Option            | Default | Meaning                                                                                                                      |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `allowSameFolder` | `false` | Allow specifiers that stay in the current directory after `.` / `..` are resolved. `./nested/x` still counts as same-folder. |
| `rootDir`         | `""`    | Directory, relative to `cwd`, used as the fixer root. Parent imports that resolve outside this directory are not flagged.    |
| `prefix`          | `""`    | String prepended to the fixed specifier (`"@"` becomes `@/src/lib/x`).                                                       |
| `allowedDepth`    | unset   | Parent imports whose normalized `..` count is at most this number are allowed. Same-folder specifiers ignore this option.    |

## What it flags

- `import ... from "./x"` and `import type ... from "./x"`
- `export { ... } from "./x"`, `export type { ... } from "./x"`, `export * from "./x"`

`./../x` is treated as a parent import (normalized), not same-folder.

## What it ignores

- `import("./x")`
- `require("./x")`
- specifiers that are already absolute or package names
- parent imports that resolve outside `rootDir` when `rootDir` is set

## Messages

- Imports: `import statements should have an absolute path`
- Exports: `export statements should have an absolute path`

## License

ISC
