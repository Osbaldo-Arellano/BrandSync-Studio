"use client";

import { createContext, useContext } from "react";
import { MODULE_DEFAULTS, type Modules } from "@/config/modules";

const ModulesContext = createContext<Modules>(MODULE_DEFAULTS);

export function ModulesProvider({
  modules,
  children,
}: {
  modules: Modules;
  children: React.ReactNode;
}) {
  return (
    <ModulesContext.Provider value={modules}>
      {children}
    </ModulesContext.Provider>
  );
}

export function useModules(): Modules {
  return useContext(ModulesContext);
}
