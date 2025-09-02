import React from 'react';
import { Database, Clock, RefreshCw, Zap } from 'lucide-react';
import type { WorkflowRule, ViewConfig } from '../../lib/types';

interface WorkflowBasicInfoProps {
  workflow: Partial<WorkflowRule>;
  onUpdate: (workflow: Partial<WorkflowRule>) => void;
  availableTables: ViewConfig[];
}

export function WorkflowBasicInfo({ workflow, onUpdate, availableTables }: WorkflowBasicInfoProps) {
  const triggerTypes = [
    { value: 'on_create', label: 'On Create', description: 'Trigger when new records are created', icon: Zap },
    { value: 'on_update', label: 'On Update', description: 'Trigger when records are updated', icon: RefreshCw },
    { value: 'both', label: 'Create & Update', description: 'Trigger on both create and update', icon: Database },
    { value: 'cron', label: 'Scheduled', description: 'Run on a schedule using cron', icon: Clock },
  ];

  const handleInputChange = (field: keyof WorkflowRule, value: any) => {
    onUpdate({ ...workflow, [field]: value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Workflow Information</h3>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Name *
            </label>
            <input
              type="text"
              value={workflow.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter a descriptive name for your workflow"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={workflow.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this workflow does and when it should run"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Trigger Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {triggerTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = workflow.trigger_type === type.value;
                
                return (
                  <button
                    key={type.value}
                    onClick={() => handleInputChange('trigger_type', type.value)}
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
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm opacity-75 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cron Configuration */}
          {workflow.trigger_type === 'cron' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cron Expression *
                </label>
                <input
                  type="text"
                  value={workflow.cron_config || ''}
                  onChange={(e) => handleInputChange('cron_config', e.target.value)}
                  placeholder="0 9 * * 1-5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: "0 9 * * 1-5" runs at 9 AM on weekdays
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Description
                </label>
                <input
                  type="text"
                  value={workflow.cron_description || ''}
                  onChange={(e) => handleInputChange('cron_description', e.target.value)}
                  placeholder="Every weekday at 9 AM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Trigger Table */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Table *
            </label>
            <select
              value={workflow.trigger_table || ''}
              onChange={(e) => handleInputChange('trigger_table', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a table to monitor</option>
              {availableTables.map((table) => (
                <option key={table.id} value={table.entity_type}>
                  {table.entity_schema ? `${table.entity_schema}.${table.entity_type}` : table.entity_type}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the table that this workflow will monitor for changes
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={workflow.priority || 0}
              onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Normal (0)</option>
              <option value={1}>High (1)</option>
              <option value={2}>Critical (2)</option>
              <option value={-1}>Low (-1)</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={workflow.is_active || false}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Enable this workflow immediately after creation
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}