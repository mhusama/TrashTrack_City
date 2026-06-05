import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import ReportForm, { buildFormData } from "../components/ReportForm.jsx";

export default function NewReportPage() {
  const navigate = useNavigate();

  const handleSubmit = async (form, photoFile) => {
    try {
      await reportsApi.create(buildFormData(form, photoFile));
      toast.success("Report submitted");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
      throw err;
    }
  };

  return (
    <div className="new-report-page w-full text-black">
      <h1 className="mb-6 text-2xl font-bold text-black">New report</h1>
      <ReportForm submitLabel="Submit report" onSubmit={handleSubmit} />
    </div>
  );
}
