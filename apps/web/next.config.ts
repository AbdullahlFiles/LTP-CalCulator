import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ltp/core", "@ltp/market-data", "@ltp/db", "@ltp/ai"],
};

export default nextConfig;
