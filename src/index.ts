import path from "node:path";

interface RuleOptions {
  allowSameFolder?: boolean;
  rootDir?: string;
  prefix?: string;
  allowedDepth?: number;
}

type MessageId = "import" | "export";

interface SourceLiteral {
  value: string;
  range: [number, number];
}

interface Fixer {
  replaceTextRange(range: [number, number], text: string): unknown;
}

interface RuleContext {
  filename: string;
  cwd: string;
  options: readonly unknown[];
  sourceCode: { text: string };
  report(diagnostic: {
    node: SourceLiteral;
    messageId: MessageId;
    fix(fixer: Fixer): unknown;
  }): void;
}

function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function parentDepth(specifier: string): number {
  const stack: string[] = [];
  for (const part of specifier.split("/")) {
    if (part === "." || part === "") {
      continue;
    }
    if (part === "..") {
      if (stack.length > 0 && stack[stack.length - 1] !== "..") {
        stack.pop();
      } else {
        stack.push("..");
      }
      continue;
    }
    stack.push(part);
  }
  let depth = 0;
  for (const part of stack) {
    if (part !== "..") {
      break;
    }
    depth += 1;
  }
  return depth;
}

function resolveFromFile(filename: string, specifier: string): string {
  return path.join(path.dirname(filename), specifier);
}

function toAbsoluteSpecifier(
  specifier: string,
  filename: string,
  cwd: string,
  rootDir: string,
  prefix: string,
): string {
  const absoluteFrom = path.join(cwd, rootDir);
  const absoluteTo = resolveFromFile(filename, specifier);
  return [prefix, ...path.relative(absoluteFrom, absoluteTo).split(path.sep)]
    .filter(Boolean)
    .join("/");
}

const noRelativeImportPaths = {
  meta: {
    type: "layout" as const,
    docs: {
      description: "Require absolute module specifiers instead of relative ones.",
    },
    fixable: "code" as const,
    messages: {
      import: "import statements should have an absolute path",
      export: "export statements should have an absolute path",
    },
    schema: [
      {
        type: "object" as const,
        properties: {
          allowSameFolder: { type: "boolean" as const },
          rootDir: { type: "string" as const },
          prefix: { type: "string" as const },
          allowedDepth: { type: "number" as const },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context: RuleContext) {
    function reportRelativeSpecifier(source: SourceLiteral, messageId: MessageId) {
      const specifier = source.value;
      if (!isRelativeSpecifier(specifier)) {
        return;
      }

      const options = (context.options[0] ?? {}) as RuleOptions;
      const allowSameFolder = options.allowSameFolder ?? false;
      const rootDir = options.rootDir ?? "";
      const prefix = options.prefix ?? "";
      const allowedDepth = options.allowedDepth;
      const depth = parentDepth(specifier);
      const isParent = depth > 0;

      if (isParent) {
        if (allowedDepth !== undefined && depth <= allowedDepth) {
          return;
        }
        if (rootDir !== "") {
          const absoluteRoot = path.join(context.cwd, rootDir);
          const absoluteTarget = resolveFromFile(context.filename, specifier);
          if (
            !absoluteTarget.startsWith(absoluteRoot) ||
            !context.filename.startsWith(absoluteRoot)
          ) {
            return;
          }
        }
      } else if (allowSameFolder) {
        return;
      }

      const nextSpecifier = toAbsoluteSpecifier(
        specifier,
        context.filename,
        context.cwd,
        rootDir,
        prefix,
      );

      context.report({
        node: source,
        messageId,
        fix(fixer) {
          return fixer.replaceTextRange([source.range[0] + 1, source.range[1] - 1], nextSpecifier);
        },
      });
    }

    return {
      before() {
        if (!context.sourceCode.text.includes("./")) {
          return false;
        }
      },
      ImportDeclaration(node: { source: SourceLiteral }) {
        reportRelativeSpecifier(node.source, "import");
      },
      ExportNamedDeclaration(node: { source: SourceLiteral | null }) {
        if (node.source) {
          reportRelativeSpecifier(node.source, "export");
        }
      },
      ExportAllDeclaration(node: { source: SourceLiteral }) {
        reportRelativeSpecifier(node.source, "export");
      },
    };
  },
};

const plugin = {
  meta: {
    name: "no-relative-import-paths",
  },
  rules: {
    "no-relative-import-paths": noRelativeImportPaths,
  },
};

export default plugin;
