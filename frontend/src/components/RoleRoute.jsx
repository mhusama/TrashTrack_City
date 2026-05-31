import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../config/roles.js";

export function RoleRoute({ allowedRoles, allowedCrewSubRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-black">Loading…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role, user.crewSubRole)} replace />;
  }

  if (
    allowedCrewSubRoles?.length &&
    user.role === "cleaning_crew" &&
    !allowedCrewSubRoles.includes(user.crewSubRole)
  ) {
    return <Navigate to={homePathForRole(user.role, user.crewSubRole)} replace />;
  }

  return children;
}
