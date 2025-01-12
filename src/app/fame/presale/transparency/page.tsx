import { HorizontalGauge } from "@/features/presale/components/HorizontalGauge";
import { ContributionGaugeEther } from "@/features/presale/components/ContributionGaugeEther";
import { ContributionGaugePercent } from "@/features/presale/components/ContributionGaugePercent";
import { famePresaleTokenHolders } from "@/service/tokenHolderList";
import { formatEther } from "viem";

function bigMathMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

export default async function Transparency() {
  const now = new Date();
  const data = await famePresaleTokenHolders();

  return (
    <div>
      {data.map((tokenHolder) => {
        return (
          <div
            key={tokenHolder.address}
            className="flex flex-row items-center justify-start"
          >
            <HorizontalGauge
              key={tokenHolder.address}
              value={Math.min(tokenHolder.percentClaimedStillHeld, 100)}
              max={100}
              ticks={10}
              rightLabel={tokenHolder.percentClaimedStillHeld.toFixed(2)}
            />
          </div>
        );
      })}
      <ContributionGaugePercent
        max={100}
        min={0}
        value={percentStillHeld}
        step={10}
      />
      <ContributionGaugePercent
        max={percentStillHeldAll}
        min={0}
        value={percentStillHeldAll}
        step={50}
      />
      <ContributionGaugeEther max={6} min={0} value={6} step={1} />
    </div>
  );
}
