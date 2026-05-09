import React, { useState } from "react";
import { X } from "lucide-react";
import { createAdmin } from "@/services/admin/AdminAPI";

interface AddAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddAdminModal: React.FC<AddAdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // MUST prevent default to stop page reload
    setError("");
    setLoading(true);

    if (!name || !email || !contactNumber || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      await createAdmin({ name, email, contactNumber, password });
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
      setName("");
      setEmail("");
      setContactNumber("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        onClick={(e) => e.stopPropagation()} // IMPORTANT: prevent overlay click from propagating
      >
        <div className="bg-white rounded-2xl w-[400px] max-w-[90vw] p-6 relative shadow-xl">
          
          {/* Close Button */}
          <button
            type="button" // MUST be type="button" to prevent form submit
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-slate-800 mb-4">Add Admin</h2>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Contact Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded text-white ${
                loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Adding..." : "Add Admin"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddAdminModal;
