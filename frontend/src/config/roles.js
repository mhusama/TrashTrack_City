export const ROLES = [
  { value: "resident", label: "Resident" },
  { value: "admin", label: "Admin" },
  { value: "cleaning_crew", label: "Cleaning Crew" },
];

export function roleLabel(role) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function homePathForRole(role, crewSubRole = "") {
  switch (role) {
    case "admin":
      return "/admin";
    case "cleaning_crew":
      return crewSubRole === "team_leader" ? "/crew/leader" : "/crew/member";
    default:
      return "/";
  }
}
