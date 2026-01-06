import { useEffect, useState, type ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
} from "@/services/users/UsersAPI";
import { BookUser, Mail, Phone } from "lucide-react";

interface UserProfile {
  fname: string;
  mname?: string;
  lname: string;
  sex?: boolean | null;
  dob?: string;
  contact_number?: string;
  email: string;
  picture?: string;
  address?: {
    province?: string;
    city?: string;
    barangay?: string;
  };
}

// Edit Profile Modal Component
const EditProfileModal = ({
  isOpen,
  onClose,
  formData,
  handleChange,
  handleSave,
  saving
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: UserProfile;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSave: () => Promise<void>;
  saving: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from- to-blue-50 border-b p-8 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
              <p className="text-gray-600 mt-1">Update your personal information</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-3xl hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                    👤
                  </span>
                  Personal Information
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">First Name</div>
                    <input
                      type="text"
                      name="fname"
                      value={formData.fname}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Middle Name</div>
                    <input
                      type="text"
                      name="mname"
                      value={formData.mname || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter middle name"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Last Name</div>
                    <input
                      type="text"
                      name="lname"
                      value={formData.lname}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Gender</div>
                    <select
                      name="sex"
                      value={formData.sex === true ? "true" : formData.sex === false ? "false" : ""}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                    >
                      <option value="">Select gender</option>
                      <option value="true">Male</option>
                      <option value="false">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">
                    📅
                  </span>
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">
                    📞
                  </span>
                  Contact Information
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Email Address</div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Phone Number</div>
                    <input
                      type="text"
                      name="contact_number"
                      value={formData.contact_number || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
                    🏠
                  </span>
                  Address Details
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Barangay</div>
                    <input
                      type="text"
                      name="barangay"
                      value={formData.address?.barangay || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter barangay"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">City</div>
                    <input
                      type="text"
                      name="city"
                      value={formData.address?.city || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1.5">Province</div>
                    <input
                      type="text"
                      name="province"
                      value={formData.address?.province || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50 transition"
                      placeholder="Enter province"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 border-t p-8 rounded-b-3xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Your profile information is secure and private
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl hover:from-blue-700 hover:to-emerald-700 font-medium transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { setUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState<UserProfile>({
    fname: "",
    mname: "",
    lname: "",
    sex: null,
    dob: "",
    contact_number: "",
    email: "",
    picture: "",
    address: {
      province: "",
      city: "",
      barangay: "",
    },
  });

  const [picture, setPicture] = useState<string>("/assets/react.svg");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPic, setUploadingPic] = useState<boolean>(false);

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await getUserProfile();
        setFormData(user);
        setPicture(user.picture || "/assets/react.svg");
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handlers
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (["province", "city", "barangay"].includes(name)) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
      return;
    }

    if (name === "sex") {
      setFormData((prev) => ({
        ...prev,
        sex: value === "true" ? true : value === "false" ? false : null,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);

    setSelectedFile(file);
    setPicture(previewURL);
    setUser(prev => ({ ...prev!, picture: previewURL }));
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) return;
    setUploadingPic(true);
    try {
      const updatedUser = await updateProfilePicture(selectedFile);

      const newPicture = updatedUser.picture
        ? `${updatedUser.picture}?t=${Date.now()}`
        : "/assets/react.svg";

      setPicture(newPicture);
      setFormData(prev => ({ ...prev, picture: newPicture }));
      setUser(prev => ({ ...prev!, picture: newPicture }));
      setSelectedFile(null);
      alert("Profile picture updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture.");
    } finally {
      setUploadingPic(false);
    }
  };

  // Helper functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = () => {
    return `${formData.fname.charAt(0)}${formData.lname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
            </div>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Loading your profile</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-purple-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-500 rounded-3xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Doctor Profile</h1>
              <p className="text-blue-100 mt-2">Manage your personal and professional information</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Medical ID: DR{formData.fname.charAt(0)}-{Date.now().toString().slice(-4)}</div>
              <div className="text-blue-100 text-sm mt-1">Last updated: Today</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="relative h-32 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-500"></div>
              
              <div className="px-6 pb-6 relative -top-12">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-40 h-40 mx-auto rounded-full border-8 border-white shadow-xl overflow-hidden">
                    <img
                      src={picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${getInitials()}&background=4f46e5&color=ffffff&size=256`;
                      }}
                    />
                  </div>
                  
                  {/* Camera Button */}
                  <label className="absolute bottom-4 right-1/4 bg-white text-blue-600 p-3 rounded-full shadow-lg hover:bg-blue-50 cursor-pointer transition-all hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>

                {/* Profile Info */}
                <div className="text-center mt-8">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Dr. {formData.fname} {formData.lname}
                  </h2>
                  <p className="text-gray-600 mt-1">{formData.email}</p>
                  
                  <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    Active Status
                  </div>
                </div>

                {/* Upload Button */}
                {selectedFile && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleUploadPicture}
                      disabled={uploadingPic}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-emerald-700 font-medium transition shadow-lg hover:shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {uploadingPic ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                      Upload New Photo
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Edit Profile Button */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full mt-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 font-medium transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Profile Information
                </button>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
                <div className="p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-xl font-bold text-blue-600">
                    {calculateAge(formData.dob) || '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Age</div>
                </div>
                <div className="p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-xl font-bold text-blue-600">
                    {formData.sex === true ? 'M' : formData.sex === false ? 'F' : '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Gender</div>
                </div>
                <div className="p-4 text-center hover:bg-gray-50 transition">
                  <div className="text-xl font-bold text-emerald-600">
                    {formData.contact_number ? '✓' : '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Contact</div>
                </div>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <BookUser />
                </span>
                Contact Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Mail />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-gray-800">{formData.email}</div>
                  </div>
                </div>
                
                {formData.contact_number && (
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <Phone />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium text-gray-800">{formData.contact_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  COMPLETE PROFILE
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="text-sm text-gray-500 mb-2">Full Name</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formData.fname} {formData.mname && `${formData.mname} `}{formData.lname}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="text-sm text-gray-500 mb-2">Gender</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formData.sex === true ? 'Male' : formData.sex === false ? 'Female' : 'Not specified'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="text-sm text-gray-500 mb-2">Date of Birth</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatDate(formData.dob)}
                    </div>
                    {formData.dob && (
                      <div className="text-sm text-blue-600 mt-2">
                        Age: {calculateAge(formData.dob)} years
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Column 2 */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="text-sm text-gray-500 mb-2">Email Address</div>
                    <div className="text-lg font-semibold text-gray-800">{formData.email}</div>
                    <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      Verified
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="text-sm text-gray-500 mb-2">Phone Number</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formData.contact_number || 'Not specified'}
                    </div>
                    {!formData.contact_number && (
                      <div className="text-xs text-orange-600 mt-2">
                        Add phone number for emergency contact
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="text-sm text-gray-500 mb-2">Profile Completion</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profile Details</span>
                        <span className="font-semibold">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-500 h-2 rounded-full w-4/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Address Information</h3>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                  PHILIPPINES
                </span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5">
                  <div className="text-sm text-blue-600 mb-2">Barangay</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {formData.address?.barangay || 'Not specified'}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5">
                  <div className="text-sm text-blue-600 mb-2">City</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {formData.address?.city || 'Not specified'}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5">
                  <div className="text-sm text-blue-600 mb-2">Province</div>
                  <div className="text-lg font-semibold text-gray-800">
                    {formData.address?.province || 'Not specified'}
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                <div className="text-sm text-gray-500 mb-3">Complete Address</div>
                <div className="text-lg font-semibold text-gray-800">
                  {[formData.address?.barangay, formData.address?.city, formData.address?.province]
                    .filter(Boolean)
                    .join(', ') || 'No address information provided'}
                </div>
              </div>
            </div>

            {/* Save Button Section */}
            <div className="bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-purple-600/10 rounded-3xl border border-gray-200 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">Ready to update your profile?</h4>
                  <p className="text-gray-600 text-sm mt-1">Click save to apply all changes</p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-emerald-700 font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save All Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={formData}
        handleChange={handleChange}
        handleSave={handleSave}
        saving={saving}
      />
    </div>
  );
}