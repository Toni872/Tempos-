import type { AuthContext } from "../middleware/auth.middleware.js";

export type Permission =
  | "view_company_absences"
  | "view_company_audit_logs"
  | "approve_absence"
  | "reject_absence"
  | "review_ficha_correction"
  | "close_ficha_period"
  | "view_employees"
  | "create_employee"
  | "update_employee"
  | "delete_employee"
  | "view_work_centers"
  | "manage_work_centers"
  | "view_settings"
  | "manage_settings";

const PERMISSIONS_BY_ROLE: Record<AuthContext["role"], Permission[]> = {
  admin: [
    "view_company_absences",
    "view_company_audit_logs",
    "approve_absence",
    "reject_absence",
    "review_ficha_correction",
    "close_ficha_period",
    "view_employees",
    "create_employee",
    "update_employee",
    "delete_employee",
    "view_work_centers",
    "manage_work_centers",
    "view_settings",
    "manage_settings",
  ],
  manager: [
    "view_company_absences",
    "view_company_audit_logs",
    "approve_absence",
    "reject_absence",
    "review_ficha_correction",
    "close_ficha_period",
    "view_employees",
    "create_employee",
    "update_employee",
    "view_work_centers",
    "manage_work_centers",
    "view_settings",
    "manage_settings",
  ],
  auditor: [
    "view_company_absences",
    "view_company_audit_logs",
    "view_employees",
  ],
  employee: ["view_work_centers"],
};

export function hasPermission(
  auth: AuthContext,
  permission: Permission,
): boolean {
  if (auth.status !== "active") {
    return false;
  }

  return PERMISSIONS_BY_ROLE[auth.role].includes(permission);
}

export function isSameCompany(auth: AuthContext, companyId: string): boolean {
  return auth.status === "active" && auth.companyId === companyId;
}

export function canAccessOwnResource(
  auth: AuthContext,
  ownerUserId: string,
): boolean {
  return auth.status === "active" && auth.uid === ownerUserId;
}

export function canAccessCompanyResource(
  auth: AuthContext,
  target: { companyId: string; ownerUserId?: string },
  permission?: Permission,
): boolean {
  if (!isSameCompany(auth, target.companyId)) {
    return false;
  }

  if (target.ownerUserId && canAccessOwnResource(auth, target.ownerUserId)) {
    return true;
  }

  if (!permission) {
    return true;
  }

  return hasPermission(auth, permission);
}
