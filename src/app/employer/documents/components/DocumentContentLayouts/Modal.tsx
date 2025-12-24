"use client";

import React from "react";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-xl dark:border dark:border-purple-500/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

