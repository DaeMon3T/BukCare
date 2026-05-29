import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRScanner from '@/components/QRScanner'; 
import api from '@/services/api';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, 
    Search, 
    User, 
    ChevronRight, 
    ShieldCheck, 
    Activity,
    QrCode
} from 'lucide-react';
import notificationSound from "@/assets/sounds/notification2.mp3"; 

// Types matches your new Backend Response
interface PatientRecord {
    id: number;
    user_id: number; 
    medical_uid: string;
    blood_type?: string;
    allergies?: string;
    emergency_contact_name?: string;
    fname?: string;  // <--- Now coming from backend
    lname?: string;  // <--- Now coming from backend
    picture?: string; // <--- Now coming from backend
}

const ScanPatient: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isStaff = location.pathname.startsWith('/staff');
    
    // States
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState<PatientRecord | null>(null);
    const [manualId, setManualId] = useState("");

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio(notificationSound);
    }, []);

    const playBeep = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    };

    // --- HANDLERS ---
    const processResult = async (uid: string) => {
        if (!uid) return;
        setScanning(false);
        setLoading(true);
        playBeep(); 

        try {
            const cleanId = uid.trim();
            const response = await api.get(`/medical-profile/scan/${encodeURIComponent(cleanId)}`);
            setPatientData(response.data);
            toast.success("Patient Verified Successfully");
        } catch (error) {
            console.error("Scan failed", error);
            toast.error("Patient Not Found or Invalid ID");
            setScanning(true); 
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualId.trim()) return;
        processResult(manualId);
    };

    const handleReset = () => {
        setPatientData(null);
        setManualId("");
        setScanning(true);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex flex-col items-center">
            
            {/* Header Navigation */}
            <div className="w-full max-w-lg mb-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate(isStaff ? '/staff/dashboard' : '/doctor/dashboard')} 
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="text-right">
                    <h1 className="text-lg font-bold text-slate-900">Patient Admission</h1>
                    <p className="text-xs text-slate-500 font-medium">Scan QR to verify identity</p>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="w-full max-w-md">
                
                {/* STATE 1: SCANNING MODE */}
                {scanning && !patientData && (
                    <div className="animate-in fade-in zoom-in duration-300 flex flex-col gap-6">
                        
                        {/* Scanner Card */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden relative">
                            {/* Blue Header Strip */}
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 w-full"></div>
                            
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                                        <QrCode className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Scan Patient ID</h2>
                                    <p className="text-sm text-slate-500">Align the QR code within the camera frame</p>
                                </div>

                                {/* SCANNER COMPONENT WRAPPER */}
                                <div className="rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 relative min-h-[300px] flex flex-col justify-center">
                                    {!loading && (
                                        <QRScanner onScanSuccess={processResult} />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 text-slate-400">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs font-bold uppercase tracking-wider">Or Manually</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {/* Manual Entry Input */}
                        <form onSubmit={handleManualSearch} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <div className="p-3 text-slate-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Enter Patient ID Code..." 
                                className="flex-1 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm h-full py-2"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!manualId.trim() || loading}
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Verify
                            </button>
                        </form>
                    </div>
                )}

                {/* STATE 2: LOADING */}
                {loading && (
                    <div className="bg-white rounded-[2rem] p-10 text-center shadow-xl border border-slate-100 min-h-[400px] flex flex-col items-center justify-center animate-pulse">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                        <h3 className="text-lg font-bold text-slate-900">Verifying Identity...</h3>
                        <p className="text-slate-500 text-sm mt-1">Accessing secure medical records</p>
                    </div>
                )}

                {/* STATE 3: RESULT CARD (Verified) */}
                {patientData && !loading && (
                    <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-900/10 border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
                        
                        {/* Result Header */}
                        <div className="bg-gradient-to-br from-blue-600 to-[#00aeef] p-8 text-center relative">
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border border-white/30 shadow-inner">
                                    <ShieldCheck className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Patient Found</h2>
                                <p className="text-blue-100 text-sm font-medium mt-1 font-mono tracking-wide opacity-90">
                                    ID: 20260{patientData.user_id}
                                </p>
                            </div>
                        </div>

                        {/* Result Body */}
                        <div className="p-6">
                            
                            {/* Patient Info Display */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                {/* Profile Picture Logic */}
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 overflow-hidden shrink-0">
                                    {patientData.picture ? (
                                        <img 
                                            src={patientData.picture} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <User className="w-8 h-8" />
                                    )}
                                </div>
                                
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</p>
                                    <h3 className="text-lg font-bold text-slate-900 truncate">
                                        {patientData.fname || "Unknown"} {patientData.lname || "Patient"}
                                    </h3>
                                </div>
                            </div>

                            {/* Vital Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white border border-slate-200 p-3 rounded-xl text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Type</p>
                                    <p className="text-xl font-black text-slate-800">{patientData.blood_type || "--"}</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                        <Activity className="w-3 h-3" /> Allergies
                                    </p>
                                    <p className="text-sm font-bold text-amber-900 truncate px-1">
                                        {patientData.allergies || "None"}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => navigate(isStaff ? `/staff/patient/${patientData.user_id}` : `/doctor/patient/${patientData.user_id}`)}
                                    className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-300/50 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                >
                                    Open Medical Record 
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                
                                <button 
                                    onClick={handleReset}
                                    className="w-full py-3.5 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors active:scale-[0.98]"
                                >
                                    Scan Next Patient
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ScanPatient;