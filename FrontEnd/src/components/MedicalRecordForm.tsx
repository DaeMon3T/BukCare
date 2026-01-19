import React, { useState } from 'react';
import { X, Save, Stethoscope, Activity, FileText, Pill } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface MedicalRecordFormProps {
    patientId: number;
    patientName: string;
    onClose: () => void;
    onSuccess: () => void;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({ patientId, patientName, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    
    // --- THE DIGITAL CLIPBOARD STATE ---
    const [formData, setFormData] = useState({
        // Vitals
        bp: '', 
        heartRate: '', 
        temp: '', 
        weight: '',
        // Clinical Findings
        complaint: '', 
        findings: '',
        // Assessment
        diagnosis: '', 
        prescription: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // We combine the data into a structured block.
        // This makes it easy to read in the history list AND easy to parse for PDF generation later.
        const structuredNotes = `
[VITALS] BP: ${formData.bp} | HR: ${formData.heartRate} | Temp: ${formData.temp} | Wt: ${formData.weight}

[CHIEF COMPLAINT]
${formData.complaint}

[PHYSICAL FINDINGS]
${formData.findings}

[DIAGNOSIS]
${formData.diagnosis}

[PRESCRIPTION / PLAN]
${formData.prescription}
        `.trim();

        try {
            const payload = {
                doctor_id: 0, // Backend handles this via token
                patient_id: patientId,
                appointment_date: new Date().toISOString(),
                reason: formData.diagnosis || "Consultation",
                notes: structuredNotes, // <--- We save the formatted block here
                status: "completed"
            };

            await api.post(`/doctors/patients/${patientId}/consultation`, payload);

            toast.success("Medical Record Saved!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save record", error);
            toast.error("Failed to save medical record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* HEADER - Looks like a folder */}
                <div className="bg-gradient-to-r from-blue-700 to-[#2dc7f8] p-5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white tracking-wide">CLINICAL RECORD</h2>
                            <p className="text-blue-100 text-xs uppercase font-bold tracking-wider opacity-90">Patient: {patientName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition text-white backdrop-blur-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* SCROLLABLE FORM BODY */}
                <div className="overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/50 flex-1">
                    
                    {/* SECTION 1: VITALS */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-rose-500" /> Vital Signs
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "BP (mmHg)", name: "bp", placeholder: "120/80" },
                                { label: "Heart Rate", name: "heartRate", placeholder: "72" },
                                { label: "Temp (°C)", name: "temp", placeholder: "36.5" },
                                { label: "Weight (kg)", name: "weight", placeholder: "70" }
                            ].map((field) => (
                                <div key={field.name}>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">{field.label}</label>
                                    <input 
                                        name={field.name} 
                                        placeholder={field.placeholder} 
                                        onChange={handleChange} 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SECTION 2: CLINICAL FINDINGS */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-blue-500" /> Clinical Findings
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1.5 ml-1">Chief Complaint</label>
                                <textarea 
                                    name="complaint" 
                                    rows={2} 
                                    onChange={handleChange} 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                    placeholder="e.g. Severe headache..." 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1.5 ml-1">Physical Findings</label>
                                <textarea 
                                    name="findings" 
                                    rows={4} 
                                    onChange={handleChange} 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                                    placeholder="e.g. Throat inflammation..." 
                                />
                            </div>
                        </div>

                        {/* SECTION 3: ASSESSMENT & PLAN */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Pill className="w-4 h-4 text-emerald-500" /> Assessment & Plan
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1.5 ml-1">Final Diagnosis</label>
                                <input 
                                    name="diagnosis" 
                                    onChange={handleChange} 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
                                    placeholder="e.g. Acute Migraine" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1.5 ml-1">Prescription / Plan</label>
                                <textarea 
                                    name="prescription" 
                                    rows={4} 
                                    onChange={handleChange} 
                                    className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm font-mono text-slate-800 resize-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all" 
                                    placeholder="Rx..." 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={loading} 
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Record</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicalRecordForm;