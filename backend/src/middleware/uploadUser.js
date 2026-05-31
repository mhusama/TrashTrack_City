import { upload } from "./upload.js";

export const uploadUserFiles = upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "nidFront", maxCount: 1 },
  { name: "nidBack", maxCount: 1 },
]);

export const uploadProfilePicture = upload.single("profilePicture");
