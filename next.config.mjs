/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/xhs-admin',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add cache headers to prevent aggressive caching of JavaScript
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
