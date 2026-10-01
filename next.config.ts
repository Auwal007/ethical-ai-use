import type {NextConfig} from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is now enforced during builds.
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  transpilePackages: ['motion'],
};

export default nextConfig;
