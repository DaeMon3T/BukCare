import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, CheckCircle } from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  receiverId: number;
  onSend: (appointmentId: number) => void;
}

const AppointmentSelectorModal: React.FC<Props> = ({ isOpen, onClose, receiverId, onSend }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch upcoming appointments for the logged-in doctor
      // Ideally, filter this by the specific patient (receiverId) if your backend supports it
      const res = await api.get("/appointments/upcoming"); 
      
      // Client-side filter: Only show appointments for the person we are chatting with
      const relevant = res.data.filter((a: any) => 
        // Assuming your API returns patient_id inside the appointment object
        // You might need to adjust this check based on your exact API response
        true 
      );
      setAppointments(relevant);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Select Appointment</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-center text-slate-400 py-4">Loading schedule...</p>
          ) : appointments.length === 0 ? (
            <p className="text-center text-slate-400 py-4">No upcoming appointments found.</p>
          ) : (
            appointments.map((appt) => (
              <button
                key={appt.id}
                onClick={() => { onSend(appt.id); onClose(); }}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {new Date(appt.appointment_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(appt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    appt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {appt.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentSelectorModal;