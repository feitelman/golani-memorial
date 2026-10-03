/** @type {import('next').NextConfig} */
const nextConfig = {
  // Separate output folder for verification builds (NEXT_DIST_DIR=.next-verify)
  // so a `next build` never clobbers a running dev server's .next folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  webpack: (config) => {
    // mapbox-gl ships with a transpile-unfriendly worker; let webpack handle it.
    config.resolve.alias = { ...config.resolve.alias };
    return config;
  },
};

export default nextConfig;
