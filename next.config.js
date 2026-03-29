/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages via @cloudflare/next-on-pages
  experimental: {
    runtime: 'edge',
  },
  images: {
    unoptimized: true, // Cloudflare doesn't support Next.js image optimization
  },
}
module.exports = nextConfig
