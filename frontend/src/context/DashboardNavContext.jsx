import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const DashboardNavContext = createContext({
  activeView: "dashboard",
  setActiveView: () => {},
  onViewChange: () => {},
  registerOnViewChange: () => () => {},
});

export function DashboardNavProvider({ children }) {
  const [activeView, setActiveView] = useState("dashboard");
  const viewChangeRef = useRef((view) => setActiveView(view));

  const registerOnViewChange = useCallback((handler) => {
    viewChangeRef.current = handler || ((view) => setActiveView(view));
    return () => {
      viewChangeRef.current = (view) => setActiveView(view);
    };
  }, []);

  const onViewChange = useCallback((view) => {
    viewChangeRef.current(view);
  }, []);

  const value = useMemo(
    () => ({ activeView, setActiveView, onViewChange, registerOnViewChange }),
    [activeView, onViewChange, registerOnViewChange]
  );

  return (
    <DashboardNavContext.Provider value={value}>{children}</DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  return useContext(DashboardNavContext);
}
