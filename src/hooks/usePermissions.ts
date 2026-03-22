import { useState, useEffect } from "react";
import type { SystemUser } from "@/types";

export function usePermissions() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Error parsing user:", err);
      }
    }
  }, []);

  const hasPermission = (
    module: string,
    action: "view" | "create" | "edit" | "delete" | "open_drawer",
  ): boolean => {
    if (!currentUser) return false;

    // Admin siempre tiene todos los permisos
    if (currentUser.role === "admin") return true;

    // Buscar el permiso del módulo
    const permission = currentUser.permissions?.find(
      (p) => p.module === module,
    );

    if (!permission) return false;

    switch (action) {
      case "view":
        return permission.can_view;
      case "create":
        return permission.can_create;
      case "edit":
        return permission.can_edit;
      case "delete":
        return (permission as any).can_delete;
      case "open_drawer":
        return (permission as any).can_open_drawer;
      default:
        return false;
    }
  };

  const canView = (module: string) => hasPermission(module, "view");
  const canCreate = (module: string) => hasPermission(module, "create");
  const canEdit = (module: string) => hasPermission(module, "edit");
  const canDelete = (module: string) => hasPermission(module, "delete");
  const canOpenDrawer = (module: string) => {
    const perm = hasPermission(module, "open_drawer");
    console.log(`[DEBUG] canOpenDrawer("${module}") result:`, perm, "for user:", currentUser?.username, "role:", currentUser?.role);
    return perm;
  };

  return {
    currentUser,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canOpenDrawer,
  };
}
