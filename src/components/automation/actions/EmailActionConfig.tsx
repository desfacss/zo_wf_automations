import React, { useState } from 'react';
import { Plus, Mail, Users, FileText } from 'lucide-react';
import { EmailTemplateModal } from '../EmailTemplateModal';
import type { WorkflowRule, ViewConfig, EmailTemplate, Team, TableMetadata } from '../../../lib/types';

interface EmailActionConfigProps {
  configuration: any;
  onChange: (config: any) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  emailTemplates: EmailTemplate[];
  teams: Team[];
}

export function EmailActionConfig({
  configuration,
  onChange,
  workflow,
  availableTables,
  emailTemplates,
  teams,
}: EmailActionConfigProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const tableMetadata = availableTables.find(t => t.entity_type === workflow.trigger_table)?.metadata || [];
  
  // Get email fields from metadata
  const emailFields = tableMetadata.filter(field => 
    field.key.includes('email') || 
    field.key.includes('receiver') ||
    field.type === 'text' && field.display_name.toLowerCase().includes('email')
  );

  const handleConfigChange = (field: string, value: any) => {
    onChange({ ...configuration, [field]: value });
  };

  const handleTemplateCreated = (template: EmailTemplate) => {
    handleConfigChange('templateId', template.id);
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* To Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Send To *
        </label>
        <div className="space-y-2">
          <select
            value={configuration.to || ''}
            onChange={(e) => handleConfigChange('to', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select email field or enter custom</option>
            {emailFields.map((field) => (
              //<option key={field.key} value={`{{new.${field.key}}}`}>
               // {field.display_name} ({{new.{field.key}}})
             // </option>
            <option key={field.key} value={`{{new.${field.key}}}`}>
  {/* {field.display_name} (`{{new.${field.key}}}`) */}
              {`${field.display_name} ({{new.${field.key}}})`}
</option>
            ))}
            <option value="custom">Custom email address</option>
          </select>
          
          {configuration.to === 'custom' && (
            <input
              type="email"
              value={configuration.customTo || ''}
              onChange={(e) => handleConfigChange('customTo', e.target.value)}
              placeholder="Enter email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {/* Use template variables like {{new.receivers.emails}} to reference record data */} 
  {`Use template variables like {{new.receivers.emails}} to reference record data`}
        </p>
      </div>

      {/* CC Team */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CC Team (Optional)
        </label>
        <select
          value={configuration.ccTeamId || ''}
          onChange={(e) => {
            const selectedTeam = teams.find(t => t.id === e.target.value);
            handleConfigChange('ccTeamId', e.target.value);
            handleConfigChange('_ccTeamName', selectedTeam?.name || '');
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">No CC team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Email Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Template *
        </label>
        <div className="flex gap-2">
          <select
            value={configuration.templateId || ''}
            onChange={(e) => handleConfigChange('templateId', e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select email template</option>
            {emailTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
        
        {configuration.templateId && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">
                  {emailTemplates.find(t => t.id === configuration.templateId)?.name}
                </p>
                <p className="text-blue-700 mt-1">
                  {emailTemplates.find(t => t.id === configuration.templateId)?.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-medium text-gray-900 mb-3">Additional Settings</h5>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="send_immediately"
              checked={configuration.sendImmediately !== false}
              onChange={(e) => handleConfigChange('sendImmediately', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="send_immediately" className="text-sm text-gray-700">
              Send email immediately (don't queue)
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="track_opens"
              checked={configuration.trackOpens || false}
              onChange={(e) => handleConfigChange('trackOpens', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="track_opens" className="text-sm text-gray-700">
              Track email opens
            </label>
          </div>
        </div>
      </div>

      <EmailTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={handleTemplateCreated}
      />
    </div>
  );
}