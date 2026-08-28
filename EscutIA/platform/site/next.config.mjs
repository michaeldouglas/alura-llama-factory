/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // These packages load a native SQLite binary at runtime. Keeping them
    // external prevents Webpack from replacing `bindings` resolution with a
    // bundled context that does not contain the native module path.
    serverComponentsExternalPackages: [
      "@langchain/langgraph-checkpoint-sqlite",
      "better-sqlite3",
      "bindings",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
