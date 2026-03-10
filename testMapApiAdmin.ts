import { readFileSync } from 'fs';
// We'll mock it roughly to test mapApiAdmin code block manually

function mapApiAdmin(a: any): any {
  const validLevels = ['church', 'branch', 'department', 'unit', 'member'];
  const rawLevel = a.level || a.scopeLevel || a.roles?.[0]?.scopeLevel || a.role?.scopeLevel;
  const level = a.isSuperAdmin
    ? 'church'
    : rawLevel === 'member' || rawLevel === 'unit'
      ? 'unit'
      : validLevels.includes(rawLevel)
        ? rawLevel
        : 'church';
  const branchIds = Array.isArray(a.branchIds) && a.branchIds.length > 0
    ? a.branchIds.filter(Boolean)
    : Array.isArray(a.branches)
      ? a.branches.map((branch: any) => branch?.id).filter(Boolean)
      : a.branchId
        ? [a.branchId]
        : [];
  const departmentIds = Array.isArray(a.departmentIds) && a.departmentIds.length > 0
    ? a.departmentIds.filter(Boolean)
    : a.departments?.map((d: any) => d.id) || [];
  const unitIds = Array.isArray(a.unitIds) && a.unitIds.length > 0
    ? a.unitIds.filter(Boolean)
    : a.units?.map((u: any) => u.id) || [];

  return {
    id: a.id,
    churchId: a.churchId || '',
    name: a.name || '',
    email: a.email || '',
    phone: a.phone || '',
    roleId: a.roleId || a.roles?.[0]?.id || '',
    level,
    isSuperAdmin: a.isSuperAdmin || false,
    status: (a.isDeleted || a.isActive === false) ? 'suspended' : 'active',
    branchId: a.branchId || a.branch?.id || branchIds[0] || null,
    departmentId: departmentIds[0],
    unitId: unitIds[0],
    branchIds,
    departmentIds,
    unitIds,
    // Permissions omitted for brevity
    createdAt: new Date(a.createdAt || Date.now()),
  };
}

console.log(mapApiAdmin({
    "id": "3cb0bd62-6b01-4a18-a344-062c827d686e",
    "name": "Torion Little",
    "email": "torion.little@flyovertrees.com",
    "phone": "+2347012148968",
    "scopeLevel": "unit",
    "title": "User",
    "isSuperAdmin": false,
    "isActive": true,
    "branches": [{"id": "902630d7-eab7-45c8-b17a-36626c74163f"}],
    "departments": [{"id": "9233d3b2-adb6-4b4c-92c3-efc92618991f"}],
    "units": [{"id": "afe1313c-0305-46e6-9f9f-8562693aab5a"}],
    "roles": [{"id": "99774bda-ea73-49d6-9bf8-fcbfef2967ba", "name": "HOD"}]
}));
