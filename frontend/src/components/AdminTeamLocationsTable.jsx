import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { teamsApi } from "../api/client.js";
import { DHAKA_AREAS } from "../config/dhakaAreas.js";

const ASSIGNABLE_AREAS = DHAKA_AREAS.filter((area) => area !== "Other");

export default function AdminTeamLocationsTable() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draftAreas, setDraftAreas] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    teamsApi
      .locations()
      .then((res) => setLocations(res.data.locations || []))
      .catch(() => toast.error("Failed to load team locations"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (location) => {
    setEditingId(location.id);
    setDraftAreas([...location.areas]);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftAreas([]);
  };

  const toggleArea = (area) => {
    setDraftAreas((current) =>
      current.includes(area) ? current.filter((value) => value !== area) : [...current, area]
    );
  };

  const handleSave = async (locationId) => {
    if (draftAreas.length === 0) {
      toast.error("Select at least one area");
      return;
    }

    setSaving(true);
    try {
      const res = await teamsApi.updateLocation(locationId, { areas: draftAreas });
      setLocations((current) =>
        current.map((row) => (row.id === locationId ? res.data.location : row))
      );
      toast.success("Team locations updated");
      cancelEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update team locations");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading team locations…</p>;

  if (locations.length === 0) {
    return <p className="text-black">No team locations found in the database yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-theme-border">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-theme-border bg-[#fce1ee]">
              <th className="px-4 py-3 font-semibold text-black">Team no.</th>
              <th className="px-4 py-3 font-semibold text-black">Team</th>
              <th className="px-4 py-3 font-semibold text-black">Assigned areas</th>
              <th className="px-4 py-3 font-semibold text-black">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => {
              const isEditing = editingId === location.id;
              return (
                <Fragment key={location.id}>
                  <tr className="border-b border-theme-border">
                    <td className="px-4 py-3 text-black">{location.teamId}</td>
                    <td className="px-4 py-3 font-medium text-black">
                      {location.teamDisplayLabel || location.name}
                    </td>
                    <td className="px-4 py-3 text-black">
                      {location.areas.length > 0 ? location.areas.join(", ") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => startEdit(location)}
                          className="guest-cta-btn px-4 py-1.5 text-sm"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-sm text-neutral-600">Editing…</span>
                      )}
                    </td>
                  </tr>

                  {isEditing && (
                    <tr className="border-b border-theme-border bg-[#fce1ee]/40">
                      <td colSpan={4} className="px-4 py-4">
                        <p className="mb-3 text-sm font-semibold text-black">
                          Select areas for {location.teamDisplayLabel || location.name}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {ASSIGNABLE_AREAS.map((area) => (
                            <label
                              key={area}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-theme-border bg-white px-3 py-2 text-sm text-black"
                            >
                              <input
                                type="checkbox"
                                checked={draftAreas.includes(area)}
                                onChange={() => toggleArea(area)}
                              />
                              {area}
                            </label>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => handleSave(location.id)}
                            className="guest-cta-btn px-4 py-2 text-sm"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={cancelEdit}
                            className="rounded-lg border border-theme-border px-4 py-2 text-sm text-black hover:bg-neutral-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
