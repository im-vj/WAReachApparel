import React from 'react';

export default function LivePreview({ formData }) {
  const renderPreview = (content) => {
    if (!content) return '';
    return content.replace(/\{name\}/g, 'Abdul');
  };

  return (
    <div className="flex-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover rounded-xl p-5 flex flex-col border border-gray-700/50 space-y-3 shadow-inner relative overflow-hidden">
      {/* Subtle overlay to make text pop slightly more against the bright background */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>

      {formData.headerDocumentUrl && (
        <div className="bg-white text-gray-800 rounded-xl rounded-tl-none p-3 shadow-sm max-w-[85%] self-start text-sm flex items-center gap-3 relative z-10 transform transition-all duration-300 translate-y-0 opacity-100 animate-in slide-in-from-bottom-2">
          <div className="bg-red-50 text-red-500 p-2.5 rounded-lg flex-shrink-0 border border-red-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-gray-900 truncate leading-tight mb-0.5">{formData.headerDocumentFilename || 'Document.pdf'}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              {formData.headerDocumentUrl.startsWith('http') 
                ? (formData.headerDocumentUrl.length > 25 ? '...' + formData.headerDocumentUrl.slice(-20) : 'Link Attached') 
                : 'Secure S3 Upload'}
              {' • PDF'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white text-gray-800 rounded-xl rounded-tl-none p-4 shadow-sm max-w-[85%] self-start text-[14.5px] leading-snug whitespace-pre-wrap relative z-10 animate-in slide-in-from-bottom-2">
        {formData.content ? (
          <span className="text-gray-900">{renderPreview(formData.content)}</span>
        ) : (
          <span className="text-gray-400 italic">Your message preview will appear here...</span>
        )}
        
        {/* Fake timestamp in bubble */}
        <div className="text-[10px] text-gray-400 text-right mt-1.5 -mb-1">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
