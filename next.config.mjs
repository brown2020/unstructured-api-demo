/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Vercel rejects function bodies over 4.5MB. Leave room for multipart framing.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
