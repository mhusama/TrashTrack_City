import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { teamsApi } from "../api/client.js";

export default function AdminAssignTeamTable({
  reportId,
  assignedTeam,
  assignedTeamDisplay = "",
  onAssigned,
}) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState("");

  const load = () => {
    teamsApi
      .assignmentTable(reportId)
      .then((res) => setTeams(res.data.teams))
      .catch(() => toast.error("Failed to load teams"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [reportId]);

  const handleAssign = async (teamName) => {
    setAssigning(teamName);
    try {
      const res = await teamsApi.assign(reportId, teamName);
      const action =
        assignedTeam && assignedTeam !== teamName
          ? `Reassigned to ${teamName}`
          : `Assigned to ${teamName}`;
      toast.success(action);
      onAssigned?.(res.data.report);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not assign");
    } finally {
      setAssigning("");
    }
  };

  if (loading) return <p>Loading teams…</p>;

  const isAssigned =
    assignedTeam && assignedTeam.trim() !== "" && assignedTeam !== "unassigned";

  return (
    <div className="space-y-3">
      {isAssigned && (
        <p className="text-sm text-black">
          Currently assigned to <strong>{assignedTeamDisplay || assignedTeam}</strong>. Select
          another team below to reassign.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-theme-border">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-theme-border bg-[#fce1ee]">
              <th className="px-4 py-3 font-semibold">Team no.</th>
              <th className="px-4 py-3 font-semibold">Team Leader</th>
              <th className="px-4 py-3 font-semibold">Assigned Tasks</th>
              <th className="px-4 py-3 font-semibold">Availability</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.teamName} className="border-b border-theme-border">
                <td className="px-4 py-3 text-sm text-black">{team.displayLabel || team.teamName}</td>
                <td className="px-4 py-3">{team.teamLeader}</td>
                <td className="px-4 py-3">{team.assignedTasks}</td>
                <td className="px-4 py-3">
                  {team.canAssign ? (
                    <button
                      type="button"
                      disabled={!!assigning}
                      onClick={() => handleAssign(team.teamName)}
                      className="guest-cta-btn px-4 py-1.5 text-sm"
                    >
                      {assigning === team.teamName
                        ? "Saving…"
                        : isAssigned && assignedTeam === team.teamName
                          ? "Current"
                          : isAssigned
                            ? "Reassign"
                            : "Assign"}
                    </button>
                  ) : (
                    <span className="font-semibold text-red-600">Not available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
