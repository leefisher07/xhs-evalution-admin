/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/xhs-admin',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
