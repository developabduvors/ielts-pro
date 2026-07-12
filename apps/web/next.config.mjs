import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { config } from "dotenv";

// Monorepo root (two levels up)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(repoRoot, ".env.local") });

const nextConfig = {
  serverActions: {
    bodySizeLimit: "4mb"
  },
  turbopack: { root: repoRoot },
  transpilePackages: ["@ielts-pro/shared", "@ielts-pro/ui"],
  // Client-side router cache: keep visited pages "fresh" so navigating back to a
  // recently-opened page is instant (served from the browser, no server round-trip).
  // Dynamic student pages are the main navigation surface — 60s of staleness is
  // fine and makes page-to-page feel instant like a SPA. Refresh gets latest data.
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300
    }
  },
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
