import { BASE_SEPOLIA_TEST_GALLERY_MANIFEST } from "./baseSepoliaTestGallery.generated";

export const BASE_SEPOLIA_TEST_GALLERY_CONFIG = {
  ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST,
  testToken: {
    ...BASE_SEPOLIA_TEST_GALLERY_MANIFEST.testToken,
    unit: BigInt(BASE_SEPOLIA_TEST_GALLERY_MANIFEST.testToken.unit),
  },
  deployment: {
    blockNumber: BigInt(
      BASE_SEPOLIA_TEST_GALLERY_MANIFEST.deployment.blockNumber,
    ),
  },
} as const;
