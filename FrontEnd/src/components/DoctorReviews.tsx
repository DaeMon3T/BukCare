import React, { useState, useEffect } from "react";
import { Star, MessageSquare, CheckCircle } from "lucide-react"; // Import CheckCircle here
import reviewsAPI from "@/services/reviews";

// 1. Update Interface to handle both formats
export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  // The backend might send ONE of these formats:
  patient_name?: string; 
  patient?: {
    fname: string;
    lname: string;
  };
}

interface Props {
  doctorId: number;
}

const DoctorReviews: React.FC<Props> = ({ doctorId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchReviews = async () => {
    try {
      const data = await reviewsAPI.getDoctorReviews(doctorId);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
          setReviews(data);
      } else {
          console.error("API did not return an array:", data);
          setReviews([]);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [doctorId]);

  // Calculate Average
  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  // Helper to safely get the name
  const getPatientName = (rev: Review) => {
      if (rev.patient_name) return rev.patient_name;
      if (rev.patient) return `${rev.patient.fname} ${rev.patient.lname}`;
      return "Verified Patient";
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      
      {/* Header & Stats */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h3 className="text-2xl font-bold text-slate-900">Patient Reviews</h3>
            <p className="text-slate-500 text-sm">{reviews.length} Verified Feedback(s)</p>
        </div>
        <div className="text-right">
            <div className="flex items-center gap-1 text-yellow-400">
                <span className="text-3xl font-black text-slate-900">{averageRating.toFixed(1)}</span>
                <Star className="w-6 h-6 fill-current" />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Average Rating</p>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        ) : reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-900 font-medium">No reviews yet</p>
                <p className="text-slate-500 text-sm">Patient reviews will appear here after appointments are completed.</p>
            </div>
        ) : (
            reviews.map((rev) => {
                const patientName = getPatientName(rev);
                
                return (
                    <div key={rev.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold uppercase">
                                    {patientName.charAt(0)}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900 text-sm block">{patientName}</span>
                                    <span className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                        <CheckCircle className="w-3 h-3" /> Verified Patient
                                    </span>
                                </div>
                            </div>
                            <div className="flex text-yellow-400 gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < rev.rating ? "fill-current" : "text-slate-200"}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed pl-[52px]">{rev.comment}</p>
                        <p className="text-xs text-slate-400 mt-2 pl-[52px]">
                            {rev.created_at 
                                ? new Date(rev.created_at).toLocaleDateString() 
                                : "Recently"}
                        </p>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};

export default DoctorReviews;