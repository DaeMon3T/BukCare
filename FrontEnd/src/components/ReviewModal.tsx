import React, { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: number;
  appointmentId: number;
  onSuccess?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  doctorId, 
  appointmentId,
  onSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    try {
      setSubmitting(true);
      
      // Ensure your backend supports receiving appointment_id to verify "Verified Patient" status
      await api.post("/reviews/", {
        doctor_id: doctorId,
        appointment_id: appointmentId, 
        rating,
        comment
      });

      toast.success("Review submitted successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Review failed", error);
      toast.error(error?.response?.data?.detail || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-lg">Rate your Experience</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Tap to Rate</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`} 
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-bold text-amber-500 h-5">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent!"}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Write a Review <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your appointment with the doctor?"
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;