import { z } from "zod";

const natural = z.number().int().nonnegative();
const decimal = z.string().regex(/^\d+(\.\d+)?$/);
const row = z.object({
  id: z.string().max(200),
  poolId: z.string().regex(/^[a-z0-9-]{1,100}$/),
  type: z.enum(["buy", "sell", "add", "remove"]),
  timestamp: natural,
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  logIndex: natural,
  fameAtoms: z.string().regex(/^\d+$/),
  fameDecimals: z.number().int().min(0).max(255),
  size: decimal.nullable(),
});
export const activitySchema = z.object({
  version: z.literal("fame-activity-v1"),
  currency: z.enum(["ETH", "USDC"]),
  from: natural,
  to: natural,
  rows: z.array(row).max(100),
  nextCursor: z
    .string()
    .max(1500)
    .regex(/^[A-Za-z0-9_-]+$/)
    .nullable(),
  coverage: z.object({
    unavailableBuckets: z.array(z.unknown()),
    partialBuckets: z.array(z.unknown()),
    outsidePublishedWindow: z.boolean(),
    notYetPublished: z.boolean(),
  }),
});
export type ActivityPage = z.infer<typeof activitySchema>;
export function fameAmount(atoms: string, decimals: number) {
  const padded = atoms.padStart(decimals + 1, "0");
  return decimals
    ? `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`
    : padded;
}
