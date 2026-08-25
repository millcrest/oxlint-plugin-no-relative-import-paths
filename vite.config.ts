import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    dts: true,
    format: "esm",
    exports: false,
  },
  lint: {
    ignorePatterns: ["dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["dist/**"],
  },
  staged: {
    "*.{js,ts,json,md}": "vp check --fix",
  },
});
