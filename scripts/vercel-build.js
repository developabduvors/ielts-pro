const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const target = (process.env.LMS_APP_TARGET || "student").toLowerCase();
const marker = ".vercel-generated-next-root";

const apps = {
  student: "apps/student-web",
  admin: "apps/admin-web",
};

const appDir = apps[target];

if (!appDir) {
  console.error(`Unknown LMS_APP_TARGET "${target}". Use "student" or "admin".`);
  process.exit(1);
}

const generatedPaths = ["app", "lib", "next.config.mjs", "next-env.d.ts", "tsconfig.json"];

function cleanGeneratedRoot() {
  if (!fs.existsSync(marker)) {
    return;
  }

  for (const generatedPath of generatedPaths) {
    fs.rmSync(generatedPath, { recursive: true, force: true });
  }

  fs.rmSync(marker, { force: true });
}

function assertRootCanBeGenerated() {
  for (const generatedPath of generatedPaths) {
    if (fs.existsSync(generatedPath) && !fs.existsSync(marker)) {
      throw new Error(`Refusing to overwrite existing root path: ${generatedPath}`);
    }
  }
}

function copyIfExists(from, to) {
  if (fs.existsSync(from)) {
    fs.cpSync(from, to, { recursive: true });
  }
}

function writeRootTsConfig() {
  const tsconfig = {
    extends: "./tsconfig.base.json",
    compilerOptions: {
      plugins: [{ name: "next" }],
      paths: {
        "@/*": ["./*"],
      },
    },
    include: [
      "next-env.d.ts",
      "app/**/*.ts",
      "app/**/*.tsx",
      "lib/**/*.ts",
      "lib/**/*.tsx",
      ".next/types/**/*.ts",
    ],
    exclude: ["node_modules", "apps", "packages"],
  };

  fs.writeFileSync("tsconfig.json", `${JSON.stringify(tsconfig, null, 2)}\n`);
}

cleanGeneratedRoot();
assertRootCanBeGenerated();

try {
  fs.writeFileSync(marker, `${target}\n`);
  copyIfExists(path.join(appDir, "app"), "app");
  copyIfExists(path.join(appDir, "lib"), "lib");
  copyIfExists(path.join(appDir, "next.config.mjs"), "next.config.mjs");
  copyIfExists(path.join(appDir, "next-env.d.ts"), "next-env.d.ts");
  writeRootTsConfig();

  fs.rmSync(".next", { recursive: true, force: true });
  execSync("npm --workspace @ielts-pro/shared run build", { stdio: "inherit" });
  execSync("npm --workspace @ielts-pro/ui run build", { stdio: "inherit" });
  execSync("node node_modules/next/dist/bin/next build --webpack", { stdio: "inherit" });
} finally {
  cleanGeneratedRoot();
}
