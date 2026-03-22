// API de Gestión de Usuarios
const bcrypt = require("bcryptjs");
const { runAsync, getAsync, allAsync } = require("./database-pg.cjs");

const SALT_ROUNDS = 10;

// Módulos disponibles en el sistema
const AVAILABLE_MODULES = [
  "dashboard",
  "operations",
  "pos",
  "clients",
  "inventory",
  "reports",
  "settings",
  "users", // Solo admin
];

// ==================== USUARIOS ====================

/**
 * Crear primer usuario admin (solo si no existen usuarios)
 */
async function createFirstAdmin() {
  try {
    const existingUsers = await allAsync("SELECT COUNT(*) as count FROM users");

    if (existingUsers[0].count > 0) {
      return { success: false, message: "Ya existen usuarios en el sistema" };
    }

    const hashedPassword = await bcrypt.hash("admin123", SALT_ROUNDS);

    const result = await runAsync(
      `INSERT INTO users (username, password, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ["admin", hashedPassword, "Administrador", "Sistema", "admin", true],
    );

    const userId = result.rows[0].id;

    // Dar permisos completos al admin
    for (const module of AVAILABLE_MODULES) {
      await runAsync(
        `INSERT INTO user_permissions (user_id, module, can_view, can_create, can_edit, can_delete)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, module, true, true, true, true],
      );
    }

    return {
      success: true,
      userId: userId,
      message: "Usuario admin creado. Usuario: admin, Contraseña: admin123",
    };
  } catch (error) {
    console.error("Error creando primer admin:", error);
    throw error;
  }
}

/**
 * Autenticar usuario
 */
async function authenticateUser(username, password) {
  try {
    const user = await getAsync(
      "SELECT * FROM users WHERE username = $1 AND is_active = TRUE",
      [username],
    );

    if (!user) {
      return { success: false, message: "Usuario o contraseña incorrectos" };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { success: false, message: "Usuario o contraseña incorrectos" };
    }

    // Actualizar último login
    await runAsync(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    );

    // Obtener permisos
    const permissions = await allAsync(
      "SELECT * FROM user_permissions WHERE user_id = ?",
      [user.id],
    );

    // No devolver el password
    delete user.password;

    return {
      success: true,
      user: {
        ...user,
        permissions: permissions,
      },
    };
  } catch (error) {
    console.error("Error autenticando usuario:", error);
    throw error;
  }
}

/**
 * Obtener todos los usuarios
 */
async function getUsers() {
  try {
    const users = await allAsync(
      `SELECT 
        u.id, u.username, u.first_name, u.last_name, u.email, u.phone,
        u.photo_path, u.role, u.is_active, u.last_login, u.created_at,
        creator.username as created_by_username,
        updater.username as updated_by_username
       FROM users u
       LEFT JOIN users creator ON u.created_by = creator.id
       LEFT JOIN users updater ON u.updated_by = updater.id
       ORDER BY u.created_at DESC`,
    );

    return users;
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    throw error;
  }
}

/**
 * Obtener usuario por ID con permisos
 */
async function getUserById(userId) {
  try {
    const user = await getAsync(
      `SELECT 
        u.id, u.username, u.first_name, u.last_name, u.email, u.phone,
        u.photo_path, u.role, u.is_active, u.last_login, u.created_at,
        creator.username as created_by_username
       FROM users u
       LEFT JOIN users creator ON u.created_by = creator.id
       WHERE u.id = ?`,
      [userId],
    );

    if (!user) {
      return null;
    }

    const permissions = await allAsync(
      "SELECT * FROM user_permissions WHERE user_id = ?",
      [userId],
    );

    return {
      ...user,
      permissions: permissions,
    };
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    throw error;
  }
}

/**
 * Crear nuevo usuario
 */
async function createUser(userData, createdBy) {
  try {
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      phone,
      photo_path,
      role,
      permissions,
    } = userData;

    if (!username || !username.trim()) throw new Error("El usuario es obligatorio");
    if (!password) throw new Error("La contraseña es obligatoria");
    if (!first_name || !first_name.trim()) throw new Error("El nombre es obligatorio");
    if (!last_name || !last_name.trim()) throw new Error("El apellido es obligatorio");
    if (!role) throw new Error("El rol es obligatorio");

    // Verificar que el username no exista
    const existing = await getAsync("SELECT id FROM users WHERE username = ?", [
      username,
    ]);

    if (existing) {
      throw new Error("El nombre de usuario ya existe");
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear usuario
    const result = await runAsync(
      `INSERT INTO users 
       (username, password, first_name, last_name, email, phone, photo_path, role, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        email || null,
        phone || null,
        photo_path || null,
        role,
        createdBy,
      ],
    );

    const userId = result.lastID;

    // Crear permisos
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      for (const perm of permissions) {
        await runAsync(
          `INSERT INTO user_permissions 
           (user_id, module, can_view, can_create, can_edit, can_delete, can_open_drawer)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            perm.module,
            perm.can_view,
            perm.can_create,
            perm.can_edit,
            perm.can_delete,
            perm.can_open_drawer || false,
          ],
        );
      }
    } else {
      // Si no se proporcionan permisos, crear todos los módulos con permisos en false
      for (const module of AVAILABLE_MODULES) {
        await runAsync(
          `INSERT INTO user_permissions 
           (user_id, module, can_view, can_create, can_edit, can_delete, can_open_drawer)
           VALUES (?, ?, false, false, false, false, false)`,
          [userId, module],
        );
      }
    }

    // Registrar en auditoría
    await runAsync(
      `INSERT INTO user_audit_log (user_id, action, target_user_id, details)
       VALUES (?, ?, ?, ?)`,
      [
        createdBy,
        "CREATE_USER",
        userId,
        `Usuario ${username} creado con rol ${role}`,
      ],
    );

    return { success: true, userId: userId };
  } catch (error) {
    console.error("Error creando usuario:", error);
    throw error;
  }
}

/**
 * Actualizar usuario
 */
async function updateUser(userId, userData, updatedBy) {
  try {
    // Validar que updatedBy no sea null
    if (!updatedBy) {
      throw new Error("updatedBy es requerido para actualizar usuario");
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      photo_path,
      role,
      is_active,
      permissions,
    } = userData;

    if (!first_name || !first_name.trim()) throw new Error("El nombre es obligatorio");
    if (!last_name || !last_name.trim()) throw new Error("El apellido es obligatorio");
    if (!role) throw new Error("El rol es obligatorio");

    // Verificar si se está intentando desactivar el último admin
    if (is_active === false || is_active === 0) {
      const user = await getAsync("SELECT role FROM users WHERE id = ?", [
        userId,
      ]);

      if (user && user.role === "admin") {
        const activeAdminCount = await getAsync(
          "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = TRUE",
        );

        if (activeAdminCount.count <= 1) {
          throw new Error("No se puede desactivar el último administrador");
        }
      }
    }

    // Actualizar datos básicos
    await runAsync(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?, phone = ?, 
           photo_path = ?, role = ?, is_active = ?, 
           updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        first_name,
        last_name,
        email || null,
        phone || null,
        photo_path || null,
        role,
        is_active ? 1 : 0,
        updatedBy,
        userId,
      ],
    );

    // Actualizar permisos si se proporcionan
    if (permissions && Array.isArray(permissions)) {
      // Eliminar permisos existentes
      await runAsync("DELETE FROM user_permissions WHERE user_id = ?", [
        userId,
      ]);

      // Crear nuevos permisos
      for (const perm of permissions) {
        await runAsync(
          `INSERT INTO user_permissions 
           (user_id, module, can_view, can_create, can_edit, can_delete, can_open_drawer)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            perm.module,
            perm.can_view,
            perm.can_create,
            perm.can_edit,
            perm.can_delete,
            perm.can_open_drawer || false,
          ],
        );
      }
    }

    // Registrar en auditoría
    await runAsync(
      `INSERT INTO user_audit_log (user_id, action, target_user_id, details)
       VALUES (?, ?, ?, ?)`,
      [updatedBy, "UPDATE_USER", userId, `Usuario actualizado`],
    );

    return { success: true };
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    throw error;
  }
}

/**
 * Cambiar contraseña
 */
async function changePassword(userId, newPassword, changedBy) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await runAsync(
      `UPDATE users 
       SET password = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [hashedPassword, changedBy, userId],
    );

    // Registrar en auditoría
    await runAsync(
      `INSERT INTO user_audit_log (user_id, action, target_user_id, details)
       VALUES (?, ?, ?, ?)`,
      [changedBy, "CHANGE_PASSWORD", userId, `Contraseña cambiada`],
    );

    return { success: true };
  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    throw error;
  }
}

/**
 * Eliminar usuario (desactivar)
 */
async function deleteUser(userId, deletedBy) {
  try {
    // No permitir eliminar el último admin
    const adminCount = await getAsync(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = TRUE",
    );

    const user = await getAsync("SELECT role FROM users WHERE id = ?", [
      userId,
    ]);

    if (user.role === "admin" && adminCount.count <= 1) {
      throw new Error("No se puede eliminar el último administrador");
    }

    // Desactivar usuario
    await runAsync(
      `UPDATE users 
       SET is_active = FALSE, updated_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [deletedBy, userId],
    );

    // Registrar en auditoría
    await runAsync(
      `INSERT INTO user_audit_log (user_id, action, target_user_id, details)
       VALUES (?, ?, ?, ?)`,
      [deletedBy, "DELETE_USER", userId, `Usuario desactivado`],
    );

    return { success: true };
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    throw error;
  }
}

/**
 * Obtener log de auditoría de usuarios
 */
async function getUserAuditLog(limit = 100) {
  try {
    const logs = await allAsync(
      `SELECT 
        ual.id, ual.action, ual.details, ual.ip_address, ual.created_at,
        u.username as user_username,
        u.first_name as user_first_name,
        u.last_name as user_last_name,
        tu.username as target_username,
        tu.first_name as target_first_name,
        tu.last_name as target_last_name
       FROM user_audit_log ual
       LEFT JOIN users u ON ual.user_id = u.id
       LEFT JOIN users tu ON ual.target_user_id = tu.id
       ORDER BY ual.created_at DESC
       LIMIT ?`,
      [limit],
    );

    return logs;
  } catch (error) {
    console.error("Error obteniendo log de auditoría:", error);
    throw error;
  }
}

/**
 * Verificar si un usuario tiene permiso para un módulo
 */
async function checkPermission(userId, module, action) {
  try {
    const permission = await getAsync(
      `SELECT * FROM user_permissions 
       WHERE user_id = ? AND module = ?`,
      [userId, module],
    );

    if (!permission) {
      return false;
    }

    switch (action) {
      case "view":
        return permission.can_view === 1;
      case "create":
        return permission.can_create === 1;
      case "edit":
        return permission.can_edit === 1;
      case "delete":
        return permission.can_delete === true || permission.can_delete === 1;
      case "open_drawer":
        return (
          permission.can_open_drawer === true || permission.can_open_drawer === 1
        );
      default:
        return false;
    }
  } catch (error) {
    console.error("Error verificando permiso:", error);
    return false;
  }
}

module.exports = {
  createFirstAdmin,
  authenticateUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  getUserAuditLog,
  checkPermission,
  AVAILABLE_MODULES,
};
