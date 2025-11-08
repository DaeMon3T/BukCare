import { useEffect, useState, ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
} from "@/services/users/UsersAPI";

interface UserProfile {
  fname: string;
  mname?: string;
  lname: string;
  sex?: boolean | null; // backend sends boolean
  dob?: string;
  contact_number?: string;
  email: string;
  picture?: string;
}

export default function Profile() {
  const { user: authUser } = useAuth();

  const [formData, setFormData] = useState<UserProfile>({
    fname: "",
    mname: "",
    lname: "",
    sex: null,
    dob: "",
    contact_number: "",
    email: "",
    picture: "",
  });

  const [picture, setPicture] = useState<string>("/assets/react.svg");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPic, setUploadingPic] = useState<boolean>(false);

  // --------------------------------------------
  // Fetch Profile
  // --------------------------------------------
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

  // --------------------------------------------
  // Handlers
  // --------------------------------------------
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Convert sex value to boolean when saving
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
      await updateUserProfile(formData);
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
    setSelectedFile(file);
    setPicture(URL.createObjectURL(file)); // preview
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) return;
    setUploadingPic(true);
    try {
      const updatedPicUrl: string = await updateProfilePicture(selectedFile);
      setPicture(updatedPicUrl);
      setSelectedFile(null);
      alert("Profile picture updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile picture.");
    } finally {
      setUploadingPic(false);
    }
  };

  // --------------------------------------------
  // UI Rendering
  // --------------------------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <p className="text-gray-500 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar role="patient" />

      <main className="flex-grow overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-8 flex flex-col items-center space-y-4 transition-transform duration-300 hover:scale-[1.01]">
            <img
              src={picture}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
            />

            <p className="text-blue-100 text-sm">{formData.email}</p>
            <h2 className="text-xl font-bold">
              {formData.fname} {formData.mname || ""} {formData.lname}
            </h2>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <label className="bg-white text-blue-600 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-100 transition">
                Change Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleUploadPicture}
                  disabled={uploadingPic}
                  className="bg-blue-500 px-4 py-2 rounded-full hover:bg-blue-600 transition text-white disabled:opacity-60"
                >
                  {uploadingPic ? "Uploading..." : "Upload"}
                </button>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="fname"
                  value={formData.fname}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="mname"
                  value={formData.mname || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lname"
                  value={formData.lname}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex
                </label>
                <select
                  name="sex"
                  value={
                    formData.sex === true
                      ? "true"
                      : formData.sex === false
                      ? "false"
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                >
                  
                  <option value="true">Male</option>
                  <option value="false">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
