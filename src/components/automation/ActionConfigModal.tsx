import React, { useState, useEffect } from 'react';
import { X, Save, Mail, UserCheck, Tag, Edit, Activity, Database, Workflow, Plus } from 'lucide-react';
import { EmailActionConfig } from './actions/EmailActionConfig';
import { AssignOwnerActionConfig } from './actions/AssignOwnerActionConfig';
import { UpdateFieldsActionConfig } from './actions/UpdateFieldsActionConfig';
import type { WorkflowAction, WorkflowRule, ViewConfig, EmailTemplate, Team } from '../../lib/types';

interface ActionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (action: Partial<WorkflowAction>) => void;
  action?: WorkflowAction | null;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  emailTemplates: EmailTemplate[];
  teams: Team[];
}

export function ActionConfigModal({
  isOpen,
  onClose,
  onSave,
  action,
  workflow,
  availableTables,
  emailTemplates,
  teams,
}: ActionConfigModalProps) {
  const [actionData, setActionData] = useState<Partial<WorkflowAction>>({
    action_type: 'send_email',
    configuration: {},
    is_enabled: true,
    max_retries: 3,
    name: '',
  });

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', description: 'Send an email notification', icon: Mail },
    { value: 'assign_owner', label: 'Assign Owner', description: 'Assign record to a user or team', icon: UserCheck },
    { value: 'update_fields', label: 'Update Fields', description: 'Update specific fields in the record', icon: Edit },
    { value: 'add_tags', label: 'Add Tags', description: 'Add tags to the record', icon: Tag },
    { value: 'create_activity', label: 'Create Activity', description: 'Create a follow-up activity', icon: Activity },
    { value: 'create_record', label: 'Create Record', description: 'Create a new record in another table', icon: Database },
    { value: 'trigger_workflow_event', label: 'Trigger Workflow', description: 'Trigger another workflow', icon: Workflow },
  ];

  useEffect(() => {
    if (action) {
      setActionData(action);
    } else {
      setActionData({
        action_type: 'send_email',
        configuration: {},
        is_enabled: true,
        max_retries: 3,
        name: '',
      });
    }
  }, [action, isOpen]);

  const handleSave = () => {
    if (!actionData.name || !actionData.action_type) return;
    onSave(actionData);
  };

  const handleInputChange = (field: keyof WorkflowAction, value: any) => {
    setActionData(prev => ({ ...prev, [field]: value }));
  };

  const handleConfigurationChange = (config: any) => {
    setActionData(prev => ({ ...prev, configuration: config }));
  };

  const renderActionConfiguration = () => {
    switch (actionData.action_type) {
      case 'send_email':
        return (
          <EmailActionConfig
            configuration={actionData.configuration || {}}
            onChange={handleConfigurationChange}
            workflow={workflow}
            availableTables={availableTables}
            emailTemplates={emailTemplates}
            teams={teams}
          />
        );
      case 'assign_owner':
        return (
          <AssignOwnerActionConfig
            configuration={actionData.configuration || {}}
            onChange={handleConfigurationChange}
            workflow={workflow}
            availableTables={availableTables}
            teams={teams}
          />
        );
      case 'update_fields':
        return (
          <UpdateFieldsActionConfig
            configuration={actionData.configuration || {}}
            onChange={handleConfigurationChange}
            workflow={workflow}
            availableTables={availableTables}
          />
        );
      default:
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Configuration for "{actionData.action_type}" action type is not yet implemented.
            </p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {action ? 'Edit Action' : 'Configure New Action'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Name *
                </label>
                <input
                  type="text"
                  value={actionData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter action name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={actionData.max_retries || 3}
                  onChange={(e) => handleInputChange('max_retries', parseInt(e.target.value))}
                  min="0"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Action Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {actionTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = actionData.action_type === type.value;
                  
                  return (
                    <button
                      key={type.value}
                      onClick={() => {
                        handleInputChange('action_type', type.value);
                        handleConfigurationChange({});
                      }}
                      className={`
                        p-4 border-2 rounded-lg text-left transition-all
                        ${isSelected 
                          ? 'border-blue-500 bg-blue-50 text-blue-900' 
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs opacity-75 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Configuration */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Action Configuration</h4>
              {renderActionConfiguration()}
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_enabled"
                checked={actionData.is_enabled || false}
                onChange={(e) => handleInputChange('is_enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">
                Enable this action
              </label>
            </div>
          </div>
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
            disabled={!actionData.name || !actionData.action_type}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Action
          </button>
        </div>
      </div>
    </div>
  );
}