import { mediaUrl } from "../utils/mediaUrl.js";

function Field({ label, value }) {
  return (
    <div>
      <p className="label-text">{label}</p>
      <p className="mt-1 text-black">{value || "—"}</p>
    </div>
  );
}

export default function CrewCredentialsPanel({ user, onClose }) {
  if (!user) return null;

  const roleLabel =
    user.crewSubRole === "team_leader"
      ? "Team Leader"
      : user.crewSubRole === "team_member"
        ? "Team Member"
        : user.crewSubRole;

  return (
    <div className="card mt-4 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.profilePicture ? (
            <img
              src={mediaUrl(user.profilePicture)}
              alt=""
              className="h-16 w-16 rounded-full border object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fce1ee] text-xl font-semibold text-[#6b0f1a]">
              {user.name?.[0]}
            </span>
          )}
          <div>
            <h3 className="text-lg font-bold text-black">{user.name}</h3>
            <p className="text-sm text-[#6b0f1a]">{roleLabel}</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-sm font-medium text-[#6b0f1a] hover:underline">
            Close
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" value={user.email} />
        <Field label="Phone" value={user.phone} />
        <Field label="Team" value={user.teamName} />
        <Field label="Team ID" value={user.teamId} />
        <Field label="NID number" value={user.nidNumber} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="label-text">NID front</p>
          {user.nidFrontImage ? (
            <img
              src={mediaUrl(user.nidFrontImage)}
              alt="NID front"
              className="mt-2 max-h-40 rounded-lg border object-cover"
            />
          ) : (
            <p className="mt-1 text-black">—</p>
          )}
        </div>
        <div>
          <p className="label-text">NID back</p>
          {user.nidBackImage ? (
            <img
              src={mediaUrl(user.nidBackImage)}
              alt="NID back"
              className="mt-2 max-h-40 rounded-lg border object-cover"
            />
          ) : (
            <p className="mt-1 text-black">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
