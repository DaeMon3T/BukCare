import React, { useEffect, useState } from 'react';
import QRCode from "react-qr-code";
import api from '@/services/api';
import { type MedicalProfile } from '@/types/User';
import { useAuth } from '@/context/AuthContext';
import { 
    ShieldCheck, 
    Phone, 
    Droplet, 
    AlertTriangle,
    User,
    QrCode
} from 'lucide-react';

const MedicalIDCard: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<MedicalProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMedicalProfile();
    }, []);

    const fetchMedicalProfile = async () => {
        try {
            const response = await api.get('/medical-profile/me');
            setProfile(response.data);
        } catch (err) {
            console.error("Failed to load medical ID", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center h-64 w-full">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Loading ID...</p>
        </div>
    );

    return (
        <div className="flex flex-col w-full h-full">
            {/* --- CARD CONTAINER --- */}
            <div className="bg-white w-full max-w-[390px] mx-auto rounded-[1.5rem] shadow-xl shadow-blue-900/10 overflow-hidden border border-slate-100 relative flex flex-col">
                
                {/* 1. Header (Compact Version of Profile) */}
                <div className="h-24 bg-gradient-to-r from-purple-700 to-[#2dc7f8] relative shrink-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-100"></div>
                    
                    {/* Official Badge */}
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm border border-white/30 px-2 py-1 rounded-lg flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-white" />
                        <span className="text-[9px] font-bold text-white tracking-widest uppercase">Official ID</span>
                    </div>
                </div>

                {/* 2. Profile Info (Overlapping) */}
                <div className="px-5 pb-5 relative flex-1 flex flex-col">
                    
                    {/* Avatar - Negative margin to overlap */}
                    <div className="-mt-10 mb-2 flex justify-center">
                        <div className="h-20 w-20 rounded-full ring-4 ring-white bg-white shadow-md overflow-hidden relative z-10">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                    <User className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Name & UID */}
                    <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                            {user?.fname} {user?.lname}
                        </h2>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider bg-slate-50 inline-block px-2 py-0.5 rounded border border-slate-100">
                            ID: {profile?.medical_uid || "----"}
                        </p>
                    </div>

                    {/* 3. QR Code (Compact) */}
                    <div className="bg-slate-900 rounded-xl p-4 mb-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-80"></div>
                        
                        <div className="relative z-10 bg-white p-2 rounded-lg shadow-sm border border-white/10">
                            {profile?.medical_uid && (
                                <QRCode 
                                    value={profile.medical_uid} 
                                    size={120} // Smaller size to fit modal
                                    viewBox={`0 0 256 256`}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                />
                            )}
                        </div>
                        <p className="relative z-10 text-slate-400 text-[9px] font-bold uppercase tracking-[0.15em] mt-2 flex items-center gap-1.5 opacity-80">
                            <QrCode className="w-3 h-3" /> Scan to Access Record
                        </p>
                    </div>

                    {/* 4. Vital Stats (Side-by-Side) */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg text-center">
                            <p className="text-[9px] font-bold text-rose-400 uppercase flex items-center justify-center gap-1">
                                <Droplet className="w-3 h-3" /> Blood
                            </p>
                            <p className="text-lg font-black text-slate-800 leading-tight">{profile?.blood_type || "--"}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg text-center">
                            <p className="text-[9px] font-bold text-amber-500 uppercase flex items-center justify-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Allergies
                            </p>
                            <p className="text-xs font-bold text-slate-700 leading-tight truncate px-1 mt-1">
                                {profile?.allergies || "None"}
                            </p>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <Phone className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Emergency Contact</p>
                            <p className="text-xs font-bold text-slate-800 truncate">{profile?.emergency_contact_name || "Not Set"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{profile?.emergency_contact_number || "--"}</p>
                        </div>
                    </div>

                </div>

                {/* Footer Strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 shrink-0"></div>
            </div>
        </div>
    );
};

export default MedicalIDCard;