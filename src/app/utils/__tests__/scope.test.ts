import { describe, it, expect } from 'vitest';
import { resolvePrimaryBranchId } from '../scope';
import type { Branch } from '../../types';

function makeBranch(id: string, name = 'Branch'): Branch {
  return { id, churchId: 'church-1', name, isHeadquarters: false, createdAt: new Date() };
}

describe('resolvePrimaryBranchId', () => {
  const branches = [makeBranch('b1'), makeBranch('b2'), makeBranch('b3')];

  it('returns admin.branchId when set', () => {
    expect(resolvePrimaryBranchId(branches, { branchId: 'b2', branchIds: ['b3'] })).toBe('b2');
  });

  it('falls back to first branchIds entry when branchId is absent', () => {
    expect(resolvePrimaryBranchId(branches, { branchIds: ['b3', 'b2'] })).toBe('b3');
  });

  it('falls back to first branch in list when admin has no branch assignment', () => {
    expect(resolvePrimaryBranchId(branches, {})).toBe('b1');
  });

  it('returns first branch when admin is null', () => {
    expect(resolvePrimaryBranchId(branches, null)).toBe('b1');
  });

  it('returns undefined when branches list is empty and admin has no assignment', () => {
    expect(resolvePrimaryBranchId([], {})).toBeUndefined();
  });

  it('returns branchId even when branches list is empty', () => {
    expect(resolvePrimaryBranchId([], { branchId: 'b99' })).toBe('b99');
  });
});
