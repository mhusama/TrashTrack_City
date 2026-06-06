import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import ReportForm, { buildFormData } from "../components/ReportForm.jsx";
import { canResidentModifyReport } from "../utils/reportActions.js";

export default function EditReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .get(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (form, photoFile) => {
    try {
      await reportsApi.update(id, buildFormData(form, photoFile));
      toast.success("Report updated");
      navigate(`/reports/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update report");
      throw err;
    }
  };

  if (loading) {
    return <p className="text-black">Loading report…</p>;
  }

  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">Report not found.</p>
        <Link to="/" className="link-inline mt-4 inline-block">
          Back to My Reports
        </Link>
      </div>
    );
  }

  if (!canResidentModifyReport(report)) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">
          This report can no longer be edited while it is under review, approved, or rejected.
        </p>
        <Link to={`/reports/${id}`} className="link-inline mt-4 inline-block">
          View report
        </Link>
      </div>
    );
  }

  return (
    <div className="new-report-page w-full text-black">
      <button
        type="button"
        onClick={() => navigate(`/reports/${id}`)}
        className="mb-4 text-sm font-medium text-[#6b0f1a] hover:underline"
      >
        ← Back to report
      </button>
      <h1 className="mb-2 text-2xl font-bold text-black">Edit report</h1>
      <p className="mb-6 text-sm text-black/80">
        Saving changes will update the issued date to today.
      </p>
      <ReportForm
        initialData={report}
        existingPhotoUrl={report.photoUrl}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
