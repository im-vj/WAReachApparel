import React from 'react';
import { X } from 'lucide-react';
import TemplateForm from './TemplateForm';
import LivePreview from './LivePreview';

export default function TemplateModal({
  isOpen,
  editingTemplate,
  formData,
  setFormData,
  isUploading,
  fileInputRef,
  handleFileUpload,
  saveTemplate,
  closeModal
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-surface-dark border border-gray-700/60 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Form Side */}
        <div className="p-6 md:p-8 md:w-[55%] border-b md:border-b-0 md:border-r border-gray-700/60 bg-surface-dark flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">Configure your WhatsApp message settings.</p>
            </div>
            <button onClick={closeModal} className="text-gray-400 hover:text-white md:hidden bg-gray-800 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TemplateForm 
              formData={formData}
              setFormData={setFormData}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              saveTemplate={saveTemplate}
              closeModal={closeModal}
            />
          </div>
        </div>

        {/* Preview Side */}
        <div className="p-6 md:p-8 md:w-[45%] bg-gray-900/50 flex flex-col relative overflow-hidden">
          <div className="absolute top-6 right-6 hidden md:block z-20">
            <button 
              onClick={closeModal} 
              className="text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 p-2 rounded-full backdrop-blur-sm transition-all hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Preview</h4>
            <p className="text-xs text-gray-500 mt-1">See how it looks on WhatsApp</p>
          </div>
          
          <LivePreview formData={formData} />
        </div>

      </div>
    </div>
  );
}
