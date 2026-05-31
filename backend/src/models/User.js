import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getConnections } from "../config/db.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["resident", "admin", "cleaning_crew"],
      required: true,
      default: "resident",
    },
    crewSubRole: {
      type: String,
      enum: ["team_leader", "team_member"],
      default: undefined,
    },
    teamName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true },
    profilePicture: { type: String, default: "" },
    nidNumber: { type: String, trim: true },
    nidFrontImage: { type: String, default: "" },
    nidBackImage: { type: String, default: "" },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    residentId: { type: String, sparse: true, unique: true, trim: true, uppercase: true },
    teamId: { type: String, sparse: true, unique: true, trim: true, uppercase: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

function bindUserModel(connection) {
  return connection.models.User || connection.model("User", userSchema);
}

let UserResident;
let UserAdmin;
let UserCrew;

export function initUserModels() {
  const { resident, admin, crew } = getConnections();
  UserResident = bindUserModel(resident);
  UserAdmin = bindUserModel(admin);
  UserCrew = bindUserModel(crew);
}

export function getUserModel(role) {
  if (role === "admin") return UserAdmin;
  if (role === "cleaning_crew") return UserCrew;
  return UserResident;
}

/** Residents + reports/notifications on the main connection. */
export function getResidentUserModel() {
  return UserResident;
}

/** @deprecated Use getResidentUserModel() or getUserModel(role). */
export const User = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!UserResident) {
        throw new Error("User models not initialized. Call initUserModels() after connectDB().");
      }
      const value = UserResident[prop];
      return typeof value === "function" ? value.bind(UserResident) : value;
    },
  }
);

const ROLE_SEARCH_ORDER = ["resident", "admin", "cleaning_crew"];

function isDbAuthError(err) {
  return err?.code === 13 || err?.codeName === "Unauthorized";
}

export async function findUserByEmail(email, select = "", roles = ROLE_SEARCH_ORDER) {
  const normalized = email.toLowerCase().trim();

  for (const role of roles) {
    try {
      const Model = getUserModel(role);
      const user = await Model.findOne({ email: normalized }).select(select);
      if (user) return { user, role };
    } catch (err) {
      if (isDbAuthError(err)) {
        console.warn(`Email lookup skipped for ${role} database (not authorized).`);
        continue;
      }
      throw err;
    }
  }

  return null;
}

/** Check email only in databases needed for a given registration/login role. */
export async function findUserByEmailForRole(email, userRole, select = "") {
  const order =
    userRole === "cleaning_crew"
      ? ["cleaning_crew", "resident"]
      : userRole === "admin"
        ? ["admin", "resident"]
        : ["resident"];
  return findUserByEmail(email, select, order);
}

async function tryFindOne(Model, filter, select = "") {
  try {
    return await Model.findOne(filter).select(select);
  } catch (err) {
    if (isDbAuthError(err)) return null;
    throw err;
  }
}

/** Login lookup — includes legacy admin accounts stored in the main `test` database. */
export async function findUserForLogin(email, role, crewSubRole = "") {
  const normalized = email.toLowerCase().trim();
  const withPassword = "+password";

  if (role === "admin") {
    let user = await tryFindOne(UserAdmin, { email: normalized }, withPassword);
    if (user) {
      if (!user.role) user.role = "admin";
      return user;
    }
    user = await tryFindOne(UserResident, { email: normalized, role: "admin" }, withPassword);
    if (user) return user;
    return null;
  }

  if (role === "cleaning_crew") {
    if (!crewSubRole) return null;
    return tryFindOne(
      UserCrew,
      { email: normalized, crewSubRole },
      withPassword
    );
  }

  const user = await tryFindOne(UserResident, { email: normalized }, withPassword);
  if (!user) return null;
  if (user.role && user.role !== "resident") return null;
  return user;
}

/** Resolve session user after JWT verify (same DB fallbacks as login). */
export async function findUserByIdForAuth(userId, role) {
  const withoutPassword = "-password";

  if (role === "admin") {
    let user = await tryFindOne(UserAdmin, { _id: userId }, withoutPassword);
    if (user) return user;
    return tryFindOne(UserResident, { _id: userId, role: "admin" }, withoutPassword);
  }

  if (role === "cleaning_crew") {
    return tryFindOne(UserCrew, { _id: userId }, withoutPassword);
  }

  return tryFindOne(UserResident, { _id: userId }, withoutPassword);
}
