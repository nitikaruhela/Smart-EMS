export const VALID_USER_ROLES = ["Organizer", "Attendee"];

export function normalizeUserRole(role, fallbackRole = null) {
  if (typeof role !== "string") {
    return fallbackRole;
  }

  const normalizedRole = VALID_USER_ROLES.find(
    (allowedRole) => allowedRole.toLowerCase() === role.trim().toLowerCase()
  );

  return normalizedRole || fallbackRole;
}
