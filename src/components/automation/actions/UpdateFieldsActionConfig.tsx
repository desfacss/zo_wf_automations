import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { WorkflowRule, ViewConfig, TableMetadata } from '../../../lib/types';

interface FieldUpdate {
  id: string;
  field: string;
  value: any;
  valueType: 'static' | 'dynamic' | 'expression';
}

interface UpdateFieldsActionConfigProps {
  configuration: any;
  onChange: (config: any) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
}

export function UpdateFieldsActionConfig({
  configuration,
  onChange,
  workflow,
  availableTables,
}: UpdateFieldsActionConfigProps) {
  const [fieldUpdates, setFieldUpdates] = useState<FieldUpdate[]>([]);
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);

  useEffect(() => {
    const table = availableTables.find(t => t.entity_type === workflow.trigger_table);
    if (table && table.metadata) {
      setTableMetadata(table.metadata);
    }
  }, [workflow.trigger_table, availableTables]);

  useEffect(() => {
    // Initialize field updates from configuration
    if (configuration.updates && Array.isArray(configuration.updates)) {
      setFieldUpdates(configuration.updates.map((update: any, index: number) => ({
        id: `update-${index}`,
        field: update.field || '',
        value: update.value || '',
        valueType: update.valueType || 'static',
      })));
    }
  }, [configuration.updates]);

  useEffect(() => {
    // Update configuration when field updates change
    onChange({
      ...configuration,
      updates: fieldUpdates.map(({ id, ...update }) => update),
    });
  }, [fieldUpdates]);

  const addFieldUpdate = () => {
    const newUpdate: FieldUpdate = {
      id: `update-${Date.now()}`,
      field: '',
      value: '',
      valueType: 'static',
    };
    setFieldUpdates([...fieldUpdates, newUpdate]);
  };

  const updateFieldUpdate = (id: string, updates: Partial<FieldUpdate>) => {
    setFieldUpdates(fieldUpdates.map(update => 
      update.id === id ? { ...update, ...updates } : update
    ));
  };

  const removeFieldUpdate = (id: string) => {
    setFieldUpdates(fieldUpdates.filter(update => update.id !== id));
  };

  // Get updatable fields (exclude read-only fields like id, created_at, etc.)
  const updatableFields = tableMetadata.filter(field => 
    !['id', 'created_at', 'updated_at'].includes(field.key) &&
    field.key !== 'organization_id' &&
    field.key !== 'location_id'
  );

  const renderValueInput = (update: FieldUpdate) => {
    const field = tableMetadata.find(f => f.key === update.field);
    
    if (update.valueType === 'dynamic') {
      return (
        <input
          type="text"
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="{{new.field_name}} or {{old.field_name}}"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (update.valueType === 'expression') {
      return (
        <textarea
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="JavaScript expression: new Date().toISOString()"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      );
    }

    if (!field) {
      return (
        <input
          type="text"
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="Enter value"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    // Date/timestamp fields
    if (field.type.includes('timestamp') || field.type === 'date') {
      return (
        <input
          type={field.type === 'date' ? 'date' : 'datetime-local'}
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    // Number fields
    if (field.type === 'integer' || field.type === 'numeric') {
      return (
        <input
          type="number"
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="Enter number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    // Boolean fields
    if (field.type === 'boolean') {
      return (
        <select
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value === 'true' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select value</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    }

    // Default text input
    return (
      <input
        type="text"
        value={update.value || ''}
        onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
        placeholder="Enter value"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Field Updates</h4>
          <p className="text-sm text-gray-600 mt-1">
            Specify which fields to update and their new values
          </p>
        </div>
        <button
          onClick={addFieldUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Field
        </button>
      </div>

      {fieldUpdates.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Edit className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No field updates configured</p>
          <button
            onClick={addFieldUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Field Update
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {fieldUpdates.map((update) => (
            <div key={update.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Field */}
                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                  <select
                    value={update.field}
                    onChange={(e) => updateFieldUpdate(update.id, { field: e.target.value, value: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select field</option>
                    {updatableFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.display_name} ({field.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value Type */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value Type</label>
                  <select
                    value={update.valueType}
                    onChange={(e) => updateFieldUpdate(update.id, { valueType: e.target.value as any, value: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="static">Static Value</option>
                    <option value="dynamic">Dynamic (Template)</option>
                    <option value="expression">Expression</option>
                  </select>
                </div>

                {/* Value */}
                <div className="lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  {renderValueInput(update)}
                </div>

                {/* Remove Button */}
                <div className="lg:col-span-1">
                  <button
                    onClick={() => removeFieldUpdate(update.id)}
                    className="w-full bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Value Type Help */}
              <div className="mt-2 text-xs text-gray-500">
                {update.valueType === 'static' && 'Enter a fixed value that will be used for all records'}
                {update.valueType === 'dynamic' && 'Use {{new.field}} or {{old.field}} to reference record data'}
                {update.valueType === 'expression' && 'Write a JavaScript expression that will be evaluated'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {fieldUpdates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Update Preview</h5>
          <div className="space-y-1 text-sm text-blue-800">
            {fieldUpdates.map((update) => {
              const field = tableMetadata.find(f => f.key === update.field);
              return (
                <p key={update.id}>
                  Set <strong>{field?.display_name || update.field}</strong> to{' '}
                  {update.valueType === 'static' ? `"${update.value}"` : 
                   update.valueType === 'dynamic' ? `${update.value}` : 
                   `expression: ${update.value}`}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}