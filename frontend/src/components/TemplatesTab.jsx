import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ConfirmModal from './ConfirmModal';

export default function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', content: '', metaTemplateName: '', headerDocumentUrl: '', headerDocumentFilename: '' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ 
        name: template.name, 
        content: template.content, 
        metaTemplateName: template.metaTemplateName || '',
        headerDocumentUrl: template.headerDocumentUrl || '',
        headerDocumentFilename: template.headerDocumentFilename || ''
      });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', content: '', metaTemplateName: '', headerDocumentUrl: '', headerDocumentFilename: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setIsUploading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      setIsUploading(true);
      const res = await api.post('/upload', formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Since it's hosted behind a proxy or specific domain, we use the URL returned by the backend, 
      // but ensure it's absolute. The backend should return the absolute URL.
      let uploadedUrl = res.data.url;
      // Force https and correct domain just in case the proxy headers weren't perfect locally
      if (window.location.hostname === 'wareach.cordestitch.com') {
         uploadedUrl = `https://wareach.cordestitch.com/api/uploads/${res.data.storedFilename}`;
      } else if (uploadedUrl.startsWith('http://localhost') && window.location.hostname !== 'localhost') {
         // Fallback if the backend thought it was localhost but we are on a different host
         uploadedUrl = `${window.location.protocol}//${window.location.host}/api/uploads/${res.data.storedFilename}`;
      }

      setFormData(prev => ({
        ...prev,
        headerDocumentUrl: uploadedUrl,
        headerDocumentFilename: res.data.filename
      }));
      toast.success('PDF uploaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload PDF');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    const savePromise = editingTemplate 
      ? api.put(`/templates/${editingTemplate.id}`, formData)
      : api.post('/templates', formData);

    toast.promise(savePromise, {
      loading: 'Saving template...',
      success: 'Template saved successfully!',
      error: 'Failed to save template'
    });

    try {
      await savePromise;
      fetchTemplates();
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = (id) => {
    setTemplateToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!templateToDelete) return;
    try {
      await api.delete(`/templates/${templateToDelete}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete template');
    }
  };

  const renderPreview = (content) => {
    if (!content) return '';
    return content.replace(/\{name\}/g, 'Abdul');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-300">Message Templates</h3>
        <button onClick={() => openModal()} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="card flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-lg">{template.name}</h4>
              <div className="flex gap-2">
                <button onClick={() => openModal(template)} className="text-gray-400 hover:text-white transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deleteTemplate(template.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {template.metaTemplateName && (
              <div className="mb-3 text-xs bg-gray-800 px-2 py-1 rounded inline-block text-gray-400 w-max">
                Meta Template: {template.metaTemplateName}
              </div>
            )}
            {template.headerDocumentUrl && (
              <div className="mb-3 text-xs bg-blue-900/50 px-2 py-1 rounded flex items-center text-blue-300 w-max border border-blue-800/50">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                PDF Attached
              </div>
            )}
            <div className="bg-gray-800/50 rounded p-4 text-sm text-gray-300 flex-1 whitespace-pre-wrap overflow-hidden" style={{ maxHeight: '200px' }}>
              {template.content}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-dark rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden border border-gray-700">
            {/* Form Side */}
            <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-white md:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={saveTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Cold Outreach V1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Meta Template Name (Optional)
                    <span className="block text-xs text-gray-500 font-normal">Required for cold outreach. Must match Meta dashboard exactly.</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.metaTemplateName}
                    onChange={(e) => setFormData({...formData, metaTemplateName: e.target.value})}
                    placeholder="e.g. cordestitch_outreach"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Header Document URL (Optional)
                    <span className="block text-xs text-gray-500 font-normal">Direct link to a PDF to include as a header.</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      className="input-field flex-1"
                      value={formData.headerDocumentUrl}
                      onChange={(e) => setFormData({...formData, headerDocumentUrl: e.target.value})}
                      placeholder="https://example.com/brochure.pdf"
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
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 rounded-lg flex items-center transition-colors border border-gray-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload PDF'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Document Filename (Optional)
                    <span className="block text-xs text-gray-500 font-normal">The name of the file shown in WhatsApp.</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.headerDocumentFilename}
                    onChange={(e) => setFormData({...formData, headerDocumentFilename: e.target.value})}
                    placeholder="e.g. Company_Brochure.pdf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Message Content
                    <span className="block text-xs text-gray-500 font-normal">Use {"{name}"} to insert the contact's name.</span>
                  </label>
                  <textarea
                    required
                    rows="8"
                    className="input-field resize-none"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  ></textarea>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save Template</button>
                </div>
              </form>
            </div>
            {/* Preview Side */}
            <div className="p-6 md:w-1/2 bg-gray-900 flex flex-col relative">
              <div className="absolute top-4 right-4 hidden md:block">
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Live Preview</h4>
              <div className="flex-1 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover rounded-lg p-4 flex flex-col border border-gray-800 space-y-2">
                
                {formData.headerDocumentUrl && (
                  <div className="bg-white text-gray-800 rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%] self-start text-sm flex items-center gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{formData.headerDocumentFilename || 'Document.pdf'}</p>
                      <p className="text-xs text-gray-500 uppercase">PDF • {formData.headerDocumentUrl.length > 25 ? '...' + formData.headerDocumentUrl.slice(-20) : 'Attached'}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white text-gray-800 rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%] self-start text-sm whitespace-pre-wrap">
                     {formData.content ? renderPreview(formData.content) : <span className="text-gray-400 italic">Message preview will appear here...</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone and will prevent campaigns from using it."
        confirmText="Delete Template"
      />
    </div>
  );
}
