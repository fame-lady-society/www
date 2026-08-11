export type GalleryConnectionDecision =
  | "wait"
  | "execute"
  | "schedule_cancel"
  | "cancel";

export class GalleryConnectionAttempt {
  private waiting = false;
  private sawModalOpen = false;
  private cancellationScheduled = false;

  begin(): void {
    this.waiting = true;
    this.sawModalOpen = false;
    this.cancellationScheduled = false;
  }

  isWaiting(): boolean {
    return this.waiting;
  }

  observe({
    connected,
    modalOpen,
    modalLoading,
  }: {
    connected: boolean;
    modalOpen: boolean;
    modalLoading: boolean;
  }): GalleryConnectionDecision {
    if (!this.waiting) return "wait";
    if (connected) return this.finish("execute");
    if (modalOpen) {
      this.sawModalOpen = true;
      this.cancellationScheduled = false;
      return "wait";
    }
    if (this.sawModalOpen && !modalLoading && !this.cancellationScheduled) {
      this.cancellationScheduled = true;
      return "schedule_cancel";
    }
    return "wait";
  }

  settleAfterClose(connected: boolean): GalleryConnectionDecision {
    if (!this.waiting) return "wait";
    return this.finish(connected ? "execute" : "cancel");
  }

  reset(): void {
    this.waiting = false;
    this.sawModalOpen = false;
    this.cancellationScheduled = false;
  }

  private finish(decision: "execute" | "cancel"): GalleryConnectionDecision {
    this.reset();
    return decision;
  }
}
