import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import {
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

const NotificationPopup = ({ type = "info", message, onClose }) => {
  // Define maps
  const iconMap = {
    success: <CheckCircleIcon className="w-6 h-6 mr-3 text-green-500" />,
    error: <XMarkIcon className="w-6 h-6 mr-3 text-red-500" />,
    info: <InformationCircleIcon className="w-6 h-6 mr-3 text-blue-500" />,
  };

  const bgColorMap = {
    success: "bg-green-500/10 border-green-500/20",
    error: "bg-red-500/10 border-red-500/20",
    info: "bg-blue-500/10 border-blue-500/20",
  };

  // Unconditionally call useEffect to avoid hook errors
  useEffect(() => {
    if (!message) return;

    const cleanedMessage = message.trim().replace(/\s+/g, " ");
    const wordCount = cleanedMessage ? cleanedMessage.split(" ").length : 0;

    const additionalTime = Math.ceil(wordCount / 120) * 1000;
    const computedTime = 5000 + additionalTime;
    const readTime = Math.min(10000, computedTime);

    const timer = setTimeout(() => {
      onClose?.(); // Optional chaining for safety
    }, readTime);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const popupContent = (
    <div
      className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[1050] max-w-2xl w-[90%] backdrop-blur-md border shadow-xl p-6 rounded-2xl flex items-center ${bgColorMap[type]}`}
    >
      {iconMap[type]}
      <span className="flex-1 font-medium text-white break-words">
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-gray-300 hover:text-white focus:outline-none"
          aria-label="Close notification"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  return ReactDOM.createPortal(popupContent, document.body);
};

export default NotificationPopup;
