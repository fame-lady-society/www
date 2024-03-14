const withTM = require("next-transpile-modules")([]);


/** @type {import('next').NextConfig} */
const nextConfig = withTM({
  reactStrictMode: true,
  env: {
    LOG_LEVEL: "debug",
    SIWE_EXPIRATION_TIME_SECONDS: process.env.SIWE_EXPIRATION_TIME_SECONDS,
    NEXT_PUBLIC_JWT_CLAIM_ISSUER:
      process.env.NEXT_PUBLIC_JWT_CLAIM_ISSUER,
    NEXT_PUBLIC_DEFAULT_CHAIN_ID:
      process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || "1",
    NEXT_PUBLIC_INFURA_KEY: process.env.INFURA_KEY,
    NEXT_PUBLIC_ALCHEMY_KEY: process.env.ALCHEMY_KEY,
    NEXT_PUBLIC_JWT_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_JWT_PUBLIC_KEY,
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME ?? "https://0xflick.com",
      NEXT_PUBLIC_ALCHEMY_KEY: process.env.NEXT_PUBLIC_ALCHEMY_KEY
  },
  webpack: (config) => {
    config.externals.push("tls", "net", "fs", "path");
    return config;
  },
});

module.exports = nextConfig;
