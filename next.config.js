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
      );
    }
    return config;
  },
};

module.exports = nextConfig;
