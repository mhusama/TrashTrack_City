import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";

import { homePathForRole, roleLabel } from "../config/roles.js";

import { mediaUrl } from "../utils/mediaUrl.js";

import useIsMobile from "../hooks/useIsMobile.js";

import { DashboardNavProvider } from "../context/DashboardNavContext.jsx";

import MobileResidentNav from "./MobileResidentNav.jsx";

import MobileStaffNav from "./MobileStaffNav.jsx";

import MobileStaffHeader from "./MobileStaffHeader.jsx";



const navClass = ({ isActive }) =>

  isActive ? "nav-link nav-link-active" : "nav-link";



const CREW_SUB_ROLE_LABELS = {

  team_leader: "Team Leader",

  team_member: "Team Member",

};



export default function Layout() {

  const { user, logout } = useAuth();

  const location = useLocation();

  const isMobile = useIsMobile();

  const dashboardPath = user ? homePathForRole(user.role) : "/";

  const isGuest = !user;

  const isResidentMobile = isMobile && user?.role === "resident";

  const isAdminMobile = isMobile && user?.role === "admin";

  const isCrewLeaderMobile = isMobile && user?.role === "cleaning_crew" && user?.crewSubRole === "team_leader";

  const isCrewMemberMobile = isMobile && user?.role === "cleaning_crew" && user?.crewSubRole === "team_member";

  const isStaffMobile = isAdminMobile || isCrewLeaderMobile || isCrewMemberMobile;

  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password", "/profile"].includes(

    location.pathname

  );



  return (

    <div

      className={`min-h-screen bg-white ${

        isResidentMobile || isStaffMobile ? "mobile-dashboard-shell" : ""

      } ${isGuest && isMobile ? "mobile-guest-shell" : ""}`}

    >

      <header

        className={`site-navbar ${isGuest && isMobile ? "site-navbar--mobile-guest" : ""} ${

          isResidentMobile ? "site-navbar--mobile-resident" : ""

        } ${isStaffMobile ? "site-navbar--mobile-staff" : ""}`}

      >

        {isGuest && isMobile ? (

          <div className="mobile-guest-header">

            <Link to="/" className="mobile-header-logo mobile-guest-header-logo" aria-label="Trash Track City home">

              <img src="/logo.png" alt="Trash Track City" />

            </Link>

            <span className="mobile-guest-header-title">TrashTrack City</span>

            <NavLink to="/login" className="mobile-guest-header-signin">

              Sign in

            </NavLink>

          </div>

        ) : isResidentMobile ? (

          <div className="mobile-resident-header">

            <Link to="/" className="mobile-header-logo mobile-resident-header-logo" aria-label="Trash Track City home">

              <img src="/logo.png" alt="Trash Track City" />

            </Link>

            <div className="mobile-resident-header-meta">

              <span className="mobile-resident-header-name">{user.name}</span>

              <span className="mobile-resident-header-role">{roleLabel(user.role)}</span>

            </div>

            <button

              type="button"

              onClick={logout}

              className="mobile-resident-header-logout"

              aria-label="Log out"

            >

              <LogOut className="h-5 w-5" />

            </button>

          </div>

        ) : isStaffMobile ? (

          <MobileStaffHeader

            user={user}

            logout={logout}

            crewSubRoleLabel={

              user.role === "cleaning_crew"

                ? CREW_SUB_ROLE_LABELS[user.crewSubRole] || user.crewSubRole

                : null

            }

          />

        ) : (

          <div className="header-bar grid grid-cols-[1fr_auto_1fr] items-center gap-4">

            <Link to={dashboardPath} className="logo-link justify-self-start" aria-label="Trash Track City home">

              <img src="/logo.png" alt="Trash Track City" className="header-logo" />

            </Link>



            <nav className="flex flex-wrap items-center justify-center gap-1 justify-self-center">

              {user ? (

                <>

                  {user.role === "cleaning_crew" && (

                    <NavLink to="/crew" className={navClass}>

                      Dashboard

                    </NavLink>

                  )}

                </>

              ) : (

                <span className="header-nav-title header-guest-brand text-2xl font-bold">TrashTrack City</span>

              )}

            </nav>



            <div className="header-actions flex items-center justify-end gap-3 text-black justify-self-end">

              {user ? (

                <>

                  {user.profilePicture ? (

                    <img

                      src={mediaUrl(user.profilePicture)}

                      alt=""

                      className="hidden h-9 w-9 rounded-full border border-theme-border object-cover sm:block"

                    />

                  ) : null}

                  <span className="header-username hidden font-bold sm:inline">{user.name}</span>

                  <span className="header-box">{roleLabel(user.role)}</span>

                  <button type="button" onClick={logout} className="header-box header-logout-btn">

                    <LogOut style={{ width: "1em", height: "1em" }} />

                    Logout

                  </button>

                </>

              ) : (

                <NavLink to="/login" className="guest-cta-btn header-btn">

                  Sign in

                </NavLink>

              )}

            </div>

          </div>

        )}

      </header>



      <DashboardNavProvider>

        <main

          className={`mx-auto px-4 text-black ${

            isResidentMobile || isStaffMobile

              ? "mobile-dashboard-main py-4"

              : isMobile && isAuthPage

                ? "auth-page-main py-3"

                : "py-8"

          } ${

            user?.role === "admin" || user?.role === "resident"

              ? "max-w-[90rem]"

              : "max-w-6xl"

          }`}

        >

          <Outlet />

        </main>



        {isResidentMobile && <MobileResidentNav />}

        {isAdminMobile && <MobileStaffNav variant="admin" />}

        {isCrewLeaderMobile && <MobileStaffNav variant="crew-leader" />}

        {isCrewMemberMobile && <MobileStaffNav variant="crew-member" />}

      </DashboardNavProvider>

    </div>

  );

}


