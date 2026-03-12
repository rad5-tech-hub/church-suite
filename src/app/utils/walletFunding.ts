import type { CreateWalletRequest } from '../apiTypes';
import type { Admin, Branch } from '../types';
import type { FlutterwaveFundingResponse } from './flutterwave';
import { resolvePrimaryBranchId } from './scope';

type WalletFundingAdmin = Pick<Admin, 'level' | 'branchId' | 'branchIds' | 'departmentId' | 'departmentIds'>;

export interface WalletFundingScope {
  branchId?: string;
  departmentId?: string;
  walletType: 'branch' | 'department';
}

export function resolveWalletFundingScope(branches: Branch[], admin?: WalletFundingAdmin | null): WalletFundingScope {
  const branchId = resolvePrimaryBranchId(branches, admin);
  const departmentId = admin?.departmentId || admin?.departmentIds?.[0];
  const isDepartmentScoped = (admin?.level === 'department' || admin?.level === 'unit') && !!departmentId;

  return {
    branchId,
    departmentId,
    walletType: isDepartmentScoped ? 'department' : 'branch',
  };
}

export function buildWalletFundingRequest(scope: WalletFundingScope, amount: number, walletId?: string): CreateWalletRequest {
  if (walletId) {
    return {
      action: 'fund',
      walletId,
      amount,
    };
  }

  return {
    action: 'create_and_fund',
    walletType: scope.walletType,
    amount,
    ...(scope.walletType === 'department' && scope.departmentId ? { departmentId: scope.departmentId } : {}),
  };
}

export function extractFlutterwaveFundingResponse(payload: any): FlutterwaveFundingResponse | null {
  const response = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!response?.publicKey || !response?.tx_ref) {
    return null;
  }

  return {
    tx_ref: response.tx_ref,
    amount: Number(response.amount) || 0,
    currency: response.currency || 'NGN',
    publicKey: response.publicKey,
    customer: response.customer,
  };
}
