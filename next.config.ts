import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default config;
