import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Filter, X, Stethoscope, Activity, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import DoctorCard, { type Doctor } from "@/components/DoctorCard";
import api from "@/services/api"; 

const FindDoctor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Data States
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination States
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 6; 

  const [activeFilter, setActiveFilter] = useState<string>(
    searchParams.get("specialization") || "All"
  );

  useEffect(() => {
    const spec = searchParams.get("specialization");
    if (spec) setActiveFilter(spec);
  }, [searchParams]);

  const filters = [
    "All", "General Practice", "Cardiology", "Neurologist", 
    "Pediatrics", "Orthopedics", "Ophthalmology", "Dermatology"
  ];

  // HELPER: Parse Doctor Data (Reusable)
  const parseDoctorData = (data: any[]): Doctor[] => {
    return data.map((doc) => {
        const rawSpec = doc.specializations || doc.specialization;
        let cleanSpec = "General Practice";
        
        // Handle list or string from backend
        if (rawSpec) {
             if (Array.isArray(rawSpec)) {
                 cleanSpec = rawSpec.join(", ");
             } else if (typeof rawSpec === "string") {
                 // Clean up JSON string artifacts if present
                 cleanSpec = rawSpec.replace(/[\[\]"]/g, '');
             }
        }

        return {
            doctor_id: doc.doctor_id,
            name: doc.name,
            specializations: cleanSpec, 
            specialization: cleanSpec,
            avatar: doc.avatar || "/default-avatar.png",
            address: doc.address || "No address provided",
            email: doc.email || "",
            user_id: doc.user_id,
            is_verified: doc.is_verified,
            is_doctor_approved: doc.is_doctor_approved,
            license_number: doc.license_number,
            years_of_experience: doc.years_of_experience,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            availabilities: doc.availabilities || []
        };
    });
  };

  // INITIAL FETCH
  useEffect(() => {
    const fetchInitialDoctors = async () => {
      try {
        setLoading(true);
        // Reset States
        setAllDoctors([]);
        setOffset(0);
        setHasMore(true);

        // Fetch first page (skip=0)
        const response = await api.get(`/doctors/?skip=0&limit=${LIMIT}`);
        const formatted = parseDoctorData(response.data);

        setAllDoctors(formatted);
        setOffset(formatted.length); // Update offset for next load
        
        // If we got fewer items than the limit, we've reached the end
        if (formatted.length < LIMIT) setHasMore(false);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load doctors.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDoctors();
  }, []); // Run once on mount

  // LOAD MORE FUNCTION
  const loadMoreDoctors = async () => {
      if (loadingMore || !hasMore) return;

      try {
          setLoadingMore(true);
          
          // Fetch next page based on current offset
          const response = await api.get(`/doctors/?skip=${offset}&limit=${LIMIT}`);
          const newDoctors = parseDoctorData(response.data);

          if (newDoctors.length === 0) {
              setHasMore(false);
          } else {
              // Append new doctors to the existing list
              setAllDoctors(prev => [...prev, ...newDoctors]);
              setOffset(prev => prev + newDoctors.length);
              
              if (newDoctors.length < LIMIT) setHasMore(false);
          }

      } catch (err) {
          toast.error("Could not load more doctors.");
      } finally {
          setLoadingMore(false);
      }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "All") {
        searchParams.delete("specialization");
    } else {
        searchParams.set("specialization", filter);
    }
    setSearchParams(searchParams);
  };

  // This filtering happens on the CLIENT side (only on loaded doctors)
  const filteredDoctors = allDoctors.filter((doc) => {
    const query = search.toLowerCase();
    const docName = doc.name?.toLowerCase() || "";
    const specStr = (doc.specializations || "").toString().toLowerCase();
    const matchesSearch = docName.includes(query) || specStr.includes(query);
    const matchesFilter = activeFilter === "All" || specStr.includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans text-slate-800 flex flex-col">
      
      {/* AMBIENT BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* HERO SEARCH SECTION */}
            <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-sm p-6 sm:p-8 mb-8 relative overflow-hidden">
                <Stethoscope className="absolute -right-10 -top-10 w-48 h-48 sm:w-64 sm:h-64 text-blue-600/5 rotate-12 pointer-events-none" />
                
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Find your Specialist</h1>
                    <p className="text-slate-500 mb-6 sm:mb-8 max-w-lg font-medium text-sm sm:text-base">Search through our network of trusted medical professionals to find the right care for you.</p>
                    
                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, specialization, etc..."
                                className="w-full pl-14 pr-10 py-3 sm:py-4 bg-white/60 border border-white/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-sm text-slate-700 placeholder:text-slate-400 text-sm sm:text-base"
                            />
                            {search && (
                                <button 
                                    onClick={() => setSearch("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3 text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                            <Filter className="w-3 h-3 sm:w-4 sm:h-4" /> Filter by Specialization
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar items-center mask-image-gradient-r">
                            {filters.map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => handleFilterChange(filter)}
                                    className={`whitespace-nowrap px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all border ${
                                        activeFilter === filter
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/30 scale-105"
                                            : "bg-white/50 border-white/60 text-slate-600 hover:bg-white hover:border-white hover:shadow-md"
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS GRID */}
            <div className="min-h-[300px]">
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <DoctorCardSkeleton key={n} />
                        ))}
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"> 
                            {filteredDoctors.map((doc) => (
                                <Link 
                                    to={`/patient/doctor/${doc.doctor_id}`} 
                                    key={doc.doctor_id}
                                    className="block transition-all hover:-translate-y-1 hover:shadow-xl rounded-[2rem]"
                                >
                                    <DoctorCard doctor={doc} />
                                </Link>
                            ))}
                        </div>

                        {/* LOAD MORE BUTTON */}
                        {hasMore && (
                             <div className="flex justify-center mt-12 pb-8">
                                <button 
                                    onClick={loadMoreDoctors}
                                    disabled={loadingMore}
                                    className="px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More Doctors"
                                    )}
                                </button>
                             </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/50 border-dashed">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 text-center px-4">No doctors found</h3>
                        <p className="text-slate-500 max-w-sm text-center mt-2 font-medium px-4 text-sm sm:text-base">
                            We couldn't find any doctors matching "{search}" {activeFilter !== "All" && `in ${activeFilter}`}.
                        </p>
                        <button 
                            onClick={() => { setSearch(""); handleFilterChange("All"); }}
                            className="mt-8 px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>

            </div>
        </main>
      </div>
    </div>
  );
};

const DoctorCardSkeleton = () => (
    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-6 border border-white/50 shadow-sm flex flex-col gap-4 animate-pulse h-full">
        <div className="h-24 bg-slate-200/50 rounded-2xl mb-4"></div>
        <div className="flex justify-center -mt-16">
            <div className="w-24 h-24 bg-slate-200/50 rounded-full border-4 border-white/50"></div>
        </div>
        <div className="space-y-3 text-center mt-2">
            <div className="h-4 bg-slate-200/50 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-slate-200/50 rounded w-1/3 mx-auto"></div>
        </div>
        <div className="h-12 bg-slate-200/50 rounded-xl mt-auto"></div>
    </div>
);

export default FindDoctor;