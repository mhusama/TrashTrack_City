import { createContext, useContext, useMemo, useState } from "react";

const ResidentNavContext = createContext({
  homeView: "dashboard",
  setHomeView: () => {},
});

export function ResidentNavProvider({ children }) {
  const [homeView, setHomeView] = useState("dashboard");
  const value = useMemo(() => ({ homeView, setHomeView }), [homeView]);
  return (
    <ResidentNavContext.Provider value={value}>{children}</ResidentNavContext.Provider>
  );
}

export function useResidentNav() {
  return useContext(ResidentNavContext);
}
