import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose: () => void;
  duration?: number;
  title?: string;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  duration = 5000,
  title,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const styles = {
    success: {
      bg: "bg-green-50 border-green-200",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: "text-green-800",
      close: "text-green-600 hover:text-green-900",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      text: "text-red-800",
      close: "text-red-600 hover:text-red-900",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      text: "text-yellow-800",
      close: "text-yellow-600 hover:text-yellow-900",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
      text: "text-blue-800",
      close: "text-blue-600 hover:text-blue-900",
    },
  }[type || "info"];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full" role="alert" aria-live="assertive">
      <div
        className={`${styles.bg} border rounded-lg p-4 shadow-lg transition-all duration-300 transform animate-slideIn`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">{styles.icon}</div>
          <div className="flex-1 min-w-0">
            {title && <p className={`font-semibold ${styles.text}`}>{title}</p>}
            <p className={`text-sm ${styles.text}`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${styles.close} transition-colors`}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
