import React from "react";

const Panel = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed top-0 right-0 h-full w-[480px] z-50 bg-zinc-300 border-l border-zinc-500 shadow-xl p-6 flex flex-col font-mono" style={{ minWidth: 320 }}>
    <div className="flex justify-between items-center mb-4">
      <span className="text-2xl font-bold">{title}</span>
      <button
        className="text-gray-600 hover:text-white text-2xl font-bold"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
    </div>
    <div className="flex-1 flex flex-col overflow-auto">
      {children}
    </div>
  </div>
);

export default Panel; 