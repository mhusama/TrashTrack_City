import mongoose from "mongoose";

let adminConnection;
let crewConnection;

/** Application admin accounts DB — avoid MongoDB's built-in `admin` auth database. */
export const ADMIN_APP_DB = process.env.MONGODB_ADMIN_DB_NAME || "tt_admin";

/** Append or replace the database name in a MongoDB URI. */
export function withDatabase(uri, dbName) {
  const trimmed = uri.trim();
  const qIndex = trimmed.indexOf("?");
  const query = qIndex >= 0 ? trimmed.slice(qIndex) : "";
  let base = qIndex >= 0 ? trimmed.slice(0, qIndex) : trimmed;

  const schemeEnd = base.indexOf("://") + 3;
  const pathSlash = base.indexOf("/", schemeEnd);
  if (pathSlash !== -1) {
    base = base.slice(0, pathSlash);
  }

  return `${base}/${dbName}${query}`;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  const mainDb = process.env.MONGODB_DB_NAME || "test";
  const mainUri = withDatabase(uri, mainDb);
  const adminUri = process.env.MONGODB_URI_ADMIN || withDatabase(uri, ADMIN_APP_DB);
  const crewUri = process.env.MONGODB_URI_CREW || withDatabase(uri, "c_c");

  await mongoose.connect(mainUri);
  adminConnection = mongoose.createConnection(adminUri);
  crewConnection = mongoose.createConnection(crewUri);

  await Promise.all([adminConnection.asPromise(), crewConnection.asPromise()]);

  console.log(`MongoDB connected (residents & app data: ${mainDb})`);
  console.log(`MongoDB connected (admins: ${ADMIN_APP_DB})`);
  console.log("MongoDB connected (cleaning crew: c_c)");
}

export function getConnections() {
  return {
    resident: mongoose.connection,
    admin: adminConnection,
    crew: crewConnection,
  };
}
