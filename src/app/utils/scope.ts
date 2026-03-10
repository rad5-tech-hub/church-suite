import type { Admin, Branch } from '../types';

export function resolvePrimaryBranchId(branches: Branch[], admin?: Pick<Admin, 'branchId' | 'branchIds'> | null) {
  return admin?.branchId || admin?.branchIds?.[0] || branches[0]?.id;
}
