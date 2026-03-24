import type { NextConfig } from 'next';
import { loadNextRuntimeConfig } from '@payer-portal/config';

const distDir = loadNextRuntimeConfig().distDir;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir
};

export default nextConfig;
