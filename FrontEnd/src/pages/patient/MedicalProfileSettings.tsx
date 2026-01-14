import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Heart, Phone, FileText } from 'lucide-react';
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

    // 1. Load existing data when page opens
    useEffect(() => {
        const fetchData = async () => {
            try {
                // This hits your existing GET /me endpoint
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

    // 2. Send Update to Backend (Hits your PUT /me endpoint)
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
        <div className="min-h-screen bg-slate-50 pb-20">
            <Navbar />
            
            <div className="max-w-2xl mx-auto px-4 py-8">
                <button onClick={() => navigate('/patient/profile')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition">
                    <ArrowLeft className="w-5 h-5" /> Back to profile
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Heart className="w-6 h-6 text-rose-500 fill-current" /> 
                            Edit Medical Profile
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">This info will appear when a doctor scans your QR code.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        
                        {/* BLOOD & ALLERGIES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Blood Type</label>
                                <select 
                                    name="blood_type" 
                                    value={formData.blood_type} 
                                    onChange={handleChange}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select...</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Allergies</label>
                                <input 
                                    name="allergies" 
                                    value={formData.allergies} 
                                    onChange={handleChange}
                                    placeholder="e.g. Peanuts, Penicillin"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* EMERGENCY CONTACT */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> Emergency Contact
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Contact Name</label>
                                    <input 
                                        name="emergency_contact_name" 
                                        value={formData.emergency_contact_name} 
                                        onChange={handleChange}
                                        placeholder="Full Name"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                                    <input 
                                        name="emergency_contact_number" 
                                        value={formData.emergency_contact_number} 
                                        onChange={handleChange}
                                        placeholder="0912..."
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* MEDICAL HISTORY */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Medical History (Optional)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Chronic Conditions</label>
                                    <textarea 
                                        name="chronic_conditions" 
                                        value={formData.chronic_conditions} 
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="e.g. Asthma, Hypertension"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Current Medications</label>
                                    <textarea 
                                        name="current_medications" 
                                        value={formData.current_medications} 
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="e.g. Losartan 50mg"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT */}
                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
                            >
                                {loading ? "Saving..." : <><Save className="w-5 h-5" /> Save Changes</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default MedicalProfileSettings;