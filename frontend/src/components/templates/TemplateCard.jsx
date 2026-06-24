import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function TemplateCard({ template, onEdit, onDelete }) {
  return (
    <div className="bg-surface-dark border border-gray-800 rounded-xl flex flex-col overflow-hidden hover:border-gray-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-semibold text-lg text-gray-100 group-hover:text-primary transition-colors">{template.name}</h4>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onEdit(template)} 
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title="Edit Template"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(template.id)} 
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
              title="Delete Template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {template.metaTemplateName && (
            <span className="text-xs font-medium bg-gray-800/80 px-2.5 py-1 rounded-md text-gray-300 border border-gray-700/50">
              {template.metaTemplateName}
            </span>
          )}
          {template.headerDocumentUrl && (
            <span className="text-xs font-medium bg-blue-900/30 px-2.5 py-1 rounded-md flex items-center text-blue-300 border border-blue-800/30">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF Attached
            </span>
          )}
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 text-sm text-gray-400 flex-1 whitespace-pre-wrap overflow-hidden border border-gray-800/50 line-clamp-6">
          {template.content}
        </div>
      </div>
    </div>
  );
}
