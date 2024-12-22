/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      maxDuration: 120,
    },
  },
};

export default nextConfig;
