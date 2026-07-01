const { execSync } = require("node:child_process");
const fs = require("node:fs");

const target = (process.env.LMS_APP_TARGET || "student").toLowerCase();

const apps = {
  student: {
    build: "npm run build:student",
    nextDir: "apps/student-web/.next",
  },
  admin: {
    build: "npm run build:admin",
    nextDir: "apps/admin-web/.next",
  },
};

const app = apps[target];

if (!app) {
  console.error(`Unknown LMS_APP_TARGET "${target}". Use "student" or "admin".`);
  process.exit(1);
}

execSync(app.build, { stdio: "inherit" });
fs.rmSync(".next", { recursive: true, force: true });
fs.cpSync(app.nextDir, ".next", { recursive: true });
