import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import toast from 'react-hot-toast';
import { 
    Save, 
    ArrowLeft, 
    Heart, 
    Phone, 
    FileText, 
    Droplet, 
    ShieldAlert, 
    User, 
    Stethoscope, 
    Pill 
} from 'lucide-react';
import Navbar from '../../components/Navbar'; 

const MedicalProfileSettings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Initial Form State
    const [formData, setFormData] = useState({
        blood_type: '',
        allergies: '',
        emergency_contact_name: '',
        emergency_contact_number: '',
        chronic_conditions: '',
        current_medications: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/medical-profile/me');
                setFormData({
                    blood_type: res.data.blood_type || '',
                    allergies: res.data.allergies || '',
                    emergency_contact_name: res.data.emergency_contact_name || '',
                    emergency_contact_number: res.data.emergency_contact_number || '',
                    chronic_conditions: res.data.chronic_conditions || '',
                    current_medications: res.data.current_medications || ''
                });
            } catch (error) {
                console.error("Failed to load profile", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/medical-profile/me', formData);
            toast.success("Medical Profile Updated Successfully!");
        } catch (error) {
            console.error("Update failed", error);
            toast.error("Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-900 pb-20">
            
            {/*DECORATIVE BACKGROUND BLOBS */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                {/* Top Right: Soft Blue */}
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-70 mix-blend-multiply" />
                
                {/* Bottom Left: Soft Indigo */}
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-70 mix-blend-multiply" />
                
                {/* Center: Very subtle Rose tint for warmth */}
                <div className="absolute top-[20%] left-[30%] w-[400px] h-[400px] bg-rose-50/60 rounded-full blur-3xl opacity-50 mix-blend-multiply" />
            </div>

            {/* CONTENT WRAPPER (z-10 ensures it sits above the blobs) */}
            <div className="relative z-10">
                <Navbar />
                
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <button 
                            onClick={() => navigate('/patient/profile')} 
                            className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-4 transition-colors font-medium"
                        >
                            <div className="p-1.5 rounded-full bg-white/80 border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors backdrop-blur-sm">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            Back to Profile
                        </button>
                        
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white/80 backdrop-blur-md text-rose-600 rounded-2xl shadow-sm border border-white/50">
                                <Heart className="w-8 h-8 fill-rose-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Profile</h1>
                                <p className="text-slate-500 mt-1">
                                    Crucial health information accessible by doctors via QR code.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Card 1: Critical Vitals */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <Droplet className="w-5 h-5 text-blue-500" />
                                <h2 className="font-bold text-slate-800">Critical Information</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Blood Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        Blood Type
                                    </label>
                                    <div className="relative">
                                        <select 
                                            name="blood_type" 
                                            value={formData.blood_type} 
                                            onChange={handleChange}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all font-medium text-slate-700 appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Type...</option>
                                            {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Allergies */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                                        Allergies
                                    </label>
                                    <input 
                                        name="allergies" 
                                        value={formData.allergies} 
                                        onChange={handleChange}
                                        placeholder="e.g. Peanuts, Penicillin"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Emergency Contact */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <Phone className="w-5 h-5 text-green-500" />
                                <h2 className="font-bold text-slate-800">Emergency Contact</h2>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        Contact Name
                                    </label>
                                    <input 
                                        name="emergency_contact_name" 
                                        value={formData.emergency_contact_name} 
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        Phone Number
                                    </label>
                                    <input 
                                        name="emergency_contact_number" 
                                        value={formData.emergency_contact_number} 
                                        onChange={handleChange}
                                        placeholder="0912..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Medical History */}
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-800">Medical History <span className="text-slate-400 font-normal text-sm ml-2">(Optional)</span></h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-slate-400" />
                                        Chronic Conditions
                                    </label>
                                    <textarea 
                                        name="chronic_conditions" 
                                        value={formData.chronic_conditions} 
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="e.g. Asthma, Hypertension, Diabetes"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Pill className="w-4 h-4 text-slate-400" />
                                        Current Medications
                                    </label>
                                    <textarea 
                                        name="current_medications" 
                                        value={formData.current_medications} 
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="e.g. Losartan 50mg, Metformin 500mg"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {loading ? "Saving Changes..." : "Save Medical Profile"}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default MedicalProfileSettings;