// The database role names stay the same; only the UI wording changes.
export const ROLE_LABELS = {
  super_admin: "Super Admin",
  principal: "Centre Admin",
  teacher: "Teacher",
  student: "Student",
  admin: "Admin",
};

export const roleLabel = (name) => ROLE_LABELS[name] || name;

export const rolesLabel = (roles = []) => roles.map(roleLabel).join(", ");

export const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");