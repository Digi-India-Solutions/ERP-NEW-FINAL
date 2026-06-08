import { connectDB } from "../pool.js";
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/auth.js";
import { uploadImageToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.util.js";
import sendEmail from "../../utils/sendEmail.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

const normalizeRoleKey = (value) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, "_");

/* ─────────────────────────────────────────────────────────────────────────────
   PERMISSION HELPERS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Build all-true permissions + controls for SUPER_ADMIN.
 * Mirrors the MODULE_GROUPS used in the frontend.
 */
const SUPER_ADMIN_PERMISSIONS = {
  sales_invoice:        { view: true, create: true, edit: true, delete: true },
  sale_return:          { view: true, create: true, edit: true, delete: true },
  challan:              { view: true, create: true, edit: true, delete: true },
  sales_payment:        { view: true, create: true },
  purchase_order:       { view: true, create: true, edit: true, delete: true },
  purchase_invoice:     { view: true, create: true, edit: true, delete: true },
  purchase_return:      { view: true, create: true, edit: true, delete: true },
  purchase_payment:     { view: true, create: true },
  stock_receiving:      { view: true, create: true },
  stock_transfer:       { view: true, create: true, edit: true, delete: true },
  stock_adjustment:     { view: true, create: true },
  stock_entries:        { view: true, create: true },
  grn_history:          { view: true },
  gate_pass_outward:    { view: true, create: true, edit: true },
  gate_pass_inward:     { view: true, create: true, edit: true },
  parties:              { view: true, create: true, edit: true, delete: true },
  items:                { view: true, create: true, edit: true, delete: true },
  warehouses:           { view: true, create: true, edit: true, delete: true },
  categories:           { view: true, create: true, edit: true, delete: true },
  units:                { view: true, create: true, edit: true, delete: true },
  report_stock_summary: { view: true },
  report_stock_ledger:  { view: true },
  report_low_stock:     { view: true },
  report_purchase_reg:  { view: true },
  report_gst_purchase:  { view: true },
  report_sales_reg:     { view: true },
  report_gst_sales:     { view: true },
  report_outstanding:   { view: true },
  report_day_book:      { view: true },
  report_party_ledger:  { view: true },
  users:                { view: true, create: true, edit: true, delete: true },
  settings:             { view: true, edit: true },
};

const SUPER_ADMIN_CONTROLS = {
  approveStockTransfer:   true,
  approveStockAdjustment: true,
  viewAllWarehouses:      true,
  exportData:             true,
  viewFinancialReports:   true,
  editLockedRecords:      true,
  convertChallan:         true,
  manageUserPermissions:  true,
};

/**
 * Given a user row (with .role, .permissions, .additional_controls from roles join),
 * return the resolved { permissions, additionalControls } object.
 *
 * For SUPER_ADMIN we always return the hardcoded full set.
 * For everyone else we read from user_permissions table (passed in directly).
 */
export const resolvePermissionsFromUserPerms = (userRow, userPermsRow) => {
  if (normalizeRoleKey(userRow.role) === "SUPER_ADMIN") {
    return {
      permissions:       SUPER_ADMIN_PERMISSIONS,
      additionalControls: SUPER_ADMIN_CONTROLS,
    };
  }
  return {
    permissions:        userPermsRow?.permissions        ?? {},
    additionalControls: userPermsRow?.additional_controls ?? {},
  };
};

/**
 * Merge role defaults + per-user overrides into a single permissions snapshot.
 * overrides shape: { module_key: { action: true|false } }
 * rolePermissions shape: { module_key: { view, create, edit, delete } }
 */
export const mergePermissions = (rolePermissions = {}, overrides = {}) => {
  const merged = JSON.parse(JSON.stringify(rolePermissions));
  for (const [mod, actions] of Object.entries(overrides)) {
    if (!merged[mod]) merged[mod] = {};
    for (const [action, val] of Object.entries(actions)) {
      merged[mod][action] = Boolean(val); // override always wins
    }
  }
  return merged;
};

export const mergeControls = (roleControls = {}, overrides = {}) => {
  const merged = { ...roleControls };
  for (const [key, val] of Object.entries(overrides)) {
    merged[key] = Boolean(val); // override always wins
  }
  return merged;
};
/**
 * Upsert one row in user_permissions for a user.
 * permissions and additionalControls are plain JS objects (stored as jsonb).
 */
export const upsertUserPermissionsJsonb = async (userId, permissions = {}, additionalControls = {}) => {
  await connectDB.query(
    `INSERT INTO user_permissions (user_id, permissions, additional_controls, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id)
     DO UPDATE SET
       permissions         = EXCLUDED.permissions,
       additional_controls = EXCLUDED.additional_controls,
       updated_at          = now()`,
    [userId, JSON.stringify(permissions), JSON.stringify(additionalControls)]
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   AUTH ENDPOINTS
───────────────────────────────────────────────────────────────────────────── */

export const  login = async (req, res) => {
  const { email, password } = req.body;
  console.log("fffff==>",req.body.email, req.body.password)
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email & password are required" });
    }

    const result = await connectDB.query(
      `SELECT u.*
       FROM users u
       WHERE u.email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    if (user.is_active === false) return res.status(403).json({ message: "User account is inactive" });

    // update last_login_at
    await connectDB.query(
      `UPDATE users SET last_login_at = now() WHERE id = $1`,
      [user.id]
    );

    // fetch user_permissions row
    const upResult = await connectDB.query(
      `SELECT permissions, additional_controls
       FROM user_permissions WHERE user_id = $1`,
      [user.id]
    );
    const userPermsRow = upResult.rows[0] ?? null;

    // fetch warehouse ids
    const warehouseResult = await connectDB.query(
      `SELECT warehouse_id::text AS warehouse_id
       FROM user_warehouses WHERE user_id = $1`,
      [user.id]
    );
    const warehouseIds = warehouseResult.rows.map((r) => r.warehouse_id);

    const { permissions, additionalControls } = resolvePermissionsFromUserPerms(user, userPermsRow);

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res
      .status(200)
      .cookie("token", accessToken, {
        httpOnly: true, secure: false, sameSite: "lax",
        maxAge: Number(process.env.ACCESS_TOKEN_COOKIE),
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true, secure: false, sameSite: "lax",
        maxAge: Number(process.env.REFRESH_TOKEN_COOKIE),
      })
      .json({
        success: true,
        message: "Login successful",
        data: {
          accessToken,
          user: {
            id:                user.id,
            name:              user.name,
            email:             user.email,
            role:              user.role,
            permissions,
            additionalControls,
            warehouseIds,
            companyId:         user.company_id,
          },
        },
      });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .clearCookie("token",        { httpOnly: true, secure: false, sameSite: "lax" })
      .clearCookie("refreshToken", { httpOnly: true, secure: false, sameSite: "lax" })
      .json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyLoggedIn = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await connectDB.query(
      `SELECT id, name, email, role, company_id, is_active
       FROM users WHERE id = $1`,
      [userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    // fetch user_permissions row
    const upResult = await connectDB.query(
      `SELECT permissions, additional_controls
       FROM user_permissions WHERE user_id = $1`,
      [userId]
    );
    const userPermsRow = upResult.rows[0] ?? null;

    const warehouseResult = await connectDB.query(
      `SELECT warehouse_id::text AS warehouse_id
       FROM user_warehouses WHERE user_id = $1`,
      [userId]
    );
    const warehouseIds = warehouseResult.rows.map((r) => r.warehouse_id);

    const { permissions, additionalControls } = resolvePermissionsFromUserPerms(user, userPermsRow);

    res.status(200).json({
      success: true,
      message: "User is authenticated",
      data: {
        id:                user.id,
        name:              user.name,
        email:             user.email,
        role:              user.role,
        permissions,
        additionalControls,
        warehouseIds,
        companyId:         user.company_id,
      },
    });
  } catch (error) {
    console.error("Verify User Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const ForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await connectDB.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await connectDB.query(
      `UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3`,
      [resetToken, expiry, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 10 minutes.</p>
    `;
    await sendEmail(user.email, "Reset Password", html);
    res.json({ message: "Reset link sent to email" });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const ResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const result = await connectDB.query(
      `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );
    const user = result.rows[0];
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await hashPassword(password);
    await connectDB.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2`,
      [hashedPassword, user.id]
    );
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const GetSingleUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await connectDB.query(
      `SELECT id, name, email, role, company_id FROM users WHERE id = $1`,
      [userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User fetched successfully", user });
  } catch (error) {
    console.error("Get User Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   USER MANAGEMENT (admin)
───────────────────────────────────────────────────────────────────────────── */

const extractRoleContext = (user) => {
  if (!user) return null;
  const roleId   = user.role_id   || user.roleId   || null;
  const roleName = user.role_name || user.roleName  || user.role || null;
  if (!roleId && !roleName && !user.role_permissions && !user.role_additional_controls) return null;
  return {
    id:                roleId || normalizeRoleKey(roleName),
    name:              roleName || roleId || "",
    permissions:       user.role_permissions       || user.permissions       || {},
    additionalControls: user.role_additional_controls || user.additional_controls || {},
    isActive:          user.role_is_active ?? true,
    createdAt:         user.role_created_at || user.created_at || new Date().toISOString(),
    createdBy:         user.role_created_by || "system",
  };
};

const toUserDTO = (user, warehouseIds = [], userPermsRow = null) => {
  const role = extractRoleContext(user);
  const { permissions, additionalControls } = resolvePermissionsFromUserPerms(user, userPermsRow);

  return {
    id:                     user.id,
    name:                   user.name,
    email:                  user.email,
    phone:                  user.phone || "",
    role:                   user.role,
    roleId:                 role?.id || normalizeRoleKey(user.role),
    roleName:               role?.name || user.role,
    rolePermissions:        role?.permissions || {},
    roleAdditionalControls: role?.additionalControls || {},
    isActive:               user.is_active,
    warehouseIds,
    permissions,
    additionalControls,
    createdAt:              user.created_at,
    lastActiveAt:           user.last_login_at || user.updated_at || user.created_at || null,
  };
};

const parseActiveFlag = ({ isActive, status }, fallback = true) => {
  if (typeof isActive === "boolean") return isActive;
  if (typeof status   === "string")  return status.toLowerCase() === "active";
  return fallback;
};

const upsertUserWarehouses = async (userId, warehouseIds = []) => {
  await connectDB.query("DELETE FROM user_warehouses WHERE user_id = $1", [userId]);
  for (let i = 0; i < warehouseIds.length; i++) {
    await connectDB.query(
      `INSERT INTO user_warehouses (user_id, warehouse_id, is_primary) VALUES ($1, $2, $3)`,
      [userId, warehouseIds[i], i === 0]
    );
  }
};

/**
 * Fetch user_permissions rows for a list of userIds.
 * Returns a Map<userId, { permissions, additional_controls }>.
 */
const fetchUserPermsMap = async (userIds) => {
  const map = new Map();
  if (!userIds.length) return map;
  const rows = await connectDB.query(
    `SELECT user_id::text AS user_id, permissions, additional_controls
     FROM user_permissions
     WHERE user_id::text = ANY($1::text[])`,
    [userIds]
  );
  for (const row of rows.rows) {
    map.set(row.user_id, { permissions: row.permissions, additional_controls: row.additional_controls });
  }
  return map;
};

const fetchUserRelations = async (userIds) => {
  const warehousesByUser = new Map();
  if (!userIds.length) return { warehousesByUser };

  const warehouseRows = await connectDB.query(
    `SELECT user_id::text AS user_id, warehouse_id::text AS warehouse_id
     FROM user_warehouses
     WHERE user_id::text = ANY($1::text[])
     ORDER BY created_at ASC`,
    [userIds]
  );
  for (const row of warehouseRows.rows) {
    const existing = warehousesByUser.get(row.user_id) || [];
    existing.push(row.warehouse_id);
    warehousesByUser.set(row.user_id, existing);
  }
  return { warehousesByUser };
};

const userWithRoleSelect = `
  SELECT
    u.id, u.name, u.email, u.phone, u.role, u.is_active,
    u.created_at, u.updated_at, u.last_login_at,
    r.id               AS role_id,
    r.name             AS role_name,
    r.permissions      AS role_permissions,
    r.additional_controls AS role_additional_controls,
    r.is_active        AS role_is_active,
    r.created_at       AS role_created_at,
    r.created_by       AS role_created_by
`;

const fetchRoleDefaults = async (companyId, roleName) => {
  if (!roleName) return { rolePermissions: {}, roleControls: {} };
  const roleRow = await connectDB.query(
    `SELECT permissions, additional_controls FROM roles
     WHERE company_id = $1 AND name = $2 AND is_active = true
     LIMIT 1`,
    [companyId, roleName]
  );
  return {
    rolePermissions: roleRow.rows[0]?.permissions         ?? {},
    roleControls:    roleRow.rows[0]?.additional_controls ?? {},
  };
};
const buildFinalPermissions = (role, rolePermissions, roleControls, permOverrides = {}, ctrlOverrides = {}) => {
  if (normalizeRoleKey(role) === "SUPER_ADMIN") {
    return {
      finalPermissions:    SUPER_ADMIN_PERMISSIONS,
      finalAdditionalCtrls: SUPER_ADMIN_CONTROLS,
    };
  }
  return {
    finalPermissions:     mergePermissions(rolePermissions, permOverrides),
    finalAdditionalCtrls: mergeControls(roleControls, ctrlOverrides),
  };
};
 
// export const createUserByAdmin = async (req, res) => {
//   const {
//     name, full_name, email, phone, role, password,
//     warehouseIds  = [],
//     permissions   = {},   // permissionOverrides object from frontend
//     additionalControls = {},
//     isActive, status,
//   } = req.body;

//   try {
//     const adminId    = req.user.id;
//     let company_id   = req.user.company_id || adminId;
//     const userName   = name || full_name;
//     const active     = parseActiveFlag({ isActive, status }, true);

//     if (!userName || !email || !role) {
//       return res.status(400).json({ message: "All required fields must be provided" });
//     }

//     const existingUser = await connectDB.query(
//       `SELECT id FROM users WHERE company_id = $1 AND email = $2`,
//       [company_id, email]
//     );
//     if (existingUser.rows.length > 0) {
//       return res.status(400).json({ message: "User already exists in this company" });
//     }

//     const defaultPassword = "User@123";
//     const finalPassword   = password || defaultPassword;
//     const hashedPassword  = await bcrypt.hash(finalPassword, 10);

//     // Insert user
//     const insertResult = await connectDB.query(
//       `INSERT INTO users (company_id, name, email, phone, password_hash, role, is_active, created_by)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
//        RETURNING id`,
//       [company_id, userName, email, phone || null, hashedPassword, role, active, adminId]
//     );
//     const newUserId = insertResult.rows[0].id;

//     // Fetch role defaults
//     const roleRow = await connectDB.query(
//       `SELECT permissions, additional_controls FROM roles
//        WHERE company_id = $1 AND name = $2 AND is_active = true
//        LIMIT 1`,
//       [company_id, role]
//     );
//     const roleDefaults         = roleRow.rows[0]?.permissions        ?? {};
//     const roleControlDefaults  = roleRow.rows[0]?.additional_controls ?? {};

//     // Merge role defaults + overrides → save to user_permissions
//     const finalPermissions      = mergePermissions(roleDefaults,        permissions);
//     // ✅ After — start from ALL known control keys defaulting to false
//   const EMPTY_CONTROLS = {
//     approveStockTransfer:   false,
//     approveStockAdjustment: false,
//     viewAllWarehouses:      false,
//     exportData:             false,
//     viewFinancialReports:   false,
//     editLockedRecords:      false,
//     convertChallan:         false,
//     manageUserPermissions:  false,
//   };

//   const finalAdditionalCtrls = {
//     ...EMPTY_CONTROLS,
//     ...roleControlDefaults,   // role grants some true
//     ...additionalControls,    // user overrides on top
//   };
//     await upsertUserPermissionsJsonb(newUserId, finalPermissions, finalAdditionalCtrls);

//     await upsertUserWarehouses(newUserId, Array.isArray(warehouseIds) ? warehouseIds : []);

//     // Fetch full user row for response
//     const createdUser = await connectDB.query(
//       `${userWithRoleSelect}
//        FROM users u
//        LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
//        WHERE u.id = $1`,
//       [newUserId]
//     );
//     const user        = createdUser.rows[0];
//     const userPermsRow = { permissions: finalPermissions, additional_controls: finalAdditionalCtrls };
//     const whMap       = await fetchUserRelations([String(newUserId)]);

//     res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       defaultPassword,
//       data: toUserDTO(user, whMap.warehousesByUser.get(String(newUserId)) || [], userPermsRow),
//     });
//   } catch (error) {
//     console.error("Create User Error:", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


export const createUserByAdmin = async (req, res) => {
  const {
    name, full_name, email, phone, role, password,
    warehouseIds       = [],
    permissions        = {},   // permission overrides from frontend
    additionalControls = {},
    isActive, status,
  } = req.body;
 
  try {
    const adminId    = req.user.id;
    const company_id = req.user.company_id || adminId;
    const userName   = (name || full_name || "").trim();
    const active     = parseActiveFlag({ isActive, status }, true);
 
    // ── Validation ────────────────────────────────────────────────────────────
    if (!userName || !email || !role) {
      return res.status(400).json({ message: "Name, email and role are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
 
    // ── Duplicate check ───────────────────────────────────────────────────────
    const existingUser = await connectDB.query(
      `SELECT id FROM users WHERE company_id = $1 AND email = $2`,
      [company_id, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }
 
    // ── Role exists check ─────────────────────────────────────────────────────
    if (normalizeRoleKey(role) !== "SUPER_ADMIN") {
      const roleCheck = await connectDB.query(
        `SELECT id FROM roles WHERE company_id = $1 AND name = $2 AND is_active = true LIMIT 1`,
        [company_id, role]
      );
      if (roleCheck.rows.length === 0) {
        return res.status(400).json({ message: `Role "${role}" not found or inactive` });
      }
    }
 
    // ── Password ──────────────────────────────────────────────────────────────
    const defaultPassword = password || "User@123";
    const hashedPassword  = await bcrypt.hash(defaultPassword, 10);
 
    // ── Insert user ───────────────────────────────────────────────────────────
    const insertResult = await connectDB.query(
      `INSERT INTO users (company_id, name, email, phone, password_hash, role, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [company_id, userName, email, phone || null, hashedPassword, role, active, adminId]
    );
    const newUserId = insertResult.rows[0].id;
 
    // ── Permissions ───────────────────────────────────────────────────────────
    const { rolePermissions, roleControls } = await fetchRoleDefaults(company_id, role);
    const { finalPermissions, finalAdditionalCtrls } = buildFinalPermissions(
      role, rolePermissions, roleControls, permissions, additionalControls
    );
 
    await upsertUserPermissionsJsonb(newUserId, finalPermissions, finalAdditionalCtrls);
 
    // ── Warehouses ────────────────────────────────────────────────────────────
    await upsertUserWarehouses(newUserId, Array.isArray(warehouseIds) ? warehouseIds : []);
 
    // ── Welcome email ─────────────────────────────────────────────────────────
    const isSuperAdmin = normalizeRoleKey(role) === "SUPER_ADMIN";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #4f46e5;">Welcome to the platform, ${userName}!</h2>
        <p>Your account has been created by an administrator. Here are your login credentials:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>Password:</strong> ${defaultPassword}</p>
          <p style="margin: 4px 0;"><strong>Role:</strong> ${role}</p>
        </div>
        <p style="color: #ef4444; font-size: 13px;">⚠️ Please change your password after your first login.</p>
        <a href="${process.env.FRONTEND_URL}/login"
           style="display: inline-block; padding: 10px 24px; background: #4f46e5; color: #fff;
                  text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 8px;">
          Login Now
        </a>
      </div>`;
 
    try {
      await sendEmail(email, "Your Account Has Been Created", html);
    } catch (mailErr) {
      // Don't fail the request if email fails — user is already created
      console.error("Welcome email failed:", mailErr.message);
    }
 
    // ── Build response ────────────────────────────────────────────────────────
    const createdUser = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE u.id = $1`,
      [newUserId]
    );
    const user         = createdUser.rows[0];
    const userPermsRow = { permissions: finalPermissions, additional_controls: finalAdditionalCtrls };
    const whMap        = await fetchUserRelations([String(newUserId)]);
 
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      ...(password ? {} : { defaultPassword }),  // only expose if auto-generated
      data: toUserDTO(user, whMap.warehousesByUser.get(String(newUserId)) || [], userPermsRow),
    });
  } catch (error) {
    console.error("Create User Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const company_id   = req.user.company_id || req.user.id;
    const page         = Number(req.query.page  || 1);
    const limit        = Number(req.query.limit || 50);
    const search       = (req.query.search   || "").toString().trim();
    const role         = (req.query.role     || "").toString().trim();
    const isActiveRaw  = (req.query.isActive || "").toString().trim();
    const offset       = (page - 1) * limit;

    const conditions = ["u.company_id = $1"];
    const values     = [company_id];
    let index        = 2;

    if (search) {
      conditions.push(`(u.name ILIKE $${index} OR u.email ILIKE $${index})`);
      values.push(`%${search}%`);
      index++;
    }
    if (role && role !== "ALL") {
      conditions.push(`u.role = $${index}`);
      values.push(role);
      index++;
    }
    if (isActiveRaw === "true" || isActiveRaw === "false") {
      conditions.push(`u.is_active = $${index}`);
      values.push(isActiveRaw === "true");
      index++;
    }

    const whereClause = conditions.join(" AND ");

    const totalResult = await connectDB.query(
      `SELECT COUNT(*)::int AS total FROM users u WHERE ${whereClause}`,
      values
    );
    const total = totalResult.rows[0]?.total || 0;

    const listValues = [...values, limit, offset];
    const result = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${index} OFFSET $${index + 1}`,
      listValues
    );

    const userIds = result.rows.map((r) => String(r.id));
    const { warehousesByUser } = await fetchUserRelations(userIds);
    const userPermsMap = await fetchUserPermsMap(userIds);

    const items = result.rows.map((row) =>
      toUserDTO(
        row,
        warehousesByUser.get(String(row.id)) || [],
        userPermsMap.get(String(row.id)) ?? null
      )
    );

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: { items, total, page, limit },
    });
  } catch (error) {
    console.error("Get All Users Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  const userId     = req.params.id;
  try {
    const company_id = req.user.company_id || req.user.id;
    const result = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE u.id = $1 AND u.company_id = $2`,
      [userId, company_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = result.rows[0];
    const { warehousesByUser } = await fetchUserRelations([String(user.id)]);
    const userPermsMap = await fetchUserPermsMap([String(user.id)]);

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: toUserDTO(user, warehousesByUser.get(String(user.id)) || [], userPermsMap.get(String(user.id)) ?? null),
    });
  } catch (error) {
    console.error("Get User By ID Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserByAdmin = async (req, res) => {
  const userId = req.params.id;
  const {
    name, full_name, email, phone, role, password,
    permissions,        // permissionOverrides object
    additionalControls,
    warehouseIds,
    isActive, status,
  } = req.body;

  try {
    const adminId    = req.user.id;
    const company_id = req.user.company_id || req.user.id;
    const active     = parseActiveFlag({ isActive, status });
    const finalName  = name || full_name;

    const userCheck = await connectDB.query(
      `SELECT id, role FROM users WHERE id = $1 AND company_id = $2`,
      [userId, company_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found in your company" });
    }

    // Build dynamic update fields
    const fields = [];
    const values = [];
    let index    = 1;

    const addField = (key, value) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    };

    addField("name",  finalName);
    addField("email", email);
    addField("phone", phone);
    addField("role",  role);
    if (typeof isActive === "boolean" || typeof status === "string") addField("is_active", active);
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      addField("password_hash", hashedPassword);
    }
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length > 1) {
      await connectDB.query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} AND company_id = $${index + 1}`,
        [...values, userId, company_id]
      );
    }

    if (Array.isArray(warehouseIds)) await upsertUserWarehouses(userId, warehouseIds);

    // Determine effective role (may have changed)
    const effectiveRole = role || userCheck.rows[0].role;
    const roleRow = await connectDB.query(
      `SELECT permissions, additional_controls FROM roles
       WHERE company_id = $1 AND name = $2 AND is_active = true LIMIT 1`,
      [company_id, effectiveRole]
    );
    const roleDefaults        = roleRow.rows[0]?.permissions         ?? {};
    const roleControlDefaults = roleRow.rows[0]?.additional_controls ?? {};

    // Merge and save to user_permissions if overrides were passed
    if (permissions !== undefined || additionalControls !== undefined || role !== undefined) {
      const finalPermissions     = mergePermissions(roleDefaults,        permissions        ?? {});
      // ✅ After — start from ALL known control keys defaulting to false
const EMPTY_CONTROLS = {
  approveStockTransfer:   false,
  approveStockAdjustment: false,
  viewAllWarehouses:      false,
  exportData:             false,
  viewFinancialReports:   false,
  editLockedRecords:      false,
  convertChallan:         false,
  manageUserPermissions:  false,
};

const finalAdditionalCtrls = {
  ...EMPTY_CONTROLS,
  ...roleControlDefaults,   // role grants some true
  ...additionalControls,    // user overrides on top
};
      await upsertUserPermissionsJsonb(userId, finalPermissions, finalAdditionalCtrls);
    }

    const updated = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE u.id = $1 AND u.company_id = $2`,
      [userId, company_id]
    );
    const user = updated.rows[0];
    const { warehousesByUser } = await fetchUserRelations([String(user.id)]);
    const userPermsMap = await fetchUserPermsMap([String(user.id)]);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: toUserDTO(user, warehousesByUser.get(String(user.id)) || [], userPermsMap.get(String(user.id)) ?? null),
    });
  } catch (error) {
    console.error("Update User Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  const userId = req.params.id;
  try {
    const company_id = req.user.company_id || req.user.id;

    const userCheck = await connectDB.query(
      `SELECT id, role FROM users WHERE id = $1 AND company_id = $2`,
      [userId, company_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found in your company" });
    }
    if (String(userCheck.rows[0].role).toUpperCase() === "SUPER_ADMIN") {
      return res.status(403).json({ message: "Cannot delete company admin" });
    }

    const updateResult = await connectDB.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2`,
      [userId, company_id]
    );

    const updatedUser = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE u.id = $1 AND u.company_id = $2`,
      [userId, company_id]
    );
    const user = updatedUser.rows[0];
    const { warehousesByUser } = await fetchUserRelations([String(user.id)]);
    const userPermsMap = await fetchUserPermsMap([String(user.id)]);

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: toUserDTO(user, warehousesByUser.get(String(user.id)) || [], userPermsMap.get(String(user.id)) ?? null),
    });
  } catch (error) {
    console.error("Delete User Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserPermissionsByAdmin = async (req, res) => {
  const { id } = req.params;
  const { permissions = {}, additionalControls = {}, warehouseIds } = req.body;

  try {
    const company_id = req.user.company_id || req.user.id;

    const userCheck = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE u.id = $1 AND u.company_id = $2`,
      [id, company_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found in your company" });
    }

    const user = userCheck.rows[0];
    const roleDefaults        = user.role_permissions         ?? {};
    const roleControlDefaults = user.role_additional_controls ?? {};

    const finalPermissions     = mergePermissions(roleDefaults,        permissions);
    const finalAdditionalCtrls = mergeControls(roleControlDefaults, additionalControls);
    await upsertUserPermissionsJsonb(id, finalPermissions, finalAdditionalCtrls);

    if (Array.isArray(warehouseIds)) await upsertUserWarehouses(id, warehouseIds);

    const { warehousesByUser } = await fetchUserRelations([String(user.id)]);
    const userPermsRow = { permissions: finalPermissions, additional_controls: finalAdditionalCtrls };

    return res.status(200).json({
      success: true,
      message: "User permissions updated successfully",
      data: toUserDTO(user, warehousesByUser.get(String(user.id)) || [], userPermsRow),
    });
  } catch (error) {
    console.error("Update User Permissions Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleUserActiveByAdmin = async (req, res) => {
  const { id }       = req.params;
  const { isActive } = req.body;

  try {
    const company_id = req.user.company_id || req.user.id;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive boolean is required" });
    }

    const updated = await connectDB.query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND company_id = $3
       RETURNING id`,
      [isActive, id, company_id]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "User not found in your company" });
    }

    const userRow = await connectDB.query(
      `${userWithRoleSelect}
       FROM users u
       LEFT JOIN roles r ON r.company_id = u.company_id AND r.name = u.role
       WHERE u.id = $1 AND u.company_id = $2`,
      [id, company_id]
    );
    const user = userRow.rows[0];
    const { warehousesByUser } = await fetchUserRelations([String(user.id)]);
    const userPermsMap = await fetchUserPermsMap([String(user.id)]);

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: toUserDTO(user, warehousesByUser.get(String(user.id)) || [], userPermsMap.get(String(user.id)) ?? null),
    });
  } catch (error) {
    console.error("Toggle User Active Error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsersForSuperAdmin = async (req, res) => {
  try {
    const result = await connectDB.query(
      `SELECT id, name, email, phone, role, is_active, created_by, created_at, updated_at, last_login_at FROM users`
    );
    res.status(200).json({
      message: "Users fetched successfully",
      total: result.rows.length,
      users: result.rows.map((u) => ({ ...u, status: u.is_active ? "Active" : "Inactive" })),
    });
  } catch (error) {
    console.error("Get All Users Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchAndFilterUsers = async (req, res) => {
  try {
    const company_id = req.user.company_id || req.user.id;
    const { emailOrName, status, role } = req.body;

    const conditions = ["u.company_id = $1"];
    const values     = [company_id];
    let index        = 2;

    if (emailOrName) {
      conditions.push(`(u.email ILIKE $${index} OR u.name ILIKE $${index})`);
      values.push(`%${emailOrName}%`);
      index++;
    }
    if (status && !status.toLowerCase().includes("all")) {
      conditions.push(`u.is_active = $${index}`);
      values.push(status.toLowerCase() === "active");
      index++;
    }
    if (role && !role.toLowerCase().includes("all")) {
      conditions.push(`u.role ILIKE $${index}`);
      values.push(`%${role}%`);
      index++;
    }

    const result = await connectDB.query(
      `SELECT id, name, email, phone, role, is_active, created_at, updated_at, last_login_at
       FROM users u WHERE ${conditions.join(" AND ")}
       ORDER BY u.created_at DESC`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No users found matching your search/filters" });
    }
    res.status(200).json({
      message: "User(s) fetched successfully",
      total: result.rows.length,
      users: result.rows.map((u) => ({ ...u, status: u.is_active ? "Active" : "Inactive" })),
    });
  } catch (error) {
    console.error("Search & Filter Users Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};