import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { RoleRoute } from "./components/RoleRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { homePathForRole } from "./config/roles.js";
import HomePage from "./pages/HomePage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import TeamLeaderDashboardPage from "./pages/TeamLeaderDashboardPage.jsx";
import TeamMemberDashboardPage from "./pages/TeamMemberDashboardPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import NewReportPage from "./pages/NewReportPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import AdminReportDetailPage from "./pages/AdminReportDetailPage.jsx";
import AdminPendingApprovalDetailPage from "./pages/AdminPendingApprovalDetailPage.jsx";
import ResidentReportDetailPage from "./pages/ResidentReportDetailPage.jsx";
import TeamLeaderReportDetailPage from "./pages/TeamLeaderReportDetailPage.jsx";
import TeamMemberReportDetailPage from "./pages/TeamMemberReportDetailPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={homePathForRole(user.role, user.crewSubRole)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RootIndex />} />
        <Route
          path="admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="crew/leader"
          element={
            <RoleRoute allowedRoles={["cleaning_crew"]} allowedCrewSubRoles={["team_leader"]}>
              <TeamLeaderDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="crew/member"
          element={
            <RoleRoute allowedRoles={["cleaning_crew"]} allowedCrewSubRoles={["team_member"]}>
              <TeamMemberDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="crew"
          element={
            <RoleRoute allowedRoles={["cleaning_crew"]}>
              <CrewRedirect />
            </RoleRoute>
          }
        />
        <Route
          path="login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />
        <Route
          path="register"
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
        />
        <Route
          path="admin/reports/:id"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminReportDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/pending/:id"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <AdminPendingApprovalDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="crew/leader/reports/:id"
          element={
            <RoleRoute allowedRoles={["cleaning_crew"]} allowedCrewSubRoles={["team_leader"]}>
              <TeamLeaderReportDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="crew/member/reports/:id"
          element={
            <RoleRoute allowedRoles={["cleaning_crew"]} allowedCrewSubRoles={["team_member"]}>
              <TeamMemberReportDetailPage />
            </RoleRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route
          path="map"
          element={
            <RoleRoute allowedRoles={["resident"]}>
              <MapPage />
            </RoleRoute>
          }
        />
        <Route
          path="reports/new"
          element={
            <RoleRoute allowedRoles={["resident"]}>
              <NewReportPage />
            </RoleRoute>
          }
        />
        <Route
          path="reports/:id"
          element={
            <RoleRoute allowedRoles={["resident"]}>
              <ResidentReportDetailPage />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function CrewRedirect() {
  const { user } = useAuth();
  return (
    <Navigate
      to={user?.crewSubRole === "team_leader" ? "/crew/leader" : "/crew/member"}
      replace
    />
  );
}

function RootIndex() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-black">
        Loading…
      </div>
    );
  }
  if (!user) return <LandingPage />;
  if (user.role === "admin") {
    return (
      <RoleRoute allowedRoles={["admin"]}>
        <AdminDashboardPage />
      </RoleRoute>
    );
  }
  if (user.role === "cleaning_crew") {
    return (
      <Navigate
        to={user.crewSubRole === "team_leader" ? "/crew/leader" : "/crew/member"}
        replace
      />
    );
  }
  return (
    <RoleRoute allowedRoles={["resident"]}>
      <HomePage />
    </RoleRoute>
  );
}
