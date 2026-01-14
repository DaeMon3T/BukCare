import React, { useState } from 'react';
import { X, Save, Stethoscope } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ConsultationModalProps {
    patientId: number;
    patientName: string;
    onClose: () => void;
    onSuccess: () => void; // To refresh the history list after saving
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({ patientId, patientName, onClose, onSuccess }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine Diagnosis and Notes into one string for simplicity
            // Or you can add a 'diagnosis' column to your DB later if you want them separate
            const fullNotes = `DIAGNOSIS: ${diagnosis}\n\nNOTES/RX: ${notes}`;

            await api.post(`/doctors/patients/${patientId}/consultation`, {
                doctor_id: 0, // Backend handles this from token
                patient_id: patientId,
                appointment_date: new Date().toISOString(),
                reason: "Walk-in Consultation",
                notes: fullNotes
            });

            toast.success("Consultation recorded successfully!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save consultation", error);
            toast.error("Failed to save record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5" />
                        <h2 className="font-bold text-lg">New Consultation</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 font-medium mb-4">
                        Patient: {patientName}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Diagnosis / Chief Complaint</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="e.g., Acute Bronchitis, Fever..."
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Treatment Plan & Notes</label>
                        <textarea 
                            required
                            rows={4}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                            placeholder="Prescribed antibiotics, rest advised..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save Record</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConsultationModal;