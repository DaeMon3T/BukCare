import React, { useState } from 'react';
import { X, Save, Stethoscope, Activity, FileText, Pill } from 'lucide-react';
import api from '../services/api';
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
                doctor_id: 0, // Backend handles this
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* HEADER - Looks like a folder */}
                <div className="bg-gradient-to-r from-blue-700 to-[#2dc7f8] p-4 flex justify-between items-center rounded-t-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/40 p-2 rounded-lg">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white tracking-wide">CLINICAL RECORD FORM</h2>
                            <p className="text-slate-400 text-xs text-white uppercase font-bold tracking-wider">Patient: {patientName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition"><X className="w-5 h-5" /></button>
                </div>

                {/* SCROLLABLE FORM BODY */}
                <div className="overflow-y-auto p-8 space-y-6 bg-slate-50 flex-1">
                    
                    {/* SECTION 1: VITALS */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-rose-500" /> Vital Signs
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">BP (mmHg)</label>
                                <input name="bp" placeholder="120/80" onChange={handleChange} className="w-full p-2 border rounded font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Heart Rate</label>
                                <input name="heartRate" placeholder="72" onChange={handleChange} className="w-full p-2 border rounded font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Temp (°C)</label>
                                <input name="temp" placeholder="36.5" onChange={handleChange} className="w-full p-2 border rounded font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
                                <input name="weight" placeholder="70" onChange={handleChange} className="w-full p-2 border rounded font-mono text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SECTION 2: CLINICAL FINDINGS (Subjective/Objective) */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-blue-500" /> Clinical Findings
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">Chief Complaint</label>
                                <textarea name="complaint" rows={2} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm resize-none" placeholder="e.g. Severe headache..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">Physical Findings</label>
                                <textarea name="findings" rows={3} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm resize-none" placeholder="e.g. Throat inflammation..." />
                            </div>
                        </div>

                        {/* SECTION 3: ASSESSMENT & PLAN */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Pill className="w-4 h-4 text-emerald-500" /> Assessment & Plan
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">Final Diagnosis</label>
                                <input name="diagnosis" onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-900" placeholder="e.g. Acute Migraine" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-1">Prescription</label>
                                <textarea name="prescription" rows={3} onChange={handleChange} className="w-full p-3 bg-amber-50 border border-amber-200 rounded text-sm font-mono text-slate-800 resize-none" placeholder="Rx..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg flex items-center gap-2 disabled:opacity-50 transition">
                        {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save to Record</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicalRecordForm;