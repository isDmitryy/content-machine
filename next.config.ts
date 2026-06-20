import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/content-machine",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
