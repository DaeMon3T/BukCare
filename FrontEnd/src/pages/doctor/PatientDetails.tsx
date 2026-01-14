import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Calendar, Clock, FileText, User, Activity, Plus } from 'lucide-react';
// import ConsultationModal from '@/components/ConsultationModal';
import MedicalRecordForm from '@/components/MedicalRecordForm';

const PatientDetails = () => {
    const { id } = useParams(); // Get patient ID from URL
    const navigate = useNavigate();
    
    // State
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showConsultModal, setShowConsultModal] = useState(false); // <--- Modal State

    // Fetch Logic (Wrapped in useCallback so we can reuse it)
    const fetchHistory = useCallback(async () => {
        try {
            const response = await api.get(`/doctors/patients/${id}/history`);
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Initial Load
    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading) return <div className="p-8 text-center animate-pulse">Loading Patient History...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Patient not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            
            {/* Top Navigation Row */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate("/doctor/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition">
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                {/* --- NEW START CONSULTATION BUTTON --- */}
                <button 
                    onClick={() => setShowConsultModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 hover:-translate-y-1"
                >
                    <Plus className="w-5 h-5" />
                    Start Consultation
                </button>
            </div>

            {/* Patient Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 overflow-hidden">
                    {data.patient.avatar ? (
                        <img src={data.patient.avatar} alt="Avatar" className="w-full h-full object-cover"/>
                    ) : (
                        data.patient.name.charAt(0)
                    )}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{data.patient.name}</h1>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> Patient ID: #{data.patient.id}</span>
                        <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-rose-500" /> Blood: {data.profile?.blood_type || "--"}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Medical Profile */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" /> Medical Profile
                        </h3>
                        <div className="space-y-4 divide-y divide-slate-50">
                            <div className="pt-2">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Allergies</p>
                                <p className="text-red-600 font-medium bg-red-50 inline-block px-2 py-1 rounded-md">
                                    {data.profile?.allergies || "None"}
                                </p>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Chronic Conditions</p>
                                <p className="text-slate-700 font-medium">{data.profile?.chronic_conditions || "None"}</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Medications</p>
                                <p className="text-slate-700 font-medium">{data.profile?.current_medications || "None"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Appointment History */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" /> Consultation History
                    </h3>
                    
                    {data.appointments.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <FileText className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 font-medium">No past appointment history found.</p>
                            <p className="text-sm text-slate-400 mt-1">Start a consultation to add a record.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.appointments.map((appt: any) => (
                                <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start hover:shadow-md transition-shadow">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 text-lg">{appt.reason || "General Consultation"}</h4>
                                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                <Calendar className="w-3.5 h-3.5" /> {new Date(appt.appointment_date).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                                <Clock className="w-3.5 h-3.5" /> {new Date(appt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        {appt.notes && (
                                            <div className="mt-4 bg-amber-50/50 p-4 rounded-xl text-sm text-slate-700 border border-amber-100 leading-relaxed whitespace-pre-wrap">
                                                {appt.notes}
                                            </div>
                                        )}
                                    </div>
                                    <span className="mt-3 md:mt-0 md:ml-4 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                        {appt.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- RENDER THE MODAL --- */}
            {/* {showConsultModal && (
                <ConsultationModal 
                    patientId={data.patient.id}
                    patientName={data.patient.name}
                    onClose={() => setShowConsultModal(false)}
                    onSuccess={() => {
                        fetchHistory(); // Refresh the list without reloading the page!
                    }}
                />
            )} */}

            {showConsultModal && (
                <MedicalRecordForm 
                    patientId={data.patient.id}
                    patientName={data.patient.name}
                    onClose={() => setShowConsultModal(false)}
                    onSuccess={() => {
                        fetchHistory(); // Refresh the list to see the new record
                    }}
                />
            )}
        </div>
    );
};

export default PatientDetails;