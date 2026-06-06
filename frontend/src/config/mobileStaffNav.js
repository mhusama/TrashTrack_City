import {
  AlertCircle,
  BarChart3,
  ClipboardList,
  Home,
  Map,
  MessageSquare,
  Users,
  User,
} from "lucide-react";

export function staffDashboardPath(role, crewSubRole = "") {
  if (role === "admin") return "/admin";
  if (crewSubRole === "team_leader") return "/crew/leader";
  return "/crew/member";
}

export const ADMIN_PRIMARY_NAV = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "reports", label: "Reports", icon: ClipboardList },
  { id: "map", label: "Map", icon: Map },
  { id: "pending", label: "Tasks", icon: AlertCircle },
];

export const ADMIN_MORE_NAV = [
  { id: "teams", label: "Teams", icon: Users },
  { id: "community-feed", label: "Community", icon: MessageSquare },
  { id: "resident-messages", label: "Messages", icon: MessageSquare },
  { id: "resident-activities", label: "Residents", icon: User },
  { id: "leadership-chat", label: "Admin Chat", icon: MessageSquare },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "profile", label: "Edit Profile", icon: User, route: "/profile" },
];

export const CREW_LEADER_PRIMARY_NAV = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "map", label: "Map", icon: Map },
  { id: "team", label: "Team", icon: Users },
];

export const CREW_LEADER_MORE_NAV = [
  { id: "team-chat", label: "Team Chat", icon: MessageSquare },
  { id: "chat", label: "All Teams", icon: MessageSquare },
  { id: "leadership-chat", label: "Admin Chat", icon: MessageSquare },
  { id: "community-feed", label: "Community", icon: MessageSquare },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "profile", label: "Edit Profile", icon: User, route: "/profile" },
];

export const CREW_MEMBER_PRIMARY_NAV = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "map", label: "Map", icon: Map },
  { id: "team", label: "Team", icon: Users },
];

export const CREW_MEMBER_MORE_NAV = [
  { id: "team-chat", label: "Team Chat", icon: MessageSquare },
  { id: "chat", label: "All Teams", icon: MessageSquare },
  { id: "community-feed", label: "Community", icon: MessageSquare },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "profile", label: "Edit Profile", icon: User, route: "/profile" },
];

export function getStaffNavConfig(variant) {
  switch (variant) {
    case "admin":
      return { primary: ADMIN_PRIMARY_NAV, more: ADMIN_MORE_NAV };
    case "crew-leader":
      return { primary: CREW_LEADER_PRIMARY_NAV, more: CREW_LEADER_MORE_NAV };
    case "crew-member":
      return { primary: CREW_MEMBER_PRIMARY_NAV, more: CREW_MEMBER_MORE_NAV };
    default:
      return { primary: [], more: [] };
  }
}

export function resolveStaffNavActive(item, pathname, basePath, activeView) {
  if (item.route) return pathname === item.route;
  if (pathname.startsWith(`${basePath}/`)) {
    if (item.id === "reports") return pathname.includes("/reports/");
    if (item.id === "tasks") return pathname.includes("/reports/");
    if (item.id === "pending") return pathname.includes("/pending/");
  }
  if (pathname !== basePath) return false;
  if (item.id === "dashboard") return !activeView || activeView === "dashboard";
  return activeView === item.id;
}
