import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ConfirmModal from './ConfirmModal';
import TemplateCard from './templates/TemplateCard';
import TemplateModal from './templates/TemplateModal';

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
      
      // We store the internal S3 key (e.g. 'uploads/...') instead of a public URL
      // so the backend can generate a fresh presigned URL when sending the message.
      let uploadedUrl = res.data.storedFilename;

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
    } finally {
      setDeleteModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Message Templates
          </h3>
          <p className="text-gray-400 text-sm mt-1">Manage and create rich WhatsApp templates for your outreach.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn-primary flex items-center shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5 px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <TemplateCard 
            key={template.id} 
            template={template} 
            onEdit={openModal} 
            onDelete={confirmDelete} 
          />
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-gray-700 rounded-2xl bg-gray-900/20">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h4 className="text-lg font-medium text-gray-300 mb-1">No templates yet</h4>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">Create your first template to start sending automated WhatsApp messages.</p>
            <button onClick={() => openModal()} className="btn-secondary text-sm px-5 py-2">Create your first template</button>
          </div>
        )}
      </div>

      <TemplateModal 
        isOpen={isModalOpen}
        editingTemplate={editingTemplate}
        formData={formData}
        setFormData={setFormData}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        saveTemplate={saveTemplate}
        closeModal={closeModal}
      />

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
