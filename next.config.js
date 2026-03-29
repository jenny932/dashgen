/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Cloudflare doesn't support Next.js image optimization
  },
}
module.exports = nextConfig
