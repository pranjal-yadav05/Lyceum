import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "./ui/button";

const UnderDevelopmentModal = ({
  isOpen,
  onClose,
  title = "Feature Under Development",
  message = "This feature is currently under development. Please check back later for updates.",
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md"
          aria-hidden="true"
        />

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
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-3 text-md text-gray-200 leading-relaxed">
                {message}
              </Dialog.Description>
              <div className="mt-6">
                <Button
                  onClick={onClose}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg"
                >
                  Okay, Got it!
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UnderDevelopmentModal;
