import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Monorepo root (two levels up) — silences Next.js' multiple-lockfile workspace
// root warning by pinning the root instead of letting it infer from a stray
// lockfile in a parent directory.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig = {
  turbopack: { root: repoRoot },
  transpilePackages: ["@ielts-pro/shared", "@ielts-pro/ui"],
  // Workspace paketlari NodeNext uslubida `./x.js` deb import qiladi, lekin fayllar `.ts`.
  // Webpack rejimida `.js` so'rovini `.ts`/`.tsx` ga xaritalash kerak (transpilePackages manbadan build qiladi).
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"]
    };
    return config;
  }
};

export default nextConfig;
