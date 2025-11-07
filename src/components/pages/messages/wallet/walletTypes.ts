export interface Wallet {
  id: string;
  userId: string | null;
  balance: string;
  branchWallet: { name: string } | null;
  deptWallet: { name: string } | null;
}

export interface Branch {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  branchId: string;
}

export interface FlutterwaveResponse {
  success: boolean;
  message: string;
  tx_ref: string;
  amount: number;
  currency: string;
  publicKey: string;
  customer: { email: string; name: string };
}