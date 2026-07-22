/** @type {import('next').NextConfig} */
const nextConfig = {
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
