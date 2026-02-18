export interface FlutterwaveInitResponse {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name?: string;
    phone_number?: string;
  };
  meta?: Record<string, any>;
}