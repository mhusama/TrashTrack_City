import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { UserCircle } from "lucide-react";
import { teamsApi } from "../api/client.js";
import CrewCredentialsPanel from "./CrewCredentialsPanel.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

const COL_COUNT = 7;

function PersonButton({ name, onClick, disabled }) {
  if (!name || name === "—" || disabled) {
    return <span className="text-neutral-600">{name || "—"}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-[#6b0f1a] hover:underline"
    >
      {name}
    </button>
  );
}

function MemberTableRow({ member, onSelect }) {
  return (
    <tr className="border-b border-theme-border bg-[#fce1ee]/40">
      <td className="px-4 py-2" />
      <td className="px-4 py-2" colSpan={3}>
        <button
          type="button"
          onClick={() => onSelect(member)}
          className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[#fce1ee]"
        >
          <span className="flex min-w-0 items-center gap-3">
            {member.profilePicture ? (
              <img
                src={mediaUrl(member.profilePicture)}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fce1ee]">
                <UserCircle className="h-6 w-6 text-[#6b0f1a]" />
              </span>
            )}
            <span className="font-medium text-[#6b0f1a] hover:underline">{member.name}</span>
          </span>
          <span className="shrink-0 font-mono text-xs text-black">{member.teamId || "—"}</span>
        </button>
      </td>
      <td className="px-4 py-2" colSpan={COL_COUNT - 4} />
    </tr>
  );
}

export default function AdminTeamsTable() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersTeam, setMembersTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [teamNo, setTeamNo] = useState("");
  const [teamName, setTeamName] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const load = () => {
    teamsApi
      .overview()
      .then((res) => setTeams(res.data.teams))
      .catch(() => toast.error("Failed to load teams"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  const openLeaderCredentials = async (userId) => {
    if (!userId) return;
    try {
      const res = await teamsApi.crewUser(userId);
      setSelectedUser(res.data.user);
    } catch {
      toast.error("Could not load credentials");
    }
  };

  const handleTeamMembersClick = async (teamName) => {
    if (membersTeam === teamName) {
      setMembersTeam(null);
      setMembers([]);
      setSelectedUser(null);
      return;
    }

    setMembersLoading(true);
    setSelectedUser(null);
    try {
      const res = await teamsApi.members(teamName);
      setMembersTeam(teamName);
      setMembers(res.data.members || []);
    } catch {
      toast.error("Could not load team members");
      setMembersTeam(null);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleMemberSelect = async (member) => {
    try {
      const res = await teamsApi.crewUser(member.id);
      setSelectedUser(res.data.user);
    } catch {
      setSelectedUser(member);
    }
  };

  const handleEnrollTeam = async () => {
    const n = parseInt(String(teamNo).trim(), 10);
    if (
      !Number.isFinite(n) ||
      n < 1 ||
      String(teamNo).includes(".") ||
      /[^\d]/.test(String(teamNo).trim())
    ) {
      toast.error("Team no. must be a positive integer");
      return;
    }
    if (!teamName.trim()) {
      toast.error("Enter a team name");
      return;
    }
    setEnrolling(true);
    try {
      await teamsApi.enroll({
        teamNumber: n,
        teamName: teamName.trim(),
      });
      toast.success("Team enrolled. It will appear last on the registration team list.");
      setTeamNo("");
      setTeamName("");
      setAddTeamOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not enroll team");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <p>Loading teams…</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-theme-border">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-theme-border bg-[#fce1ee]">
                <th className="px-4 py-3 font-semibold">Team no.</th>
                <th className="px-4 py-3 font-semibold">Team Leader</th>
                <th className="px-4 py-3 font-semibold">Team ID</th>
                <th className="px-4 py-3 font-semibold">Assigned Tasks</th>
                <th className="px-4 py-3 font-semibold">Disposal in Progress</th>
                <th className="px-4 py-3 font-semibold">Pending Approval</th>
                <th className="px-4 py-3 font-semibold">Members</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <Fragment key={team.teamName}>
                  <tr className="border-b border-theme-border">
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      {team.teamDisplayLabel || team.teamName}
                    </td>
                    <td className="px-4 py-3">
                      <PersonButton
                        name={team.teamLeader}
                        onClick={() => openLeaderCredentials(team.teamLeaderId)}
                        disabled={!team.teamLeaderId}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{team.leaderTeamId || "—"}</td>
                    <td className="px-4 py-3">{team.assignedTasks}</td>
                    <td className="px-4 py-3">{team.disposalInProgress}</td>
                    <td className="px-4 py-3">{team.pendingApproval}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleTeamMembersClick(team.teamName)}
                        className={`guest-cta-btn px-4 py-1.5 text-sm ${
                          membersTeam === team.teamName ? "ring-2 ring-[#6b0f1a]" : ""
                        }`}
                      >
                        Team Members
                      </button>
                    </td>
                  </tr>

                  {membersTeam === team.teamName && membersLoading && (
                    <tr className="border-b border-theme-border bg-[#fce1ee]/40">
                      <td colSpan={COL_COUNT} className="px-4 py-3 text-black">
                        Loading team members…
                      </td>
                    </tr>
                  )}

                  {membersTeam === team.teamName && !membersLoading && members.length === 0 && (
                    <tr className="border-b border-theme-border bg-[#fce1ee]/40">
                      <td colSpan={COL_COUNT} className="px-4 py-3 text-black">
                        No team members registered for this team yet.
                      </td>
                    </tr>
                  )}

                  {membersTeam === team.teamName &&
                    !membersLoading &&
                    members.map((member) => (
                      <MemberTableRow
                        key={member.id}
                        member={member}
                        onSelect={handleMemberSelect}
                      />
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-theme-border bg-white p-4">
          <button
            type="button"
            onClick={() => setAddTeamOpen((v) => !v)}
            className="guest-cta-btn px-4 py-2 text-sm"
          >
            {addTeamOpen ? "Hide Add A Team" : "Add A Team"}
          </button>
          {addTeamOpen && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="label-text">Team no.</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={teamNo}
                  onChange={(e) => setTeamNo(e.target.value.replace(/[^\d]/g, ""))}
                  className="input-field"
                  placeholder="e.g. 16"
                />
              </label>
              <label className="block space-y-1">
                <span className="label-text">Team Name</span>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="input-field"
                  placeholder="Display name for the team"
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  disabled={enrolling}
                  onClick={handleEnrollTeam}
                  className="guest-cta-btn w-full py-2 text-sm"
                >
                  {enrolling ? "Enrolling…" : "Enroll team"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CrewCredentialsPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
