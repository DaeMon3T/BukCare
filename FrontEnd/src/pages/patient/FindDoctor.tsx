import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, Filter, X, Stethoscope } from "lucide-react";
import Navbar from "@/components/Navbar";
import DoctorCard, { type Doctor } from "@/components/DoctorCard";
import GetDoctorAPI from "@/services/patient/GetDoctorAPI";

const FindDoctor: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data: any[] = await GetDoctorAPI.getDoctors();

        const formattedDoctors: Doctor[] = data.map((doc) => {
            const rawSpec = doc.specializations || doc.specialization;
            
            let cleanSpec = "General Practice";
            if (rawSpec) {
                cleanSpec = Array.isArray(rawSpec) ? rawSpec.join(", ") : String(rawSpec);
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

        setAllDoctors(formattedDoctors);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load doctors.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (filter === "All") {
        searchParams.delete("specialization");
    } else {
        searchParams.set("specialization", filter);
    }
    setSearchParams(searchParams);
  };

  const filteredDoctors = allDoctors.filter((doc) => {
    const query = search.toLowerCase();
    
    const docName = doc.name?.toLowerCase() || "";
    
    const specStr = (doc.specializations || doc.specializations || "").toString().toLowerCase();

    const matchesSearch = docName.includes(query) || specStr.includes(query);
    
    const matchesFilter = 
        activeFilter === "All" || 
        specStr.includes(activeFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* HERO SEARCH SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Find the right doctor for you</h1>
            <p className="text-slate-500 mb-6">Search by doctor name or specialization</p>
            
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="e.g. Dr. Smith or Cardiology..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {search && (
                        <button 
                            onClick={() => setSearch("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar items-center">
                    <Filter className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0 hidden md:block" />
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => handleFilterChange(filter)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeFilter === filter
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>
          </div>

          {/* RESULTS GRID */}
          {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <DoctorCardSkeleton key={n} />
            ))}
          </div>
        ) : filteredDoctors.length > 0 ? (
          // 👇 CHANGE THIS LINE
          // grid-cols-2 (for mobile) | md:grid-cols-2 | lg:grid-cols-3
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6"> 
            {filteredDoctors.map((doc) => (
              <Link 
                to={`/patient/doctor/${doc.doctor_id}`} 
                key={doc.doctor_id}
                // Remove 'max-w-sm mx-auto' if you want them to fill the grid cell perfectly
                className="block transition-transform hover:-translate-y-1"
              >
                <DoctorCard doctor={doc} />
              </Link>
            ))}
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Stethoscope className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No doctors found</h3>
                <p className="text-slate-500 max-w-xs text-center mt-1">
                    We couldn't find any doctors matching "{search}" {activeFilter !== "All" && `in ${activeFilter}`}.
                </p>
                <button 
                    onClick={() => { setSearch(""); handleFilterChange("All"); }}
                    className="mt-6 px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Clear All Filters
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const DoctorCardSkeleton = () => (
    // 👇 FIXED: Matches the real card sizing
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 animate-pulse h-full w-full max-w-sm mx-auto sm:max-w-none">
        <div className="h-24 bg-slate-100 rounded-xl mb-4"></div>
        <div className="flex justify-center -mt-12">
            <div className="w-20 h-20 bg-slate-200 rounded-full border-4 border-white"></div>
        </div>
        <div className="space-y-3 text-center mt-2">
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl mt-auto"></div>
    </div>
);

export default FindDoctor;