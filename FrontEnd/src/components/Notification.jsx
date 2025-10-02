// components/Notification.jsx
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const Notification = ({ type, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: 'text-green-800'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          text: 'text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          text: 'text-yellow-800'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
          text: 'text-blue-800'
        };
    }
  };

  const { bg, icon, text } = getNotificationStyle();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div className={`${bg} border rounded-lg p-4 shadow-lg`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${text}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${text.replace('text-', 'text-').replace('-800', '-600')} hover:${text.replace('text-', 'text-').replace('-800', '-900')} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;