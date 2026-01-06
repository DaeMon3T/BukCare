import React, { useState, useEffect } from "react";
import { Star, User, MessageSquare } from "lucide-react";
import reviewsAPI, { type Review } from "@/services/reviews";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Props {
  doctorId: number;
}

const DoctorReviews: React.FC<Props> = ({ doctorId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const data = await reviewsAPI.getDoctorReviews(doctorId);
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [doctorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a star rating");
    if (!user) return toast.error("You must be logged in to review");

    setSubmitting(true);
    try {
      await reviewsAPI.createReview({ doctor_id: doctorId, rating, comment });
      toast.success("Review posted!");
      setRating(0);
      setComment("");
      fetchReviews(); // Refresh list
    } catch (err) {
      toast.error("Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate Average
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
      
      {/* Header & Stats */}
      <div className="flex items-center justify-between mb-8">
        <div>
            <h3 className="text-2xl font-bold text-slate-900">Patient Reviews</h3>
            <p className="text-slate-500 text-sm">{reviews.length} feedback(s)</p>
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
      <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
            <p className="text-slate-400 text-sm">Loading reviews...</p>
        ) : reviews.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>
            </div>
        ) : (
            reviews.map((rev) => (
                <div key={rev.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{rev.patient_name}</span>
                        </div>
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < rev.rating ? "fill-current" : "text-slate-200"}`} />
                            ))}
                        </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{rev.comment}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(rev.created_at).toLocaleDateString()}</p>
                </div>
            ))
        )}
      </div>

      {/* Add Review Form (Only for Patients) */}
      {user?.role === 'patient' && (
          <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 text-sm">Write a Review</h4>
            
            {/* Star Selector */}
            <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-transform hover:scale-110 ${rating >= star ? "text-yellow-400 fill-current" : "text-slate-300"}`}
                    >
                        <Star className="w-6 h-6" />
                    </button>
                ))}
            </div>

            <textarea 
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                rows={3}
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
            />

            <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
                {submitting ? "Posting..." : "Submit Review"}
            </button>
          </form>
      )}
    </div>
  );
};

export default DoctorReviews;