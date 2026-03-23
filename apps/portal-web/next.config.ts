import type { NextConfig } from 'next';

const distDir = process.env.NEXT_DIST_DIR?.trim() || '.next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir
};

export default nextConfig;
