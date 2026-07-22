export type TransferResult = SuccessfulTransfer | FailedTransfer;

export interface SuccessfulTransfer {
  isSent: true;
}

export interface FailedTransfer {
  isSent: false;
  reason: string;
  code: number;
}
