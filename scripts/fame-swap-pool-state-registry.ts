import { famePoolStateRegistry } from "../src/features/fame-swap/solver/poolStateRegistry";

process.stdout.write(`${JSON.stringify(famePoolStateRegistry(), null, 2)}\n`);
