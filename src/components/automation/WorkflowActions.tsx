import React, { useState } from 'react';
import { Plus, Trash2, Edit, Mail, UserCheck, Tag, Activity, Database, Workflow, GripVertical } from 'lucide-react';
import { ActionConfigModal } from './ActionConfigModal';
import type { WorkflowAction, WorkflowRule, ViewConfig, EmailTemplate, Team } from '../../lib/types';

interface WorkflowActionsProps {
  actions: WorkflowAction[];
  onUpdate: (actions: WorkflowAction[]) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  emailTemplates: EmailTemplate[];
  teams: Team[];
}

export function WorkflowActions({ 
  actions, 
  onUpdate, 
  workflow, 
  availableTables, 
  emailTemplates, 
  teams 
}: WorkflowActionsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null);

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', description: 'Send an email notification', icon: Mail, color: 'blue' },
    { value: 'assign_owner', label: 'Assign Owner', description: 'Assign record to a user or team', icon: UserCheck, color: 'green' },
    { value: 'update_fields', label: 'Update Fields', description: 'Update specific fields in the record', icon: Edit, color: 'purple' },
    { value: 'add_tags', label: 'Add Tags', description: 'Add tags to the record', icon: Tag, color: 'orange' },
    { value: 'create_activity', label: 'Create Activity', description: 'Create a follow-up activity', icon: Activity, color: 'indigo' },
    { value: 'create_record', label: 'Create Record', description: 'Create a new record in another table', icon: Database, color: 'teal' },
    { value: 'trigger_workflow_event', label: 'Trigger Workflow', description: 'Trigger another workflow', icon: Workflow, color: 'pink' },
  ];

  const getActionTypeInfo = (type: string) => {
    return actionTypes.find(at => at.value === type) || actionTypes[0];
  };

  const addAction = () => {
    setEditingAction(null);
    setIsModalOpen(true);
  };

  const editAction = (action: WorkflowAction) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const handleSaveAction = (actionData: Partial<WorkflowAction>) => {
    if (editingAction) {
      // Update existing action
      const updatedActions = actions.map(action => 
        action.id === editingAction.id ? { ...action, ...actionData } : action
      );
      onUpdate(updatedActions);
    } else {
      // Add new action
      const newAction: WorkflowAction = {
        id: `temp-${Date.now()}`,
        action_type: actionData.action_type!,
        configuration: actionData.configuration || {},
        action_order: actions.length + 1,
        retry_count: 0,
        max_retries: 3,
        is_enabled: true,
        organization_id: workflow.organization_id!,
        name: actionData.name || `${actionData.action_type} Action`,
        ...actionData,
      };
      onUpdate([...actions, newAction]);
    }
    setIsModalOpen(false);
    setEditingAction(null);
  };

  const removeAction = (actionId: string) => {
    const updatedActions = actions
      .filter(action => action.id !== actionId)
      .map((action, index) => ({ ...action, action_order: index + 1 }));
    onUpdate(updatedActions);
  };

  const moveAction = (actionId: string, direction: 'up' | 'down') => {
    const currentIndex = actions.findIndex(action => action.id === actionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= actions.length) return;

    const newActions = [...actions];
    [newActions[currentIndex], newActions[newIndex]] = [newActions[newIndex], newActions[currentIndex]];
    
    // Update action_order
    const reorderedActions = newActions.map((action, index) => ({
      ...action,
      action_order: index + 1,
    }));
    
    onUpdate(reorderedActions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Workflow Actions</h3>
          <p className="text-gray-600 mt-1">
            Define what happens when this workflow triggers. Actions run in order.
          </p>
        </div>
        <button
          onClick={addAction}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Action
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Actions Configured</h4>
          <p className="text-gray-600 mb-4">
            Add actions to define what happens when this workflow triggers
          </p>
          <button
            onClick={addAction}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add First Action
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => {
            const actionInfo = getActionTypeInfo(action.action_type);
            const Icon = actionInfo.icon;
            
            return (
              <div key={action.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveAction(action.id!, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveAction(action.id!, 'down')}
                      disabled={index === actions.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Order Badge */}
                  <div className="bg-gray-100 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                    {action.action_order}
                  </div>

                  {/* Action Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${actionInfo.color}-100`}>
                    <Icon className={`w-5 h-5 text-${actionInfo.color}-600`} />
                  </div>

                  {/* Action Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{action.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full bg-${actionInfo.color}-100 text-${actionInfo.color}-700`}>
                        {actionInfo.label}
                      </span>
                      {!action.is_enabled && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{actionInfo.description}</p>
                    
                    {/* Configuration Preview */}
                    <div className="mt-2 text-xs text-gray-500">
                      {action.action_type === 'send_email' && action.configuration.templateId && (
                        <span>Template: {action.configuration.templateId}</span>
                      )}
                      {action.action_type === 'assign_owner' && action.configuration.field && (
                        <span>Field: {action.configuration.field}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editAction(action)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeAction(action.id!)}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ActionConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAction(null);
        }}
        onSave={handleSaveAction}
        action={editingAction}
        workflow={workflow}
        availableTables={availableTables}
        emailTemplates={emailTemplates}
        teams={teams}
      />
    </div>
  );
}