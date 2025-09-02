import React, { useEffect, useState } from 'react';
import { Users, User } from 'lucide-react';
import type { WorkflowRule, ViewConfig, Team, TableMetadata } from '../../../lib/types';

interface AssignOwnerActionConfigProps {
  configuration: any;
  onChange: (config: any) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  teams: Team[];
}

export function AssignOwnerActionConfig({
  configuration,
  onChange,
  workflow,
  availableTables,
  teams,
}: AssignOwnerActionConfigProps) {
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);

  useEffect(() => {
    const table = availableTables.find(t => t.entity_type === workflow.trigger_table);
    if (table && table.metadata) {
      setTableMetadata(table.metadata);
    }
  }, [workflow.trigger_table, availableTables]);

  // Get fields that can be used for assignment (user/owner fields)
  const assignableFields = tableMetadata.filter(field => 
    field.key.includes('assignee') || 
    field.key.includes('owner') ||
    field.key.includes('agent') ||
    (field.foreign_key && field.foreign_key.source_table === 'identity.users')
  );

  const assignmentRules = [
    { value: 'round_robin', label: 'Round Robin', description: 'Distribute evenly among team members' },
    { value: 'least_busy', label: 'Least Busy', description: 'Assign to user with fewest active assignments' },
    { value: 'random', label: 'Random', description: 'Randomly assign to team members' },
    { value: 'specific_user', label: 'Specific User', description: 'Always assign to a specific user' },
  ];

  const handleConfigChange = (field: string, value: any) => {
    onChange({ ...configuration, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Target Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Field *
        </label>
        <select
          value={configuration.field || ''}
          onChange={(e) => handleConfigChange('field', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select field to assign</option>
          {assignableFields.map((field) => (
            <option key={field.key} value={field.key}>
              {field.display_name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose which field will receive the assigned user ID
        </p>
      </div>

      {/* Assignment Rule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Assignment Rule *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assignmentRules.map((rule) => {
            const isSelected = configuration.assignmentRule === rule.value;
            
            return (
              <button
                key={rule.value}
                onClick={() => handleConfigChange('assignmentRule', rule.value)}
                className={`
                  p-4 border-2 rounded-lg text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-900' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <Users className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">{rule.label}</p>
                    <p className="text-sm opacity-75 mt-1">{rule.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Selection */}
      {configuration.assignmentRule !== 'specific_user' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team *
          </label>
          <select
            value={configuration.userGroupId || ''}
            onChange={(e) => handleConfigChange('userGroupId', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Users will be assigned from this team based on the selected rule
          </p>
        </div>
      )}

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Condition (Optional)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Field</label>
            <select
              value={configuration.condition?.field || ''}
              onChange={(e) => handleConfigChange('condition', { 
                ...configuration.condition, 
                field: e.target.value 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No condition</option>
              {assignableFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Must Be</label>
            <select
              value={configuration.condition?.must_be || ''}
              onChange={(e) => handleConfigChange('condition', { 
                ...configuration.condition, 
                must_be: e.target.value 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Any value</option>
              <option value="NULL">Empty/Null</option>
              <option value="NOT_NULL">Not empty</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Only assign if the specified field meets this condition
        </p>
      </div>

      {/* Preview */}
      {configuration.field && configuration.assignmentRule && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-900">Assignment Preview</p>
              <p className="text-green-700 mt-1">
                Will assign <strong>{tableMetadata.find(f => f.key === configuration.field)?.display_name}</strong> using{' '}
                <strong>{assignmentRules.find(r => r.value === configuration.assignmentRule)?.label}</strong>
                {configuration.userGroupId && (
                  <span> from team <strong>{teams.find(t => t.id === configuration.userGroupId)?.name}</strong></span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}