// src/pages/patient/Profile.tsx
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
  mname: string;
  lname: string;
  dob: string;
  contact_number: string;
  email: string;
  picture?: string;
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const userId = authUser?.user_id;

  const [formData, setFormData] = useState<UserProfile>({
    fname: "",
    mname: "",
    lname: "",
    dob: "",
    contact_number: "",
    email: "",
  });

  const [picture, setPicture] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPic, setUploadingPic] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const user = await getUserProfile(userId);
        setFormData({
          fname: user.fname || "",
          mname: user.mname || "",
          lname: user.lname || "",
          dob: user.dob ? user.dob.split("T")[0] : "",
          contact_number: user.contact_number || "",
          email: user.email || "",
        });
        setPicture(user.picture || "/assets/react.svg");
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await updateUserProfile(userId, formData);
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
    setPicture(URL.createObjectURL(file)); // Instant preview
  };

  const handleUploadPicture = async () => {
    if (!userId || !selectedFile) return;
    setUploadingPic(true);
    try {
      const updatedPicUrl = await updateProfilePicture(userId, selectedFile);
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar role="patient" />

      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Picture & Info */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-md mb-6 flex flex-col items-center space-y-3">
            <div className="relative">
              <img
                src={picture}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-white"
              />
            </div>

            {/* Change Picture Button */}
            <div className="flex space-x-2">
              <label className="bg-white text-blue-600 px-4 py-1 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                Change Profile Picture
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
                  className="bg-blue-500 px-4 py-1 rounded-lg hover:bg-blue-600 transition text-white"
                >
                  {uploadingPic ? "Uploading..." : "Upload"}
                </button>
              )}
            </div>

            <h2 className="text-xl font-bold">
              {formData.fname} {formData.mname} {formData.lname}
            </h2>
            <p className="text-blue-100">{formData.email}</p>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                name="fname"
                value={formData.fname}
                onChange={handleChange}
              />
              <InputField
                label="Middle Name"
                name="mname"
                value={formData.mname}
                onChange={handleChange}
              />
              <InputField
                label="Last Name"
                name="lname"
                value={formData.lname}
                onChange={handleChange}
              />
              <InputField
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
              />
              <InputField
                label="Contact Number"
                name="contact_number"
                type="tel"
                value={formData.contact_number}
                onChange={handleChange}
              />

              <div className="sm:col-span-2 flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
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

// ✅ Reusable InputField component
interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function InputField({ label, name, value, type = "text", onChange }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      />
    </div>
  );
}
