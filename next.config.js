/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  webpack: (config, { nextRuntime, webpack }) => {
    if (nextRuntime === "edge") {
      config.plugins.push(
        new webpack.BannerPlugin({
          banner:
            "if(typeof globalThis.__dirname==='undefined'){globalThis.__dirname='/';}if(typeof globalThis.__filename==='undefined'){globalThis.__filename='/index.js';}var __dirname=globalThis.__dirname,__filename=globalThis.__filename;",
          raw: true,
          entryOnly: false,
        }),
      );
    }
    return config;
  },
};

module.exports = nextConfig;
