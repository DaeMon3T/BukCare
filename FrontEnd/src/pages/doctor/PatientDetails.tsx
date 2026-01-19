import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    User, 
    Activity, 
    Phone,
    // MapPin,
    AlertTriangle,
    Droplet,
    FileText,
    CheckCircle2
} from 'lucide-react';

const PatientDetails = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    // State
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fetch Logic
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

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold tracking-wider uppercase text-xs">Loading Patient Profile...</p>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Patient Not Found</h2>
            <button onClick={() => navigate(-1)} className="text-blue-600 font-bold hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            
            {/* --- 1. HEADER SECTION --- */}
            <div className="bg-white border-b border-slate-100 shadow-sm relative overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>
                
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Navigation */}
                    <button 
                        onClick={() => navigate("/doctor/dashboard")} 
                        className="mb-8 flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-blue-600 transition-colors w-fit group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>

                    {/* Patient Identity */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-28 h-28 bg-slate-100 rounded-full p-1.5 shadow-inner shrink-0 relative">
                            {data.patient.avatar ? (
                                <img src={data.patient.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover shadow-sm"/>
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-500">
                                    <User className="w-12 h-12" />
                                </div>
                            )}
                            {/* Status Dot */}
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full" title="Active Patient"></div>
                        </div>
                        
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{data.patient.name}</h1>
                            
                            <div className="flex flex-wrap gap-3">
                                <div className="text-gray-500">
                                    ID: 20260{data.patient.id} 
                                </div>
                                {/* <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" /> 
                                    {data.patient.contact || "No Contact"}
                                </span>
                                <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">
                                    <MapPin className="w-4 h-4 text-slate-400" /> 
                                    {data.patient.address || "No Address"}
                                </span> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 2. MAIN CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT SIDEBAR: QUICK MEDICAL VIEW (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Critical Vitals Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Activity className="w-4 h-4 text-rose-500" /> Medical Alerts
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Blood Type */}
                            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-rose-500 shadow-sm">
                                        <Droplet className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-bold text-rose-900">Blood Type</span>
                                </div>
                                <span className="text-2xl font-black text-rose-600">{data.profile?.blood_type || "--"}</span>
                            </div>

                            {/* Allergies */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Allergies</p>
                                {data.profile?.allergies ? (
                                    <div className="flex flex-wrap gap-2">
                                        {data.profile.allergies.split(',').map((alg: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-100 text-sm font-bold rounded-lg flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5" /> {alg.trim()}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400 italic px-2">No known allergies</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Emergency Contact
                        </h3>
                        {data.profile?.emergency_contact_name ? (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="font-bold text-slate-900">{data.profile.emergency_contact_name}</p>
                                <p className="text-sm text-slate-500 font-mono mt-1">{data.profile.emergency_contact_number}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Not set by patient</p>
                        )}
                    </div>
                </div>

                {/* RIGHT CONTENT: APPOINTMENT HISTORY (8 cols) */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" /> Appointment History
                        </h2>
                        <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {data.appointments.length} Total Visits
                        </span>
                    </div>

                    {data.appointments.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No History Found</h3>
                            <p className="text-slate-500 mt-1 max-w-xs mx-auto">This patient has no recorded past appointments in the system.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.appointments.map((appt: any) => (
                                <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-3">
                                        <div className="flex items-start gap-4">
                                            {/* Date Box */}
                                            <div className="bg-blue-50 text-blue-700 rounded-xl p-3 text-center min-w-[70px] shrink-0">
                                                <p className="text-xs font-bold uppercase">{new Date(appt.appointment_date).toLocaleString('default', { month: 'short' })}</p>
                                                <p className="text-xl font-black">{new Date(appt.appointment_date).getDate()}</p>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">Reason: <h2 className='text-base text-slate-700'>{appt.reason || "---"}</h2></h4>
                                                
                                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" /> 
                                                        {new Date(appt.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <span className="hidden sm:inline text-slate-300">|</span>
                                                    <span className="capitalize">{appt.type || "In-Person"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                                            appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                            appt.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                            {appt.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                            {appt.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDetails;