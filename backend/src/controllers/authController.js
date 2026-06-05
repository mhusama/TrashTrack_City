import { enrollAdminTeam, isValidTeamName, resolveTeamDisplayName } from "../services/teamRegistryService.js";
import { generateResidentIdCandidate, generateTeamIdCandidate } from "../utils/userIds.js";
import {
  findUserByEmail,
  findUserByEmailForRole,
  findUserByIdForAuth,
  findUserForLogin,
  getUserModel,
} from "../models/User.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import {
  RESET_PASSWORD_EXPIRY_MS,
  generateResetToken,
  hashResetToken,
} from "../utils/resetToken.js";
import { signToken } from "../utils/token.js";

const VALID_ROLES = ["resident", "admin", "cleaning_crew"];

function normalizeResetToken(token) {
  if (!token || typeof token !== "string") return "";
  try {
    return decodeURIComponent(token.trim());
  } catch {
    return token.trim();
  }
}

async function buildUserResponse(user) {
  const o = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    crewSubRole: user.crewSubRole || "",
    teamName: user.teamName || "",
    teamDisplayLabel: "",
    phone: user.phone || "",
    profilePicture: user.profilePicture || "",
    nidNumber: user.nidNumber || "",
    residentId: user.residentId || "",
    teamId: user.teamId || "",
  };
  if (user.role === "cleaning_crew" && user.teamName) {
    o.teamDisplayLabel = await resolveTeamDisplayName(user.teamName);
  }
  return o;
}

async function uniqueResidentId() {
  const Model = getUserModel("resident");
  for (let i = 0; i < 25; i += 1) {
    const residentId = generateResidentIdCandidate();
    const clash = await Model.findOne({ residentId }).select("_id").lean();
    if (!clash) return residentId;
  }
  throw new Error("Could not allocate a unique Resident ID");
}

async function uniqueTeamId(teamName) {
  const CrewUser = getUserModel("cleaning_crew");
  for (let i = 0; i < 25; i += 1) {
    const teamId = generateTeamIdCandidate(teamName);
    const clash = await CrewUser.findOne({ teamId }).select("_id").lean();
    if (!clash) return teamId;
  }
  throw new Error("Could not allocate a unique Team ID");
}

function fileUrl(file) {
  return file ? `/uploads/${file.filename}` : "";
}

export async function register(req, res) {
  try {
    const { name, email, password, role, phone, nidNumber } = req.body;
    if (!name || !email || !password || !phone || !nidNumber) {
      return res.status(400).json({
        message: "Name, email, phone, NID number, and password are required",
      });
    }

    const userRole = role || "resident";
    if (!VALID_ROLES.includes(userRole)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const { crewSubRole, teamName } = req.body;
    const parsedCrewSubRole =
      typeof crewSubRole === "string" ? crewSubRole.trim() : "";
    const parsedTeamName = typeof teamName === "string" ? teamName.trim() : "";

    if (userRole === "cleaning_crew") {
      if (!["team_leader", "team_member"].includes(parsedCrewSubRole)) {
        return res.status(400).json({ message: "Select Team Leader or Team Member" });
      }
      if (!parsedTeamName || !(await isValidTeamName(parsedTeamName))) {
        return res.status(400).json({ message: "Select a valid team from the list" });
      }
      if (parsedCrewSubRole === "team_leader") {
        const CrewUser = getUserModel("cleaning_crew");
        const existingLeader = await CrewUser.findOne({
          crewSubRole: "team_leader",
          teamName: parsedTeamName,
        });
        if (existingLeader) {
          return res.status(409).json({
            message: `${parsedTeamName} already has a team leader. Choose another team or register as Team Member.`,
          });
        }
      }
    }

    const nidFront = req.files?.nidFront?.[0];
    const nidBack = req.files?.nidBack?.[0];
    if (!nidFront || !nidBack) {
      return res.status(400).json({ message: "NID front and back images are required" });
    }

    const existing = await findUserByEmailForRole(email, userRole);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const UserModel = getUserModel(userRole);
    const profileFile = req.files?.profilePicture?.[0];

    const crewExtras =
      userRole === "cleaning_crew"
        ? {
            crewSubRole: parsedCrewSubRole,
            teamName: parsedTeamName,
            teamId: await uniqueTeamId(parsedTeamName),
          }
        : {};

    const residentExtras =
      userRole === "resident" ? { residentId: await uniqueResidentId() } : {};

    const user = await UserModel.create({
      name,
      email,
      password,
      role: userRole,
      ...crewExtras,
      ...residentExtras,
      phone: phone.trim(),
      nidNumber: nidNumber.trim(),
      profilePicture: fileUrl(profileFile),
      nidFrontImage: fileUrl(nidFront),
      nidBackImage: fileUrl(nidBack),
    });

    const token = signToken(user._id.toString(), user.role);
    res.status(201).json({ user: await buildUserResponse(user), token });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: "Please select a valid role" });
    }

    const { crewSubRole } = req.body;

    if (role === "cleaning_crew" && !["team_leader", "team_member"].includes(crewSubRole)) {
      return res.status(400).json({ message: "Select Team Leader or Team Member" });
    }

    const user = await findUserForLogin(email, role, crewSubRole || "");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accountRole = user.role || role;
    if (accountRole !== role) {
      return res.status(403).json({
        message: `This account is registered as ${accountRole.replace("_", " ")}. Select the correct role to sign in.`,
      });
    }

    if (accountRole === "resident" && user.blocked) {
      return res.status(403).json({
        message: "Your account has been blocked. Contact support for help.",
      });
    }

    const token = signToken(user._id.toString(), accountRole);
    res.json({ user: await buildUserResponse(user), token });
  } catch (err) {
    if (err?.code === 13 || err?.codeName === "Unauthorized") {
      return res.status(503).json({
        message: "Database access error. Check Atlas permissions for admin and crew databases.",
      });
    }
    res.status(500).json({ message: err.message });
  }
}

export async function previewRegisterIds(req, res) {
  try {
    const { role, teamName } = req.query;
    if (role === "resident") {
      return res.json({ residentId: generateResidentIdCandidate() });
    }
    if (role === "cleaning_crew" && teamName && (await isValidTeamName(String(teamName)))) {
      return res.json({ teamId: generateTeamIdCandidate(String(teamName)) });
    }
    if (role === "cleaning_crew") {
      return res.json({ teamId: "" });
    }
    return res.json({});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function adminEnrollTeam(req, res) {
  try {
    const { email, password, teamNumber, teamName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (teamNumber === undefined || teamNumber === null || String(teamNumber).trim() === "") {
      return res.status(400).json({ message: "Team no. is required" });
    }
    if (!teamName?.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const user = await findUserForLogin(String(email).trim(), "admin", "");
    if (!user || !(await user.comparePassword(String(password)))) {
      return res.status(401).json({ message: "Invalid admin email or password" });
    }

    const result = await enrollAdminTeam({
      teamNumber,
      customName: String(teamName).trim(),
    });
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    res.json({ message: "Team enrolled successfully", teamKey: result.teamKey });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function me(req, res) {
  res.json({ user: await buildUserResponse(req.user) });
}

export async function updateProfile(req, res) {
  try {
    const { name, email, phone, password } = req.body;
    const UserModel = getUserModel(req.user.role);
    const user = await UserModel.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name?.trim()) user.name = name.trim();
    if (phone?.trim()) user.phone = phone.trim();

    if (email?.trim()) {
      const normalized = email.toLowerCase().trim();
      if (normalized !== user.email) {
        const existing = await findUserByEmailForRole(normalized, user.role);
        if (existing?.user && existing.user._id.toString() !== user._id.toString()) {
          return res.status(409).json({ message: "Email already in use" });
        }
        user.email = normalized;
      }
    }

    if (password?.trim()) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      user.password = password;
    }

    const profileFile = req.file;
    if (profileFile) {
      user.profilePicture = fileUrl(profileFile);
    }

    await user.save();

    const fresh = await findUserByIdForAuth(user._id, user.role);
    res.json({ user: await buildUserResponse(fresh || user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already in use" });
    }
    res.status(500).json({ message: err.message });
  }
}

const forgotPasswordMessage =
  "If an account exists for that email, a password reset link has been sent. It expires in 2 minutes.";

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const found = await findUserByEmail(email);
    const user = found?.user;

    let emailSent = false;

    if (user) {
      const rawToken = generateResetToken();
      user.resetPasswordToken = hashResetToken(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + RESET_PASSWORD_EXPIRY_MS);
      await user.save();

      const clientUrl = (process.env.CLIENT_URL || "http://localhost:5174").trim().replace(/\/$/, "");
      const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

      const result = await sendPasswordResetEmail({ to: user.email, resetUrl });
      emailSent = result.sent;

      if (!emailSent) {
        const isDev = process.env.NODE_ENV !== "production";
        return res.status(isDev ? 200 : 503).json({
          message: isDev
            ? "Email could not be sent (SMTP not configured or failed). Use the reset link below or in the backend console."
            : "Could not send reset email. Please try again later or contact support.",
          emailSent: false,
          smtpError: result.error,
          ...(isDev ? { devResetUrl: resetUrl } : {}),
        });
      }
    }

    res.json({ message: forgotPasswordMessage, emailSent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function validateResetToken(req, res) {
  try {
    const token = normalizeResetToken(req.query.token);
    if (!token) {
      return res.json({ valid: false });
    }

    const hashed = hashResetToken(token);
    let valid = false;

    for (const role of VALID_ROLES) {
      const Model = getUserModel(role);
      const user = await Model.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() },
      }).select("+resetPasswordToken");
      if (user) {
        valid = true;
        break;
      }
    }

    res.json({ valid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const token = normalizeResetToken(req.body.token);
    const { password, confirmPassword } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashed = hashResetToken(token);
    let user = null;

    for (const role of VALID_ROLES) {
      const Model = getUserModel(role);
      const match = await Model.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: new Date() },
      }).select("+password +resetPasswordToken +resetPasswordExpires");
      if (match) {
        user = match;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link. Request a new one from the sign-in page.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      message: "Password updated successfully. You can sign in with your new password.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
