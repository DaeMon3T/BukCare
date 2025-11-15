import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

interface Schedule {
  id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes?: string;
}

const DoctorSetAvailability = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ✅ prevent duplicate fetches
  const isFetching = useRef(false);

  // ✅ fetch doctor schedules
  const fetchSchedules = async () => {
    if (!user?.id || isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await api.get("/schedules");
      setSchedules(res.data);
    } catch (err) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  // ✅ only fetch once when user.id is ready
  useEffect(() => {
    if (user?.id) fetchSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ✅ handle add schedule
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.start_time || !form.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        doctor_id: user?.id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        is_available: true,
        notes: form.notes || "",
      };

      const res = await api.post("/schedules/", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200 || res.status === 201) {
        toast.success("Schedule added successfully");
        setForm({ date: "", start_time: "", end_time: "", notes: "" });
        fetchSchedules();
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err: any) {
      console.error("Schedule creation failed:", err.response?.data || err);
      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error("Failed to create schedule");
      }
    } finally {
      setSubmitting(false);
    }
  };


  // ✅ handle delete schedule
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      toast.success("Schedule deleted");
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Set Availability</h2>

      {/* Add new availability form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-md p-4 grid md:grid-cols-4 gap-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded-md"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="time"
            className="w-full border p-2 rounded-md"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time</label>
          <input
            type="time"
            className="w-full border p-2 rounded-md"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <input
            type="text"
            className="w-full border p-2 rounded-md"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="md:col-span-4 flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 rounded-md text-white ${
              submitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "Saving..." : "Add Schedule"}
          </button>
        </div>
      </form>

      {/* Schedules list */}
      {loading ? (
        <p>Loading schedules...</p>
      ) : schedules.length === 0 ? (
        <p className="text-gray-500">No schedules found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Start</th>
                <th className="p-3 text-left">End</th>
                <th className="p-3 text-left">Available</th>
                <th className="p-3 text-left">Notes</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((sch) => (
                <tr key={sch.id} className="border-b">
                  <td className="p-3">{sch.date}</td>
                  <td className="p-3">{sch.start_time}</td>
                  <td className="p-3">{sch.end_time}</td>
                  <td className="p-3">
                    {sch.is_available ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-red-600 font-medium">No</span>
                    )}
                  </td>
                  <td className="p-3">{sch.notes || "-"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(sch.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DoctorSetAvailability;
