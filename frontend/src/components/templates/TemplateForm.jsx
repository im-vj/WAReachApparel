import React from 'react';
import { Upload } from 'lucide-react';

export default function TemplateForm({ 
  formData, 
  setFormData, 
  isUploading, 
  fileInputRef, 
  handleFileUpload, 
  saveTemplate, 
  closeModal 
}) {
  return (
    <form onSubmit={saveTemplate} className="space-y-5 p-1 h-full flex flex-col">
      <div className="space-y-4 flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
        {/* Display Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">Display Name</label>
          <input
            type="text"
            required
            className="input-field bg-gray-800/50 focus:bg-gray-800 transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="e.g. Cold Outreach V1"
          />
        </div>

        {/* Meta Template Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Meta Template Name <span className="text-gray-500 font-normal ml-1">(Optional)</span>
          </label>
          <input
            type="text"
            className="input-field bg-gray-800/50 focus:bg-gray-800 transition-colors"
            value={formData.metaTemplateName}
            onChange={(e) => setFormData({...formData, metaTemplateName: e.target.value})}
            placeholder="e.g. cordestitch_outreach"
          />
          <p className="text-[11px] text-gray-500 mt-1">Required for cold outreach. Must match Meta dashboard exactly.</p>
        </div>

        {/* Header Document URL / Upload */}
        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            PDF Attachment <span className="text-gray-500 font-normal ml-1">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              className="input-field flex-1 bg-gray-800/80 text-sm"
              value={formData.headerDocumentUrl}
              onChange={(e) => setFormData({...formData, headerDocumentUrl: e.target.value})}
              placeholder="https://example.com/file.pdf"
            />
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-primary/10 hover:bg-primary/20 text-primary px-4 rounded-lg flex items-center justify-center transition-all border border-primary/20 disabled:opacity-50 whitespace-nowrap text-sm font-medium shadow-sm hover:shadow-primary/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
          
          <div className="mt-3">
            <input
              type="text"
              className="input-field bg-gray-800/80 text-sm"
              value={formData.headerDocumentFilename}
              onChange={(e) => setFormData({...formData, headerDocumentFilename: e.target.value})}
              placeholder="Display Filename (e.g. Brochure.pdf)"
            />
          </div>
        </div>

        {/* Message Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Message Content
          </label>
          <textarea
            required
            rows="7"
            className="input-field resize-none bg-gray-800/50 focus:bg-gray-800 transition-colors leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
            placeholder="Hi {name}, ..."
          ></textarea>
          <p className="text-[11px] text-gray-500 mt-1">Use <code className="bg-gray-800 px-1 py-0.5 rounded text-primary">{'{name}'}</code> to personalize with the contact's name.</p>
        </div>
      </div>

      <div className="pt-5 mt-auto border-t border-gray-700/50 flex justify-end gap-3">
        <button type="button" onClick={closeModal} className="btn-secondary px-6">Cancel</button>
        <button type="submit" className="btn-primary px-8 shadow-lg hover:shadow-primary/20 transition-all">
          Save Template
        </button>
      </div>
    </form>
  );
}
