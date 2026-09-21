import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root — an unrelated lockfile higher up the tree
  // otherwise makes Next.js guess the wrong monorepo root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
