import { ReactNode } from "react";
import { BaseError } from "viem";

export function getContractWriteErrorMessage(error: unknown): ReactNode {
  if (error instanceof BaseError && error.metaMessages?.length) {
    return error.metaMessages.map((message) => <p key={message}>{message}</p>);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Transaction failed";
}
