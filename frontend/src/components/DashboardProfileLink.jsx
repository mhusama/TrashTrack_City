import { NavLink } from "react-router-dom";

export default function DashboardProfileLink() {
  return (
    <li className="mt-4 border-t border-[#fce1ee] pt-4">
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `admin-sidebar-link block w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            isActive
              ? "border-[#6b0f1a] bg-[#6b0f1a] text-white"
              : "border-[#fce1ee] text-black hover:bg-[#fce1ee]"
          }`
        }
      >
        Edit Profile
      </NavLink>
    </li>
  );
}
