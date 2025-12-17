import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-[#FFFFFF] w-full max-w-sm shadow-2xl rounded-[14px] flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
          <button onClick={onClose} className="text-iosBlue text-[17px] font-normal">Cancel</button>
          <h3 className="text-[17px] font-semibold text-black absolute left-1/2 -translate-x-1/2">{title}</h3>
          <div className="w-10"></div> {/* Spacer */}
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};