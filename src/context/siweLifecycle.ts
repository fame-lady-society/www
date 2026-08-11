export class SiweAttemptCoordinator {
  private epoch = 0;
  private inFlight: Promise<boolean> | null = null;

  currentEpoch(): number {
    return this.epoch;
  }

  isCurrent(epoch: number): boolean {
    return epoch === this.epoch;
  }

  hasInFlightAttempt(): boolean {
    return this.inFlight !== null;
  }

  invalidate(): void {
    this.epoch += 1;
    this.inFlight = null;
  }

  run(attempt: (epoch: number) => Promise<boolean>): Promise<boolean> {
    if (this.inFlight) return this.inFlight;

    const epoch = ++this.epoch;
    const promise = attempt(epoch).finally(() => {
      if (this.isCurrent(epoch)) this.inFlight = null;
    });
    this.inFlight = promise;
    return promise;
  }
}
