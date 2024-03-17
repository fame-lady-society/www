/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    LOG_LEVEL: "debug",
  },
  webpack: (config) => {
    // config.externals.push("tls", "net", "fs", "path");
    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname:
          "fls-prod-imagestoragef1b24905-1ftqhtk2cy7nl.s3.amazonaws.com",
      },
      {
        hostname: "ipfs.io",
        pathname:
          "/ipfs/bafybeifrehxmpmvh4hiywtpmuuuvt4lotol7wl7dnxlsxikfevn2ivvm7m/*.png",
      },
    ],
  },
};

module.exports = nextConfig;
