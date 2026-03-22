import { useState, useEffect } from "react";
import {
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  FileText,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { useNotification } from "../hooks/useNotification";

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  photo_path?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  created_by_username?: string;
}

interface Permission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_open_drawer: boolean;
}

interface AuditLog {
  id: number;
  action: string;
  details: string;
  created_at: string;
  user_username: string;
  user_first_name: string;
  user_last_name: string;
  target_username?: string;
  target_first_name?: string;
  target_last_name?: string;
}

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const { success, error } = useNotification();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "cajero",
    is_active: true,
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [permissions, setPermissions] = useState<Permission[]>([]);

  const roles = [
    {
      value: "admin",
      label: "Administrador",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "gerente",
      label: "Gerente",
      color: "bg-purple-100 text-purple-800",
    },
    { value: "cajero", label: "Cajero", color: "bg-blue-100 text-blue-800" },
    {
      value: "monitor",
      label: "Monitor",
      color: "bg-green-100 text-green-800",
    },
  ];

  const modules = [
    { id: "dashboard",        name: "Dashboard" },
    { id: "operations",       name: "Operaciones" },
    { id: "pos",              name: "Punto de Venta",   hasDrawer: true },
    { id: "clients",          name: "Clientes" },
    { id: "memberships",      name: "Membresías" },
    { id: "quotations",       name: "Cotizaciones" },
    { id: "reservations",     name: "Reservaciones" },
    { id: "promotions",       name: "Promociones" },
    { id: "inventory",        name: "Inventario" },
    { id: "internal",         name: "Gestión Interna" },
    { id: "reports",          name: "Reportes" },
    { id: "users",            name: "Usuarios" },
    { id: "settings",         name: "Configuración" },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await (window.api as any).getUsers();
      setUsers(data);
    } catch (err) {
      error("Error cargando usuarios");
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await (window.api as any).getUserAuditLog(100);
      setAuditLogs(data);
    } catch (err) {
      error("Error cargando auditoría");
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "cajero",
        is_active: true,
      });
    }
    setShowModal(true);
  };

  // Verificar si es el último admin activo
  const isLastActiveAdmin = () => {
    if (!editingUser || editingUser.role !== "admin") return false;
    const activeAdmins = users.filter((u) => u.role === "admin" && u.is_active);
    return activeAdmins.length === 1 && formData.is_active;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) return error("El campo 'Usuario' es obligatorio");
    if (!formData.first_name.trim()) return error("El campo 'Nombre' es obligatorio");
    if (!formData.last_name.trim()) return error("El campo 'Apellido' es obligatorio");
    if (!formData.role) return error("El campo 'Rol' es obligatorio");

    if (!editingUser && !formData.password) {
      error("El campo 'Contraseña' es obligatorio para nuevos usuarios");
      return;
    }

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const currentUserId = currentUser.id || 1; // Default al admin si no hay usuario

      if (editingUser) {
        await (window.api as any).updateUser(
          editingUser.id,
          {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            is_active: formData.is_active,
          },
          currentUserId,
        );
        success("Usuario actualizado");
      } else {
        await (window.api as any).createUser(
          {
            username: formData.username,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
          },
          currentUserId,
        );
        success("Usuario creado");
      }

      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      error(err.message || "Error guardando usuario");
    }
  };

  const handleDelete = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const currentUserId = currentUser.id || 1;

      await (window.api as any).deleteUser(userToDelete.id, currentUserId);
      success("Usuario desactivado");
      loadUsers();
    } catch (err: any) {
      error(err.message || "Error desactivando usuario");
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleOpenPermissions = async (userId: number) => {
    try {
      const userData = await (window.api as any).getUserById(userId);
      setSelectedUserId(userId);

      // Inicializar permisos
      const userPermissions = modules.map((module) => {
        const existing = userData.permissions.find(
          (p: any) => p.module === module.id,
        );
        return {
          module: module.id,
          can_view: existing?.can_view || false,
          can_create: existing?.can_create || false,
          can_edit: existing?.can_edit || false,
          can_delete: existing?.can_delete || false,
          can_open_drawer: existing?.can_open_drawer || false,
        };
      });

      setPermissions(userPermissions);
      setShowPermissionsModal(true);
    } catch (err) {
      error("Error cargando permisos");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const currentUserId = currentUser.id || 1;

      // Obtener los datos actuales del usuario
      const user = users.find((u) => u.id === selectedUserId);
      if (!user) {
        error("Usuario no encontrado");
        return;
      }

      await (window.api as any).updateUser(
        selectedUserId,
        {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_active: user.is_active,
          permissions,
        },
        currentUserId,
      );
      success("Permisos actualizados");
      setShowPermissionsModal(false);
      loadUsers(); // Recargar usuarios para actualizar la lista
    } catch (err: any) {
      error(err.message || "Error guardando permisos");
    }
  };

  const handleOpenPasswordModal = (userId: number) => {
    setSelectedUserId(userId);
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUserId) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );
      const currentUserId = currentUser.id || 1; // Default al admin si no hay usuario

      await (window.api as any).changePassword(
        selectedUserId,
        passwordData.newPassword,
        currentUserId,
      );
      success("Contraseña cambiada");
      setShowPasswordModal(false);
    } catch (err) {
      error("Error cambiando contraseña");
    }
  };

  const handleOpenAudit = () => {
    loadAuditLogs();
    setShowAuditModal(true);
  };

  const getRoleBadge = (role: string) => {
    const roleData = roles.find((r) => r.value === role);
    return roleData ? (
      <Badge className={roleData.color}>{roleData.label}</Badge>
    ) : (
      <Badge>{role}</Badge>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-gray-500">
              Control de acceso y permisos del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenAudit}
              variant="outline"
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Auditoría
            </Button>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold">
                  Nombre Completo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold">
                  Contacto
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold w-40">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {user.first_name.charAt(0)}
                        {user.last_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {user.email && <div>{user.email}</div>}
                      {user.phone && (
                        <div className="text-gray-500">{user.phone}</div>
                      )}
                      {!user.email && !user.phone && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user.is_active ? (
                      <Badge className="bg-green-100 text-green-800 gap-1">
                        <UserCheck className="w-3 h-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 gap-1">
                        <UserX className="w-3 h-3" />
                        Inactivo
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString("es-ES")
                      : "Nunca"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(user)}
                        title="Editar"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenPermissions(user.id)}
                        title="Permisos"
                        className="h-8 w-8 p-0"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenPasswordModal(user.id)}
                        title="Cambiar contraseña"
                        className="h-8 w-8 p-0"
                      >
                        <Key className="w-4 h-4 text-orange-600" />
                      </Button>
                      {user.role !== "admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                          title="Desactivar"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-white border-0">
              <form onSubmit={handleSubmit} noValidate>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Usuario * {editingUser && "(no editable)"}
                      </label>
                      <Input
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        disabled={!!editingUser}
                        placeholder="usuario123"
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Contraseña *
                        </label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nombre *
                      </label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        placeholder="Juan"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Apellido *
                      </label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        placeholder="Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Teléfono
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="555-0001"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Rol *
                      </label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                      >
                        {roles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {editingUser && (
                      <div className="col-span-2">
                        <label className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100">
                          <span className="text-sm font-medium">
                            Usuario Activo
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!isLastActiveAdmin()) {
                                setFormData({
                                  ...formData,
                                  is_active: !formData.is_active,
                                });
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              formData.is_active
                                ? "bg-green-600"
                                : "bg-gray-300"
                            } ${isLastActiveAdmin() ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={isLastActiveAdmin()}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                formData.is_active
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </label>
                        {isLastActiveAdmin() && (
                          <p className="text-xs text-amber-600 mt-1">
                            No se puede desactivar el último administrador
                            activo
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {editingUser && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      Para cambiar la contraseña, use el botón de "Cambiar
                      Contraseña" en la lista de usuarios.
                    </div>
                  )}
                </div>

                <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {editingUser ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </Dialog>
      )}
      {/* Modal Permisos */}
      {showPermissionsModal && (
        <Dialog
          open={showPermissionsModal}
          onOpenChange={setShowPermissionsModal}
        >
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col bg-white border-0">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Configurar Permisos
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Módulo
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Ver</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Crear</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Editar</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {modules.map((module, index) => (
                      <tr key={module.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          <div>{module.name}</div>
                          {(module as any).hasDrawer && (
                            <label className="flex items-center gap-2 mt-2 text-xs text-slate-600 font-normal cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={permissions[index]?.can_open_drawer || false}
                                onChange={(e) => {
                                  const newPerms = [...permissions];
                                  newPerms[index].can_open_drawer = e.target.checked;
                                  setPermissions(newPerms);
                                }}
                                className="w-3.5 h-3.5 cursor-pointer accent-amber-500"
                              />
                              <span className="text-amber-700 font-medium">💰 Permiso: Abrir Cajón</span>
                            </label>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[index]?.can_view || false}
                            onChange={(e) => {
                              const newPerms = [...permissions];
                              newPerms[index].can_view = e.target.checked;
                              setPermissions(newPerms);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[index]?.can_create || false}
                            onChange={(e) => {
                              const newPerms = [...permissions];
                              newPerms[index].can_create = e.target.checked;
                              setPermissions(newPerms);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[index]?.can_edit || false}
                            onChange={(e) => {
                              const newPerms = [...permissions];
                              newPerms[index].can_edit = e.target.checked;
                              setPermissions(newPerms);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[index]?.can_delete || false}
                            onChange={(e) => {
                              const newPerms = [...permissions];
                              newPerms[index].can_delete = e.target.checked;
                              setPermissions(newPerms);
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionsModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Guardar Permisos
                </Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border-0">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-600 to-orange-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Key className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Cambiar Contraseña
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nueva Contraseña *
                  </label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirmar Contraseña *
                  </label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repetir contraseña"
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleChangePassword}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Modal Auditoría */}
      {showAuditModal && (
        <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col bg-white border-0">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-slate-700 to-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Auditoría de Usuarios
                  </h2>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Fecha/Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Acción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Usuario Afectado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {new Date(log.created_at).toLocaleString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.user_first_name} {log.user_last_name}
                          <div className="text-xs text-gray-500">
                            @{log.user_username}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${
                            log.action === 'MANUAL_DRAWER_OPEN' 
                              ? 'bg-orange-100 text-orange-800 border-orange-200' 
                              : ''
                          }`}>
                            {(() => {
                              switch(log.action) {
                                case 'CREATE_USER': return 'Crear Usuario';
                                case 'UPDATE_USER': return 'Actualizar Usuario';
                                case 'DELETE_USER': return 'Desactivar Usuario';
                                case 'CHANGE_PASSWORD': return 'Cambiar Contraseña';
                                case 'MANUAL_DRAWER_OPEN': return 'Apertura de Cajón';
                                default: return log.action;
                              }
                            })()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.target_username ? (
                            <>
                              {log.target_first_name} {log.target_last_name}
                              <div className="text-xs text-gray-500">
                                @{log.target_username}
                              </div>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {auditLogs.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No hay registros de auditoría
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAuditModal(false)}
                >
                  Cerrar
                </Button>
              </div>
            </Card>
          </div>
        </Dialog>
      )}

      {/* Dialog de confirmación para desactivar usuario */}
      {showDeleteConfirm && userToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-slate-800 border-slate-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ¿Desactivar usuario?
                </h3>
                <p className="text-slate-300 text-sm mb-2">
                  Está a punto de desactivar al usuario:
                </p>
                <p className="text-white font-semibold text-base mb-4">
                  {userToDelete.first_name} {userToDelete.last_name} (
                  {userToDelete.username})
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  El usuario no podrá iniciar sesión hasta que sea reactivado.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Desactivar
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </Dialog>
      )}
    </div>
  );
}
