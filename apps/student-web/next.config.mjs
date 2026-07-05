const nextConfig = {
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
