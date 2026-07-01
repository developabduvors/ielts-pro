import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url);

const checks = [];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function start(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  return child;
}

function stop(child) {
  if (child.exitCode != null) return;
  if (process.platform === "win32") {
    child.kill("SIGINT");
    return;
  }
  try {
    process.kill(-child.pid, "SIGINT");
  } catch {
    child.kill("SIGINT");
  }
}

async function waitFor(url, label) {
  const deadline = Date.now() + 30000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = new Error(`${label} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(500);
  }
  throw lastError || new Error(`${label} did not start`);
}

async function get(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  return { response, text };
}

function expectIncludes(text, expected, label) {
  if (!text.includes(expected)) {
    throw new Error(`${label}: expected HTML to include "${expected}"`);
  }
}

async function check(label, fn) {
  try {
    await fn();
    checks.push({ label, status: "pass" });
  } catch (error) {
    checks.push({ label, status: "fail", error });
  }
}

const student = start("student", "npm", ["run", "dev:student"]);
const admin = start("admin", "npm", ["run", "dev:admin"]);

try {
  await Promise.all([
    waitFor("http://localhost:3000", "student app"),
    waitFor("http://localhost:3001", "admin app"),
  ]);

  await check("student login renders", async () => {
    const { text } = await get("http://localhost:3000");
    expectIncludes(text, "Student login", "student login");
    expectIncludes(text, "Open practice room", "student login");
  });

  await check("student protected routes redirect", async () => {
    for (const route of ["/dashboard", "/progress", "/tests/smoke-task"]) {
      const { response } = await get(`http://localhost:3000${route}`, { redirect: "manual" });
      if (![303, 307, 308].includes(response.status)) {
        throw new Error(`${route} returned ${response.status}, expected redirect`);
      }
    }
  });

  await check("admin login renders", async () => {
    const { text } = await get("http://localhost:3001");
    expectIncludes(text, "Run the IELTS classroom", "admin login");
    expectIncludes(text, "Open teacher panel", "admin login");
  });

  await check("admin protected routes redirect", async () => {
    for (const route of ["/dashboard", "/students", "/lessons", "/submissions"]) {
      const { response } = await get(`http://localhost:3001${route}`, { redirect: "manual" });
      if (![303, 307, 308].includes(response.status)) {
        throw new Error(`${route} returned ${response.status}, expected redirect`);
      }
    }
  });
} finally {
  stop(student);
  stop(admin);
  await wait(500);
}

const failed = checks.filter((item) => item.status === "fail");
for (const item of checks) {
  if (item.status === "pass") {
    console.log(`PASS ${item.label}`);
  } else {
    console.error(`FAIL ${item.label}: ${item.error?.message || item.error}`);
  }
}

if (failed.length) process.exit(1);
