import React, { useState } from "react";
import { 
  Search, 
  Bell, 
  User, 
  Calendar, 
  Settings, 
  LogOut, 
  ChevronDown,
  Clock,
  Users,
  Plus,
  Edit3,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

const DoctorInterface = ({ user = { name: "Doctor", email: "doctor@clinic.com" }, appointments = [], availability = [] }) => {
  const logout = () => console.log("Logout clicked");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const updateAppointmentStatus = (appointmentId, newStatus) => {
    console.log(`Update appointment ${appointmentId} to ${newStatus}`);
  };

  // Availability Modal
  const AvailabilityModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Manage Availability</h2>
          <button onClick={() => setShowAvailabilityModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {availability.length === 0 ? (
            <p className="text-gray-500 text-center">No availability set yet.</p>
          ) : availability.map((day, index) => (
            <div key={day.day} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">{day.day}</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={day.available}
                    onChange={(e) => {
                      const newAvailability = [...availability];
                      newAvailability[index].available = e.target.checked;
                      // implement update logic here
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Available</span>
                </label>
              </div>
              {day.available && (
                <div className="space-y-2">
                  {day.slots.length > 0 ? (
                    day.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{slot}</span>
                        <button className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No time slots set</p>
                  )}
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Time Slot
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-6 border-t border-gray-100 flex space-x-3">
          <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => setShowAvailabilityModal(false)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  // Appointment Details Modal
  const AppointmentDetailsModal = () => (
    selectedAppointment && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Appointment Details</h2>
            <button onClick={() => setShowAppointmentDetails(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-600">Patient</label>
              <p className="font-medium text-gray-800">{selectedAppointment.patientName}</p>
              <p className="text-sm text-gray-600">{selectedAppointment.patientEmail}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Date</label>
                <p className="font-medium text-gray-800">{selectedAppointment.date}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Time</label>
                <p className="font-medium text-gray-800">{selectedAppointment.time}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                <p className="font-medium text-gray-800">{selectedAppointment.type}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Duration</label>
                <p className="font-medium text-gray-800">{selectedAppointment.duration}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Reason</label>
              <p className="font-medium text-gray-800">{selectedAppointment.reason}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                {getStatusIcon(selectedAppointment.status)}
                <span className="capitalize">{selectedAppointment.status}</span>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-100 flex space-x-2">
            {selectedAppointment.status === 'pending' && (
              <>
                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAppointment.id, 'confirmed');
                    setShowAppointmentDetails(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    updateAppointmentStatus(selectedAppointment.id, 'cancelled');
                    setShowAppointmentDetails(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => setShowAppointmentDetails(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-800">BukCare</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4 lg:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patients, appointments..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Bell className="w-6 h-6" />
                  {appointments.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {appointments.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-600">Physician</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </a>
                      <a href="#" className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </a>
                    </div>

                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Good morning, {user.name}!</h1>
              <p className="text-green-100">
                You have {appointments.filter(apt => apt.date === 'Today').length} appointments today. Manage your schedule and availability.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setShowAvailabilityModal(true)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Set Availability</h3>
                  <p className="text-sm text-gray-600">Manage your schedule</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Total Patients</h3>
                  <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Dashboard */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Appointments</h2>
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('today')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Upcoming
                  </button>
                </div>
              </div>
              <div className="p-4 lg:p-6 space-y-4">
                {appointments.filter(apt => activeTab === 'today' ? apt.date === 'Today' : apt.date !== 'Today').length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No {activeTab} appointments</p>
                  </div>
                ) : appointments
                  .filter(apt => activeTab === 'today' ? apt.date === 'Today' : apt.date !== 'Today')
                  .map(appointment => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-800">{appointment.patientName}</h3>
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="capitalize">{appointment.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />{appointment.time} ({appointment.duration})</span>
                          <span>{appointment.type}</span>
                        </div>
                        <p className="text-sm text-gray-600">{appointment.reason}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => { setSelectedAppointment(appointment); setShowAppointmentDetails(true); }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Today's Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Appointments</span>
                    <span className="font-semibold text-gray-800">{appointments.filter(apt => apt.date === 'Today').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confirmed</span>
                    <span className="font-semibold text-green-600">{appointments.filter(apt => apt.date === 'Today' && apt.status === 'confirmed').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-yellow-600">{appointments.filter(apt => apt.date === 'Today' && apt.status === 'pending').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Weekly Schedule</h3>
                {availability.length === 0 ? (
                  <p className="text-gray-500 text-sm">No availability set yet.</p>
                ) : (
                  <div className="space-y-2">
                    {availability.slice(0, 5).map(day => (
                      <div key={day.day} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600">{day.day.slice(0, 3)}</span>
                        {day.available ? (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Available</span>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Unavailable</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAvailabilityModal && <AvailabilityModal />}
      {showAppointmentDetails && <AppointmentDetailsModal />}
    </div>
  );
};

export default DoctorInterface;
