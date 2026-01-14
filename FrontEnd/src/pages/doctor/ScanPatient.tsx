import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '@/components/QRScanner'; 
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, User, AlertTriangle } from 'lucide-react';

// 1. UPDATE INTERFACE: Added 'user_id' so we can link to their history
interface PatientRecord {
    id: number;          // This is the Profile ID
    user_id: number;     // This is the Patient ID (We need this!)
    medical_uid: string;
    blood_type?: string;
    allergies?: string;
    emergency_contact_name?: string;
}

const ScanPatient: React.FC = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState<PatientRecord | null>(null);

    const handleScan = async (decodedText: string) => {
        setScanning(false);
        setLoading(true);

        try {
            // Hit the endpoint
            const response = await api.get(`/medical-profile/scan/${decodedText}`);
            setPatientData(response.data);
            toast.success("Patient Record Found!");
        } catch (error) {
            console.error("Scan failed", error);
            toast.error("Invalid QR Code or Patient Not Found");
            setScanning(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Patient Scanner</h1>
            </div>

            {/* SCANNER VIEW */}
            {scanning && !patientData && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <QRScanner onScanSuccess={handleScan} />
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-medium">Fetching Records...</p>
                </div>
            )}

            {/* RESULT VIEW */}
            {patientData && (
                <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-blue-600 p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-full">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Patient Found</h2>
                                <p className="text-blue-100 text-sm">ID: {patientData.medical_uid.slice(0, 8)}...</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Blood Type</p>
                                <p className="text-2xl font-black text-slate-800">{patientData.blood_type || "--"}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-xs text-red-500 uppercase font-bold mb-1">Allergies</p>
                                <p className="text-lg font-bold text-red-700">{patientData.allergies || "None"}</p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">Emergency Contact</h3>
                                <p className="text-slate-600 font-medium">{patientData.emergency_contact_name || "Not set"}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button 
                                onClick={() => { setPatientData(null); setScanning(true); }}
                                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                            >
                                Scan Next
                            </button>
                            
                            {/* 2. BUTTON FIX: Added onClick navigation */}
                            <button 
                                onClick={() => navigate(`/doctor/patient/${patientData.user_id}`)}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                            >
                                View Full History
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanPatient;