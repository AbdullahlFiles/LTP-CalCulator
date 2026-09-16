import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ltp/core", "@ltp/market-data"],
};

export default nextConfig;
