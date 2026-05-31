import { mediaUrl } from "../utils/mediaUrl.js";

export default function CrewTeamPanel({ teamData, loading }) {
  if (loading) return <p>Loading team…</p>;
  if (!teamData) return null;

  const { leader, members, teamName, teamDisplayLabel } = teamData;

  return (
    <div className="space-y-6">
      <p className="text-sm text-black">
        Your team: <strong>{teamDisplayLabel || teamName}</strong>
      </p>
      {leader && (
        <div className="card p-4">
          <p className="label-text mb-2">Team Leader</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {leader.profilePicture ? (
                <img
                  src={mediaUrl(leader.profilePicture)}
                  alt=""
                  className="h-12 w-12 rounded-full border object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fce1ee]">
                  {leader.name?.[0]}
                </span>
              )}
              <div>
                <p className="font-semibold">{leader.name}</p>
                <p className="text-sm">{leader.email}</p>
                <p className="text-sm">{leader.phone}</p>
              </div>
            </div>
            <p className="font-mono text-xs text-black">
              Team ID: {leader.teamId || "—"}
            </p>
          </div>
        </div>
      )}
      <div>
        <p className="label-text mb-3">Team Members</p>
        <ul className="space-y-3">
          {members?.length ? (
            members.map((m) => (
              <li key={m._id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="flex items-center gap-3">
                  {m.profilePicture ? (
                    <img
                      src={mediaUrl(m.profilePicture)}
                      alt=""
                      className="h-10 w-10 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fce1ee]">
                      {m.name?.[0]}
                    </span>
                  )}
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm">{m.email}</p>
                    <p className="text-sm">{m.phone}</p>
                  </div>
                </div>
                <p className="font-mono text-xs text-black">Team ID: {m.teamId || "—"}</p>
              </li>
            ))
          ) : (
            <li className="text-neutral-600">No team members registered yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
