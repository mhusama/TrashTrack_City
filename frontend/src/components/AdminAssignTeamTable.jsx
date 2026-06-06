import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { teamsApi } from "../api/client.js";

function assignmentRowStyle(team) {
  if (!team.canAssign) {
    return { backgroundColor: "#fecaca" };
  }
  if (team.areaMatch) {
    return { backgroundColor: "#bbf7d0" };
  }
  return undefined;
}

export default function AdminAssignTeamTable({
  reportId,
  assignedTeam,
  assignedTeamDisplay = "",
  onAssigned,
}) {
  const [teams, setTeams] = useState([]);
  const [reportArea, setReportArea] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState("");

  const load = () => {
    teamsApi
      .assignmentTable(reportId)
      .then((res) => {
        setTeams(res.data.teams || []);
        setReportArea(res.data.reportArea || "");
      })
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
      {reportArea && reportArea !== "Other" && (
        <p className="text-sm text-black">
          Report area: <strong>{reportArea}</strong>. Matching teams are highlighted in green
          and listed first.
        </p>
      )}
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
              <th className="px-4 py-3 font-semibold">Locations</th>
              <th className="px-4 py-3 font-semibold">Active Tasks</th>
              <th className="px-4 py-3 font-semibold">Availability</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.teamName}
                className="border-b border-theme-border"
                style={assignmentRowStyle(team)}
              >
                <td className="px-4 py-3 text-sm text-black">
                  {team.displayLabel || team.teamName}
                  {team.areaMatch && (
                    <span className="ml-2 text-xs font-semibold text-green-800">Area match</span>
                  )}
                </td>
                <td className="px-4 py-3 text-black">{team.teamLeader}</td>
                <td className="px-4 py-3 text-black">
                  {team.locations?.length > 0 ? team.locations.join(", ") : "—"}
                </td>
                <td className="px-4 py-3 text-black">{team.assignedTasks}</td>
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
                    <span className="font-semibold text-red-700">Not available</span>
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
