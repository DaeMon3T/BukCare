import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import usersAPI from "@/services/admin/Users";

interface User {
  id: number;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  contact_number?: string;
  role: "admin" | "patient" | "doctor" | "pending";
  is_active: boolean;
  is_verified: boolean;
  is_profile_complete: boolean;
  picture?: string;
  created_at: string;
  last_login?: string;

  // NEW ADDRESS FIELDS
  province?: string | null;
  city?: string | null;
  barangay?: string | null;
}

export default function Usersdetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const apiUsers = await usersAPI.getAllUsers();
        const foundUser = apiUsers.find((u: any) => u.id === Number(id));

        if (foundUser) {
          setUser({
            ...foundUser,
            picture: foundUser.picture || "/assets/react.svg",
          });
        }
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar role="admin" />

      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold mb-6 text-gray-800">User Details</h1>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 
                          text-white shadow-md mb-6 flex flex-col items-center space-y-3">

            <img
              src={user.picture}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-white"
            />

            <h2 className="text-xl font-bold">
              {user.fname} {user.mname || ""} {user.lname}
            </h2>

            <p className="text-blue-100">{user.email}</p>

            {user.contact_number && (
              <p className="text-blue-100">{user.contact_number}</p>
            )}

            <div className="flex gap-2 mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                Role: {user.role}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* FORM DETAILS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              <InputField label="First Name" value={user.fname} />
              <InputField label="Middle Name" value={user.mname || "—"} />
              <InputField label="Last Name" value={user.lname} />
              <InputField label="Email" value={user.email} />
              <InputField label="Contact Number" value={user.contact_number || "—"} />

              {/* NEW ADDRESS FIELDS */}
              <InputField label="Province" value={user.province || "—"} />
              <InputField label="City" value={user.city || "—"} />
              <InputField label="Barangay" value={user.barangay || "—"} />

              <InputField label="Verified" value={user.is_verified ? "Yes" : "No"} />
              <InputField
                label="Profile Complete"
                value={user.is_profile_complete ? "Yes" : "No"}
              />
              <InputField
                label="Join Date"
                value={new Date(user.created_at).toLocaleDateString()}
              />
              <InputField
                label="Last Login"
                value={user.last_login ? new Date(user.last_login).toLocaleString() : "—"}
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full border border-gray-300 rounded-lg px-3 py-2 
                   bg-gray-100 text-gray-700"
      />
    </div>
  );
}
