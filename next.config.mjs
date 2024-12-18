/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      maxDuration: 120,
    },
  },
};

export default nextConfig;
