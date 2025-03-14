import React from "react";
import { XCircleIcon } from "@heroicons/react/24/solid"; // Heroicons for a polished UI

const ErrorAlert = ({ message, onClose }) => {
  if (!message) return null; // Don't render if there's no error

  return (
    <div className="flex items-center p-4 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-lg shadow-md">
      <XCircleIcon className="w-6 h-6 mr-3 text-red-600" />
      <span className="flex-1 font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-sm font-semibold text-red-700 hover:underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
