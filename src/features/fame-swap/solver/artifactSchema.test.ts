import assert from "node:assert/strict";
import { describe, it } from "node:test";
import solverRoutesJson from "../artifacts/base-v1-solver-routes.json";
import gapMatrixJson from "../artifacts/base-v1-route-gap-matrix.json";
import parityVectorsJson from "../artifacts/base-v1-route-parity-vectors.json";
import poolsJson from "../artifacts/base-v1-pools.json";
import poolStateSnapshotJson from "../artifacts/base-v1-pool-state-snapshot.json";
import { artifactIntegrityIssue } from "./integrity";
import {
  FameArtifactSchemaError,
  parseFamePoolStateSnapshotFile,
  parseFamePoolUniverseFile,
  parseFameRouteGapMatrixFile,
  parseFameRouteParityVectorsFile,
  parseFameSolverRoutesFile,
} from "./artifactSchema";

function assertSchemaError(
  action: () => unknown,
  expectedMessage: RegExp,
): void {
  assert.throws(action, (error) => {
    assert.ok(error instanceof FameArtifactSchemaError);
    assert.match(error.message, expectedMessage);
    return true;
  });
}

describe("FAME artifact schema parser", () => {
  it("parses every checked-in artifact file", () => {
    assert.ok(parseFameSolverRoutesFile(solverRoutesJson).routes.length > 0);
    assert.ok(parseFameRouteGapMatrixFile(gapMatrixJson).rows.length > 0);
    assert.ok(
      parseFameRouteParityVectorsFile(parityVectorsJson).vectors.length > 0,
    );
    assert.ok(parseFamePoolUniverseFile(poolsJson).pools.length > 0);
    assert.ok(
      parseFamePoolStateSnapshotFile(poolStateSnapshotJson).quoteTable.length >
        0,
    );
  });

  it("fails clearly for malformed addresses before quote construction", () => {
    const invalid = structuredClone(solverRoutesJson);
    invalid.routes[0].route.legs[0].target = "not-an-address";

    assertSchemaError(
      () => parseFameSolverRoutesFile(invalid),
      /routes\[0\]\.route\.legs\[0\]\.target: expected an EVM address/,
    );
  });

  it("fails clearly for malformed bytes32 hex strings", () => {
    const invalid = structuredClone(solverRoutesJson);
    invalid.routes[0].routeHash = "0x1234";

    assertSchemaError(
      () => parseFameSolverRoutesFile(invalid),
      /routes\[0\]\.routeHash: expected a 32-byte hex string/,
    );
  });

  it("fails clearly for malformed route ids", () => {
    const invalid = structuredClone(solverRoutesJson);
    invalid.routes[0].id = "";

    assertSchemaError(
      () => parseFameSolverRoutesFile(invalid),
      /routes\[0\]\.id: expected a non-empty string/,
    );
  });

  it("fails clearly for malformed numeric strings", () => {
    const invalid = structuredClone(poolStateSnapshotJson);
    invalid.reserveStates[0].reserve0 = "01";

    assertSchemaError(
      () => parseFamePoolStateSnapshotFile(invalid),
      /reserveStates\[0\]\.reserve0: expected a non-negative decimal integer string/,
    );
  });

  it("keeps schema validation composed with manifest integrity checks", () => {
    assert.equal(artifactIntegrityIssue(), null);
  });
});
