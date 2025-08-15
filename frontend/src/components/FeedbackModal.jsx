import React, { Fragment, useState } from "react";
import ReactDOM from "react-dom";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import axios from "axios";
import NotificationPopup from "./ui/NotificationPopup";

const FeedbackModal = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      // Include the Authorization header with the token in the request
      const token = localStorage.getItem("token");

      await axios.post(
        `${process.env.REACT_APP_API_URL}/feedback`,
        { feedback },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        }
      );
      setNotification({
        message: "Thank you for your feedback!",
        type: "success",
      });
      setFeedback("");
      onClose();
    } catch (error) {
      console.error(
        "Error submitting feedback:",
        error.response || error.message
      );
      setNotification({
        message: "Failed to submit feedback. Please try again later.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {notification && (
        <NotificationPopup
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md"
            aria-hidden="true"
          ></div>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="transition ease-out duration-300 transform"
              enterFrom="opacity-0 scale-90"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-200 transform"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-90"
            >
              <Dialog.Panel className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl max-w-md w-full p-6 rounded-2xl text-center">
                <Dialog.Title className="text-xl font-semibold text-white">
                  Submit Feedback
                </Dialog.Title>
                <Dialog.Description className="mt-3 text-md text-gray-200 leading-relaxed">
                  We value your feedback. Please share your thoughts below.
                </Dialog.Description>
                <div className="mt-4">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-[#2a2435] border-purple-600/20 text-white"
                  />
                </div>
                <div className="mt-6 space-y-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !feedback.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                  <Button
                    onClick={onClose}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg shadow-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default FeedbackModal;
