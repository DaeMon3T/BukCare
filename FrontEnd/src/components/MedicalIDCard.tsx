import React, { useEffect, useState } from 'react';
import QRCode from "react-qr-code";
import api from '../services/api';
import { type MedicalProfile } from '../types/User';
import { useAuth } from '../context/AuthContext'; // Import this to get the name
import { Droplet, AlertCircle, Printer, ShieldCheck } from 'lucide-react'; // Added icons

const MedicalIDCard: React.FC = () => {
    const { user } = useAuth(); // Get user details for the card header
    const [profile, setProfile] = useState<MedicalProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchMedicalProfile();
    }, []);

    const fetchMedicalProfile = async () => {
        try {
            const response = await api.get('/medical-profile/me');
            setProfile(response.data);
        } catch (err) {
            console.error("Failed to load medical ID", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-8 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Generating Secure ID...</p>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-500 font-bold">Service Unavailable</div>;

    return (
        <div className="bg-white w-full h-130 max-w-sm mx-auto overflow-hidden flex flex-col relative print:shadow-none print:border-none">
            
            {/* --- HEADER: Official Gradient Look --- */}
            <div className="bg-gradient-to-r from-blue-700 to-[#2dc7f8] p-6 text-center relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-[-50%] left-[-20%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-white/90 text-xs font-bold tracking-[0.2em] uppercase">BukCare Digital Pass</h3>
                    </div>
                    {/* Patient Name on the Card */}
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {user?.fname} {user?.lname}
                    </h2>
                    <p className="text-blue-200 text-sm font-medium mt-1">Patient ID</p>
                </div>
            </div>
            
            {/* --- BODY --- */}
            <div className="p-8 flex flex-col items-center bg-white relative">
                
                {/* QR Code with "Scanner" Frame Effect */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl opacity-20 blur-sm group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-white p-4 border border-slate-100 rounded-xl shadow-lg">
                        {profile?.medical_uid && (
                            <QRCode 
                                value={profile.medical_uid} 
                                size={180}
                                fgColor="#0f172a" // Dark slate for sharp contrast
                            />
                        )}
                    </div>
                </div>

                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-2">Scan at Clinic</p>

                {/* --- VITALS SECTION --- */}
                <div className="w-full grid grid-cols-2 gap-4 mt-4">
                    
                    {/* Blood Type Pill */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Droplet className="w-3.5 h-3.5 text-rose-500" fill="currentColor" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Blood Type</span>
                        </div>
                        <span className="text-xl font-black text-slate-800">
                            {profile?.blood_type || "--"}
                        </span>
                    </div>

                    {/* Allergies Pill */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Allergies</span>
                        </div>
                        <span className={`text-sm font-bold truncate max-w-[100px] ${profile?.allergies ? "text-slate-800" : "text-slate-400"}`}>
                            {profile?.allergies || "None"}
                        </span>
                    </div>
                </div>

                {/* --- ACTION BUTTON --- */}
                <button 
                    onClick={() => window.print()}
                    className="mt-8 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
                >
                    <Printer className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    Save / Print Card
                </button>

            </div>
            
            {/* Bottom Decorative Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
        </div>
    );
};

export default MedicalIDCard;