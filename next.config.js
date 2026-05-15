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
        new webpack.DefinePlugin({
          __dirname: JSON.stringify("/"),
          __filename: JSON.stringify("/index.js"),
        }),
        new webpack.BannerPlugin({
          banner: "var __dirname='/';var __filename='/index.js';",
          raw: true,
          entryOnly: false,
        }),
      );
    }
    return config;
  },
};

module.exports = nextConfig;
