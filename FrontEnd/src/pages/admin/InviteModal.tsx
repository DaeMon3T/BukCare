import React, { useState, FormEvent } from "react";
import { Mail, XCircle, AlertCircle } from "lucide-react";
import { validateEmail } from "@/utils/validation";
import adminAPI from "@/services/admin/AdminAPI";

interface InviteModalProps {
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  onInvitationSent?: (result: {
    type: "success" | "error" | "warning";
    message: string;
    data?: any;
  }) => void;
}

interface FormErrors {
  email?: string;
  role?: string;
}

const InviteModal: React.FC<InviteModalProps> = ({
  showInviteModal,
  setShowInviteModal,
  onInvitationSent,
}) => {
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email address is required";
    else if (!validateEmail(email))
      newErrors.email = "Please enter a valid email address";

    if (!role) newErrors.role = "Please select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await adminAPI.inviteUser({ email, role });

      setEmail("");
      setRole("");
      setErrors({});
      setShowInviteModal(false);

      if (onInvitationSent) {
        if (result.warning) {
          onInvitationSent({
            type: "warning",
            message: `Invitation created for ${email}, but email notification failed to send. Please contact the user manually.`,
            data: result,
          });
        } else {
          onInvitationSent({
            type: "success",
            message: `Invitation sent successfully to ${email}`,
            data: result,
          });
        }
      }
    } catch (err: any) {
      console.error("Invitation failed:", err);
      if (err.message?.includes("already exists")) {
        setErrors({ email: "A user with this email already exists" });
      } else if (err.message?.includes("pending invitation")) {
        setErrors({
          email: "A pending invitation already exists for this email",
        });
      } else if (onInvitationSent) {
        onInvitationSent({
          type: "error",
          message: err.message || "Failed to send invitation. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setRole("");
    setErrors({});
    setShowInviteModal(false);
  };

  if (!showInviteModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="relative bg-white border border-gray-300 rounded-2xl max-w-md w-full mx-4 shadow-xl pointer-events-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Invite New User</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                  errors.role
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              >
                <option value="">Select a role</option>
                <option value="doctor">Doctor</option>
                <option value="staff">Staff</option>
              </select>
              {errors.role && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.role}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg flex items-start space-x-2">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  How it works
                </h4>
                <p className="text-sm text-blue-600 mt-1">
                  An invitation email will be sent to the recipient. They can
                  click the link to complete their account setup.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
