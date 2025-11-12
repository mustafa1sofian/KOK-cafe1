/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable x-powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;
