import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { crewApi } from "../api/client.js";
import { crewStatusLabel } from "../config/crewStatus.js";

export default function CrewTaskReportsTable({
  reports,
  detailBasePath,
  enableLeaderTransport = false,
  /** Team member: show same transport as leader (from report); no editing or fleet panel */
  assignedTransportReadOnly = false,
  onReportsUpdate,
}) {
  const showTransportColumn = enableLeaderTransport || assignedTransportReadOnly;
  const [transportPanelOpen, setTransportPanelOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [transportBusyReg, setTransportBusyReg] = useState(null);

  const loadVehicles = useCallback(async () => {
    if (!enableLeaderTransport) return;
    setVehiclesLoading(true);
    try {
      const res = await crewApi.vehicles();
      setVehicles(res.data.vehicles || []);
    } catch {
      toast.error("Failed to load transport list");
    } finally {
      setVehiclesLoading(false);
    }
  }, [enableLeaderTransport]);

  useEffect(() => {
    if (transportPanelOpen && enableLeaderTransport) {
      loadVehicles();
    }
  }, [transportPanelOpen, enableLeaderTransport, loadVehicles, reports]);

  useEffect(() => {
    if (!selectedReportId) return;
    const stillThere = reports.some((r) => String(r._id) === String(selectedReportId));
    if (!stillThere) setSelectedReportId(null);
  }, [reports, selectedReportId]);

  const selectedReport = reports.find((r) => String(r._id) === String(selectedReportId)) || null;

  const refreshAll = async () => {
    onReportsUpdate?.();
    if (transportPanelOpen) await loadVehicles();
  };

  const handleTransportToggle = async (vehicle) => {
    if (!enableLeaderTransport) return;
    const reg = vehicle.registrationNumber;
    const st = vehicleButtonState(vehicle);
    if (st.disabled) return;

    if (!selectedReportId) {
      toast.error(
        "Select a task row first (click an Assigned Transport cell), then choose a vehicle."
      );
      return;
    }

    const rep = reports.find((r) => String(r._id) === String(selectedReportId));
    if (!rep) {
      toast.error("Selected task is no longer in the list.");
      return;
    }

    const isMine = rep.assignedTransportRegistration === reg;

    if (isMine) {
      if (rep.crewStatus === "disposal_in_progress") {
        toast.error("You cannot change transport while Disposal in Progress.");
        return;
      }
      setTransportBusyReg(reg);
      try {
        await crewApi.setReportTransport(selectedReportId, { registrationNumber: null });
        toast.success("Transport cleared for this task");
        await refreshAll();
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not update transport");
      } finally {
        setTransportBusyReg(null);
      }
      return;
    }

    setTransportBusyReg(reg);
    try {
      await crewApi.setReportTransport(selectedReportId, { registrationNumber: reg });
      toast.success("Transport assigned");
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "This vehicle is not available");
    } finally {
      setTransportBusyReg(null);
    }
  };

  const vehicleButtonState = (vehicle) => {
    const reg = vehicle.registrationNumber;
    const exId = vehicle.exclusiveReportId;
    const exStatus = vehicle.exclusiveCrewStatus;

    const foreignDisposal =
      exId &&
      exStatus === "disposal_in_progress" &&
      (selectedReportId == null || String(exId) !== String(selectedReportId));

    const mineOnSelected =
      selectedReport &&
      String(selectedReport._id) === String(selectedReportId) &&
      selectedReport.assignedTransportRegistration === reg;

    const disposalOwn =
      mineOnSelected && selectedReport.crewStatus === "disposal_in_progress";

    if (foreignDisposal || disposalOwn) {
      return { tone: "red", label: "Not Available", disabled: true };
    }
    if (mineOnSelected) {
      return { tone: "red", label: "Not Available", disabled: false };
    }
    return { tone: "green", label: "Available", disabled: false };
  };

  if (!reports.length) {
    return (
      <p className="rounded-xl border border-dashed border-theme-border p-8 text-center">
        No assigned tasks yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl border border-theme-border">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-theme-border bg-[#fce1ee]">
              <th className="px-4 py-3 font-semibold">Resident ID</th>
              <th className="px-4 py-3 font-semibold">Report ID</th>
              <th className="px-4 py-3 font-semibold">Assigned Report</th>
              <th className="px-4 py-3 font-semibold">Assigned Date</th>
              {showTransportColumn && (
                <th className="px-4 py-3 font-semibold">
                  {enableLeaderTransport ? (
                    <button
                      type="button"
                      className="text-left font-semibold underline decoration-[#6b0f1a] decoration-2 underline-offset-2 hover:text-[#6b0f1a]"
                      onClick={() => setTransportPanelOpen((o) => !o)}
                      aria-expanded={transportPanelOpen}
                    >
                      Assigned Transport
                    </button>
                  ) : (
                    "Assigned Transport"
                  )}
                </th>
              )}
              <th className="px-4 py-3 font-semibold">Report Status</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report._id}
                className={`border-b border-theme-border ${
                  enableLeaderTransport && String(report._id) === String(selectedReportId)
                    ? "bg-amber-50/80"
                    : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs text-black">
                  {report.reportedBy?.residentId || "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-black">{report.reportId || "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`${detailBasePath}/${report._id}`}
                    className="font-medium text-[#6b0f1a] hover:underline"
                  >
                    {report.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-black">
                  {report.teamAssignedAt
                    ? new Date(report.teamAssignedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                {showTransportColumn && (
                  <td className="px-4 py-3 text-black">
                    {enableLeaderTransport ? (
                      <button
                        type="button"
                        className="max-w-[14rem] text-left text-sm hover:underline"
                        onClick={() => setSelectedReportId(String(report._id))}
                      >
                        {report.assignedTransportLabel?.trim() ? (
                          <span className="font-medium text-[#6b0f1a]">
                            {report.assignedTransportLabel}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </button>
                    ) : (
                      <span className="max-w-[14rem] text-sm">
                        {report.assignedTransportLabel?.trim() ? (
                          <span className="font-medium text-[#6b0f1a]">
                            {report.assignedTransportLabel}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 font-semibold">
                  {crewStatusLabel(report.crewStatus)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enableLeaderTransport && transportPanelOpen && (
        <div className="overflow-x-auto rounded-xl border border-theme-border">
          <p className="border-b border-theme-border bg-[#fce1ee] px-4 py-2 text-sm font-semibold">
            Transport fleet
            {selectedReport ? (
              <span className="ml-2 font-normal text-neutral-600">
                (assigning to: {selectedReport.reportId || selectedReport.title})
              </span>
            ) : (
              <span className="ml-2 font-normal text-amber-800">
                — click an Assigned Transport cell above to pick a task row first
              </span>
            )}
          </p>
          {vehiclesLoading ? (
            <p className="p-6 text-center text-sm">Loading vehicles…</p>
          ) : (
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-theme-border bg-[#fce1ee]">
                  <th className="px-3 py-2 font-semibold">No.</th>
                  <th className="px-3 py-2 font-semibold">Vehicle Name / Model</th>
                  <th className="px-3 py-2 font-semibold">Vehicle Type</th>
                  <th className="px-3 py-2 font-semibold">Manufacturer Company</th>
                  <th className="px-3 py-2 font-semibold">Registration Number</th>
                  <th className="px-3 py-2 font-semibold">Availability</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const st = vehicleButtonState(v);
                  const busy = transportBusyReg === v.registrationNumber;
                  return (
                    <tr key={v.registrationNumber} className="border-b border-theme-border">
                      <td className="px-3 py-2">{v.no}</td>
                      <td className="px-3 py-2">{v.vehicleName}</td>
                      <td className="px-3 py-2">{v.vehicleType}</td>
                      <td className="px-3 py-2">{v.manufacturer}</td>
                      <td className="px-3 py-2 font-mono text-xs">{v.registrationNumber}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={st.disabled || busy}
                          onClick={() => handleTransportToggle(v)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity ${
                            st.tone === "green" ? "bg-green-600 hover:opacity-90" : "bg-red-600"
                          } ${st.disabled || busy ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                        >
                          {busy ? "…" : st.label}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
