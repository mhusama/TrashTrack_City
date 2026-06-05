import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDashboardNav } from "../context/DashboardNavContext.jsx";

export default function useDashboardView({
  activeView,
  setActiveView,
  onViewChange,
  extraStateHandlers,
}) {
  const location = useLocation();
  const { setActiveView: setNavView, registerOnViewChange } = useDashboardNav();

  useEffect(() => {
    return registerOnViewChange(onViewChange);
  }, [onViewChange, registerOnViewChange]);

  useEffect(() => {
    setNavView(activeView);
  }, [activeView, setNavView]);

  useEffect(() => {
    const nextView = location.state?.view;
    if (!nextView) return;

    onViewChange(nextView);
    extraStateHandlers?.(nextView, location.state);
    window.history.replaceState({}, document.title);
  }, [location.state, onViewChange, extraStateHandlers]);
}
