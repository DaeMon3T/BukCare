import { useState } from "react";
import { FileText, X } from "lucide-react";

interface ConsultationNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  onSubmit: (notes: string) => Promise<void>;
}

const ConsultationNotesModal = ({
  isOpen,
  onClose,
  patientName,
  onSubmit,
}: ConsultationNotesModalProps) => {
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      await onSubmit(notes);
      setNotes("");
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = async () => {
    setProcessing(true);
    try {
      await onSubmit("");
      setNotes("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-blue-100 relative">
          <button
            onClick={onClose}
            disabled={processing}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 text-blue-600 shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Complete Appointment</h3>
          <p className="text-sm text-slate-500 mt-1">
            Add consultation notes for <span className="font-bold text-slate-700">{patientName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
              Consultation Notes / Prescription
            </label>
            <textarea
              className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none bg-slate-50 transition-all"
              rows={5}
              placeholder="e.g., Patient presents with mild fever. Prescribed Paracetamol 500mg. Follow-up in 7 days..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 flex gap-3 bg-slate-50/50 border-t border-slate-100">
          <button
            onClick={handleSkip}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white border border-slate-200 transition-all disabled:opacity-50"
          >
            Skip Notes
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || !notes.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Complete & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationNotesModal;
