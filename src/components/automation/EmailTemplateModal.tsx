import React, { useState } from 'react';
import { X, Save, Mail, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { EmailTemplate } from '../../lib/types';

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
  template?: EmailTemplate | null;
}

export function EmailTemplateModal({ isOpen, onClose, onSave, template }: EmailTemplateModalProps) {
  const { user } = useAuthStore();
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  React.useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name,
        description: template.description || '',
        subject: template.details?.subject || '',
        body: template.details?.body || '',
        is_active: template.is_active !== false,
      });
    } else {
      setTemplateData({
        name: '',
        description: '',
        subject: '',
        body: '',
        is_active: true,
      });
    }
  }, [template, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const emailTemplateData = {
        name: templateData.name,
        description: templateData.description,
        details: {
          subject: templateData.subject,
          body: templateData.body,
        },
        is_active: templateData.is_active,
        organization_id: user?.organization_id,
        updated_at: new Date().toISOString(),
      };

      let savedTemplate;
      if (template?.id) {
        const { data, error } = await supabase
          .from('email_templates')
          .update(emailTemplateData)
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        savedTemplate = data;
      } else {
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            ...emailTemplateData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        savedTemplate = data;
      }

      onSave(savedTemplate);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  const commonPlaceholders = [
    '{{new.display_id}}',
    '{{new.subject}}',
    '{{new.status}}',
    '{{new.created_at}}',
    '{{old.status}}',
    '{{user.name}}',
    '{{organization.name}}',
  ];

  const insertPlaceholder = (placeholder: string, field: 'subject' | 'body') => {
    const textarea = document.getElementById(field) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = templateData[field];
      const newValue = currentValue.substring(0, start) + placeholder + currentValue.substring(end);
      handleInputChange(field, newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-semibold">
                  {template ? 'Edit Email Template' : 'Create Email Template'}
                </h3>
                <p className="text-green-100 mt-1">
                  Design your email template with dynamic placeholders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter template name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={templateData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject *
                </label>
                <input
                  id="subject"
                  type="text"
                  value={templateData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Enter email subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body *
                </label>
                <textarea
                  id="body"
                  value={templateData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Enter email body content. Use HTML for formatting."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={templateData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active template
                </label>
              </div>
            </div>

            {/* Placeholders Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 sticky top-0">
                <h5 className="font-medium text-gray-900 mb-3">Available Placeholders</h5>
                <div className="space-y-2">
                  {commonPlaceholders.map((placeholder) => (
                    <div key={placeholder} className="flex items-center justify-between">
                      <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                        {placeholder}
                      </code>
                      <div className="flex gap-1">
                        <button
                          onClick={() => insertPlaceholder(placeholder, 'subject')}
                          className="text-xs text-blue-600 hover:text-blue-800 px-1"
                          title="Insert into subject"
                        >
                          S
                        </button>
                        <button
                          onClick={() => insertPlaceholder(placeholder, 'body')}
                          className="text-xs text-blue-600 hover:text-blue-800 px-1"
                          title="Insert into body"
                        >
                          B
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-gray-600">
                  <p className="font-medium mb-1">Tips:</p>
                  <ul className="space-y-1">
                    {/* <li>• Use {{new.field}} for new values</li>
                    <li>• Use {{old.field}} for previous values</li>
                    <li>• Use `{{new.field}}` for new values</li>
    <li>• Use `{{old.field}}` for previous values</li> */}
                    <li>• HTML formatting is supported</li>
                    <li>• Click S/B to insert into Subject/Body</li> 
                  </ul> 
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewMode && (
            <div className="mt-6 border-t pt-6">
              <h5 className="font-medium text-gray-900 mb-3">Preview</h5>
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <div className="border-b pb-2 mb-3">
                  <p className="text-sm text-gray-600">Subject:</p>
                  <p className="font-medium">{templateData.subject || 'No subject'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Body:</p>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: templateData.body || 'No content' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!templateData.name || !templateData.subject || !templateData.body || saving}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}