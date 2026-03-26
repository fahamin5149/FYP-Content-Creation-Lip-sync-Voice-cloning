/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Speed up dev + build: resolve icon/chart packages from per-export paths instead of huge barrel files.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
      "motion",
      "react-icons",
      "@react-three/drei",
      "@react-three/fiber",
      "sonner",
    ],
  },
}

export default nextConfig
