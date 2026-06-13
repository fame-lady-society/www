import { famePoolActivationReport } from "../src/features/fame-swap/solver/poolActivation";

export function formatFamePoolActivationReportJson(): string {
  return `${JSON.stringify(famePoolActivationReport(), null, 2)}\n`;
}

function shouldRunCli(): boolean {
  return (
    process.argv[1]?.endsWith("fame-swap-pool-activation-report.ts") ?? false
  );
}

if (shouldRunCli()) {
  process.stdout.write(formatFamePoolActivationReportJson());
}
