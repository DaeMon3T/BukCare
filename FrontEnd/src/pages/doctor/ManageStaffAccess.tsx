import { useState, useEffect } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Eye,
  Settings,
  CalendarPlus,
  UserPlus,
  Trash2,
  ChevronLeft,
  Check,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StaffAccessAPI from "@/services/staff/StaffAccessAPI";
import type {
  StaffAccessRecord,
  AvailableStaff,
} from "@/services/staff/StaffAccessAPI";

// Permission presets
const PRESETS = {
  observer: {
    label: "Observer",
    icon: Eye,
    description: "View appointments only",
    can_view_appointments: true,
    can_manage_appointments: false,
    can_book_walkins: false,
    can_register_patients: false,
  },
  receptionist: {
    label: "Receptionist",
    icon: CalendarPlus,
    description: "View appointments, book walk-ins, register patients",
    can_view_appointments: true,
    can_manage_appointments: false,
    can_book_walkins: true,
    can_register_patients: true,
  },
  full_access: {
    label: "Full Access",
    icon: ShieldCheck,
    description: "All permissions enabled",
    can_view_appointments: true,
    can_manage_appointments: true,
    can_book_walkins: true,
    can_register_patients: true,
  },
};

const ManageStaffAccess: FC = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<StaffAccessRecord[]>([]);
  const [availableStaff, setAvailableStaff] = useState<AvailableStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [addingStaffId, setAddingStaffId] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("observer");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      setLoading(true);
      const data = await StaffAccessAPI.getMyStaff();
      setStaffList(data);
    } catch (error: any) {
      console.error("Failed to load staff list:", error);
      toast.error("Failed to load staff access list");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const data = await StaffAccessAPI.getAvailableStaff();
      setAvailableStaff(data);
    } catch (error: any) {
      console.error("Failed to load available staff:", error);
      toast.error("Failed to load available staff");
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    await fetchAvailableStaff();
  };

  const handleGrantAccess = async (staffUserId: number) => {
    try {
      setAddingStaffId(staffUserId);
      const preset = PRESETS[selectedPreset as keyof typeof PRESETS];
      await StaffAccessAPI.grantAccess({
        staff_user_id: staffUserId,
        can_view_appointments: preset.can_view_appointments,
        can_manage_appointments: preset.can_manage_appointments,
        can_book_walkins: preset.can_book_walkins,
        can_register_patients: preset.can_register_patients,
      });
      toast.success("Staff access granted!");
      setShowAddModal(false);
      fetchStaffList();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to grant access";
      toast.error(msg);
    } finally {
      setAddingStaffId(null);
    }
  };

  const handleTogglePermission = async (
    access: StaffAccessRecord,
    field: string,
    value: boolean
  ) => {
    try {
      setUpdatingId(access.id);
      await StaffAccessAPI.updateAccess(access.id, { [field]: value });
      setStaffList((prev) =>
        prev.map((s) => (s.id === access.id ? { ...s, [field]: value } : s))
      );
      toast.success("Permission updated");
    } catch (error: any) {
      toast.error("Failed to update permission");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRevoke = async (accessId: number) => {
    if (!confirm("Are you sure you want to revoke this staff member's access?"))
      return;
    try {
      setRevokingId(accessId);
      await StaffAccessAPI.revokeAccess(accessId);
      setStaffList((prev) => prev.filter((s) => s.id !== accessId));
      toast.success("Staff access revoked");
    } catch (error: any) {
      toast.error("Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  };

  const getActivePreset = (access: StaffAccessRecord): string => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      if (
        access.can_view_appointments === preset.can_view_appointments &&
        access.can_manage_appointments === preset.can_manage_appointments &&
        access.can_book_walkins === preset.can_book_walkins &&
        access.can_register_patients === preset.can_register_patients
      ) {
        return key;
      }
    }
    return "custom";
  };

  const filteredAvailableStaff = availableStaff.filter(
    (s) =>
      !s.already_granted &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const permissions = [
    {
      key: "can_view_appointments",
      label: "View Appointments",
      icon: Eye,
      color: "text-blue-600 bg-blue-50",
    },
    {
      key: "can_manage_appointments",
      label: "Manage Appointments",
      icon: Settings,
      color: "text-purple-600 bg-purple-50",
    },
    {
      key: "can_book_walkins",
      label: "Book Walk-Ins",
      icon: CalendarPlus,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      key: "can_register_patients",
      label: "Register Patients",
      icon: UserPlus,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-slate-600 mt-4">Loading staff access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/doctor/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                Manage Staff Access
              </h1>
              <p className="text-slate-500 mt-1">
                Control which staff members can view and manage your records
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff
            </button>
          </div>
        </div>

        {/* Staff List */}
        {staffList.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              No staff access granted
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              You haven't granted any staff member access to your records yet.
              Add a staff member to get started.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add Your First Staff Member
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {staffList.map((access) => {
              const preset = getActivePreset(access);
              return (
                <div
                  key={access.id}
                  className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all"
                >
                  {/* Staff info + preset badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      {access.staff_picture ? (
                        <img
                          src={access.staff_picture}
                          alt={access.staff_name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {access.staff_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {access.staff_name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {access.staff_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                          preset === "full_access"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : preset === "receptionist"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : preset === "observer"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {preset === "full_access"
                          ? "Full Access"
                          : preset.charAt(0).toUpperCase() + preset.slice(1)}
                      </span>

                      <button
                        onClick={() => handleRevoke(access.id)}
                        disabled={revokingId === access.id}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Revoke access"
                      >
                        {revokingId === access.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Permission toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {permissions.map((perm) => {
                      const isEnabled =
                        access[perm.key as keyof StaffAccessRecord] as boolean;
                      const Icon = perm.icon;
                      return (
                        <button
                          key={perm.key}
                          onClick={() =>
                            handleTogglePermission(
                              access,
                              perm.key,
                              !isEnabled
                            )
                          }
                          disabled={updatingId === access.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isEnabled
                              ? "border-blue-200 bg-blue-50/50"
                              : "border-slate-100 bg-slate-50/30 opacity-60"
                          } hover:shadow-md`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isEnabled ? perm.color : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-bold truncate ${
                                isEnabled ? "text-slate-800" : "text-slate-400"
                              }`}
                            >
                              {perm.label}
                            </p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isEnabled
                                ? "bg-blue-500 text-white"
                                : "bg-slate-200"
                            }`}
                          >
                            {isEnabled && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-5 flex items-center justify-between flex-none">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Grant Staff Access
                </h2>
                <p className="text-blue-100 text-sm">
                  Select a staff member and permission level
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preset selector */}
            <div className="p-4 border-b border-slate-100 flex-none">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Permission Preset
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPreset(key)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedPreset === key
                          ? "border-blue-400 bg-blue-50 shadow-md"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mx-auto mb-1 ${
                          selectedPreset === key
                            ? "text-blue-600"
                            : "text-slate-400"
                        }`}
                      />
                      <p
                        className={`text-xs font-bold ${
                          selectedPreset === key
                            ? "text-blue-700"
                            : "text-slate-500"
                        }`}
                      >
                        {preset.label}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                {PRESETS[selectedPreset as keyof typeof PRESETS]?.description}
              </p>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 flex-none">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Staff list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredAvailableStaff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    No available staff found
                  </p>
                </div>
              ) : (
                filteredAvailableStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {staff.picture ? (
                        <img
                          src={staff.picture}
                          alt={staff.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {staff.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {staff.name}
                        </p>
                        <p className="text-xs text-slate-400">{staff.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGrantAccess(staff.id)}
                      disabled={addingStaffId === staff.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {addingStaffId === staff.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      Grant
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaffAccess;
