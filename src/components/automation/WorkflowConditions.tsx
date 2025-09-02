import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Filter } from 'lucide-react';
import type { WorkflowRule, ViewConfig, TableMetadata, Condition } from '../../lib/types';
import { supabase } from '../../lib/supabase';

interface WorkflowConditionsProps {
  workflow: Partial<WorkflowRule>;
  onUpdate: (workflow: Partial<WorkflowRule>) => void;
  availableTables: ViewConfig[];
}

export function WorkflowConditions({ workflow, onUpdate, availableTables }: WorkflowConditionsProps) {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (workflow.trigger_table) {
      loadTableMetadata();
    }
  }, [workflow.trigger_table]);

  useEffect(() => {
    // Initialize conditions from workflow
    if (workflow.conditions && typeof workflow.conditions === 'object') {
      const conditionsArray = Object.entries(workflow.conditions).map(([key, value], index) => ({
        id: `condition-${index}`,
        field: key,
        operator: '=',
        value: value,
        logicalOperator: index > 0 ? 'AND' as const : undefined,
      }));
      setConditions(conditionsArray);
    }
  }, [workflow.conditions]);

  const loadTableMetadata = async () => {
    try {
      const table = availableTables.find(t => t.entity_type === workflow.trigger_table);
      if (table && table.metadata) {
        setTableMetadata(table.metadata);
        
        // Load foreign key options for fields that have them
        const foreignKeyFields = table.metadata.filter(field => field.foreign_key);
        for (const field of foreignKeyFields) {
          await loadForeignKeyOptions(field);
        }
      }
    } catch (err) {
      console.error('Error loading table metadata:', err);
    }
  };

  const loadForeignKeyOptions = async (field: TableMetadata) => {
    if (!field.foreign_key) return;

    try {
      const [schema, table] = field.foreign_key.source_table.includes('.') 
        ? field.foreign_key.source_table.split('.')
        : ['public', field.foreign_key.source_table];

      const { data, error } = await supabase
        .schema(schema)
        .from(table)
        .select(`${field.foreign_key.source_column}, ${field.foreign_key.display_column}`)
        .limit(100);

      if (error) throw error;

      setForeignKeyOptions(prev => ({
        ...prev,
        [field.key]: data || [],
      }));
    } catch (err) {
      console.error(`Error loading options for ${field.key}:`, err);
    }
  };

  const getOperatorsForType = (type: string) => {
    const baseOperators = [
      { value: '=', label: 'Equals' },
      { value: '!=', label: 'Not equals' },
      { value: 'is_null', label: 'Is null' },
      { value: 'is_not_null', label: 'Is not null' },
    ];

    if (type === 'text') {
      return [
        ...baseOperators,
        { value: 'like', label: 'Contains' },
        { value: 'ilike', label: 'Contains (case insensitive)' },
        { value: 'in', label: 'In list' },
      ];
    }

    if (type.includes('timestamp') || type === 'date') {
      return [
        ...baseOperators,
        { value: '>', label: 'After' },
        { value: '<', label: 'Before' },
        { value: '>=', label: 'On or after' },
        { value: '<=', label: 'On or before' },
      ];
    }

    if (type === 'integer' || type === 'numeric') {
      return [
        ...baseOperators,
        { value: '>', label: 'Greater than' },
        { value: '<', label: 'Less than' },
        { value: '>=', label: 'Greater than or equal' },
        { value: '<=', label: 'Less than or equal' },
        { value: 'in', label: 'In list' },
      ];
    }

    return baseOperators;
  };

  const addCondition = () => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`,
      field: '',
      operator: '=',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    ));
  };

  const removeCondition = (id: string) => {
    const newConditions = conditions.filter(condition => condition.id !== id);
    // Remove logical operator from first condition if it exists
    if (newConditions.length > 0) {
      newConditions[0].logicalOperator = undefined;
    }
    setConditions(newConditions);
  };

  const updateWorkflowConditions = () => {
    const conditionsObject = conditions.reduce((acc, condition) => {
      if (condition.field && condition.operator !== 'is_null' && condition.operator !== 'is_not_null') {
        acc[condition.field] = condition.value;
      } else if (condition.field && (condition.operator === 'is_null' || condition.operator === 'is_not_null')) {
        acc[condition.field] = null;
      }
      return acc;
    }, {} as any);

    onUpdate({ ...workflow, conditions: conditionsObject });
  };

  // useEffect(() => {
  //   updateWorkflowConditions();
  // }, [conditions]);
 
  const renderValueInput = (condition: Condition) => {
    const field = tableMetadata.find(f => f.key === condition.field);
    
    if (!field) {
      return (
        <input
          type="text"
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          placeholder="Enter value"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
      return (
        <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
          No value needed
        </div>
      );
    }

    // Foreign key field with options
    if (field.foreign_key && foreignKeyOptions[field.key]) {
      return (
        <select
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select {field.display_name}</option>
          {foreignKeyOptions[field.key].map((option) => (
            <option key={option[field.foreign_key!.source_column]} value={option[field.foreign_key!.source_column]}>
              {option[field.foreign_key!.display_column]}
            </option>
          ))}
        </select>
      );
    }

    // Date/timestamp fields
    if (field.type.includes('timestamp') || field.type === 'date') {
      return (
        <input
          type={field.type === 'date' ? 'date' : 'datetime-local'}
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    // Number fields
    if (field.type === 'integer' || field.type === 'numeric') {
      return (
        <input
          type="number"
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
          placeholder="Enter number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    // Boolean fields
    if (field.type === 'boolean') {
      return (
        <select
          value={condition.value || ''}
          onChange={(e) => updateCondition(condition.id, { value: e.target.value === 'true' })}
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
        value={condition.value || ''}
        onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        placeholder="Enter value"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Workflow Conditions</h3>
          <p className="text-gray-600 mt-1">
            Define when this workflow should trigger. Leave empty to run for all records.
          </p>
        </div>
        <button
          onClick={addCondition}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </button>
      </div>

      {conditions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Conditions Set</h4>
          <p className="text-gray-600 mb-4">
            This workflow will run for all {workflow.trigger_type === 'cron' ? 'scheduled executions' : 'record changes'}
          </p>
          <button
            onClick={addCondition}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add First Condition
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                {/* Logical Operator */}
                {index > 0 && (
                  <div className="lg:col-span-1">
                    <select
                      value={condition.logicalOperator || 'AND'}
                      onChange={(e) => updateCondition(condition.id, { logicalOperator: e.target.value as 'AND' | 'OR' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </div>
                )}

                {/* Field */}
                <div className={index > 0 ? "lg:col-span-4" : "lg:col-span-5"}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(condition.id, { field: e.target.value, value: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select field</option>
                    {tableMetadata.filter(field => field.is_filterable).map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.display_name} ({field.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value, value: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getOperatorsForType(tableMetadata.find(f => f.key === condition.field)?.type || 'text').map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  {renderValueInput(condition)}
                </div>

                {/* Remove Button */}
                <div className="lg:col-span-1">
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="w-full bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {conditions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Condition Preview</h4>
          <p className="text-sm text-blue-800">
            This workflow will trigger when: {conditions.map((condition, index) => {
              const field = tableMetadata.find(f => f.key === condition.field);
              return (
                <span key={condition.id}>
                  {index > 0 && ` ${condition.logicalOperator} `}
                  <strong>{field?.display_name || condition.field}</strong> {condition.operator} {
                    condition.operator === 'is_null' || condition.operator === 'is_not_null' 
                      ? '' 
                      : `"${condition.value}"`
                  }
                </span>
              );
            }).reduce((prev, curr) => [prev, curr])}
          </p>
        </div>
      )}
    </div>
  );
 
  // function getOperatorsForType(type: string) {
  //   const baseOperators = [
  //     { value: '=', label: 'Equals' },
  //     { value: '!=', label: 'Not equals' },
  //     { value: 'is_null', label: 'Is null' },
  //     { value: 'is_not_null', label: 'Is not null' },
  //   ];

  //   if (type === 'text') {
  //     return [
  //       ...baseOperators,
  //       { value: 'like', label: 'Contains' },
  //       { value: 'ilike', label: 'Contains (case insensitive)' },
  //       { value: 'in', label: 'In list' },
  //     ];
  //   }

  //   if (type?.includes('timestamp') || type === 'date') {
  //     return [
  //       ...baseOperators,
  //       { value: '>', label: 'After' },
  //       { value: '<', label: 'Before' },
  //       { value: '>=', label: 'On or after' },
  //       { value: '<=', label: 'On or before' },
  //     ];
  //   }

  //   if (type === 'integer' || type === 'numeric') {
  //     return [
  //       ...baseOperators,
  //       { value: '>', label: 'Greater than' },
  //       { value: '<', label: 'Less than' },
  //       { value: '>=', label: 'Greater than or equal' },
  //       { value: '<=', label: 'Less than or equal' },
  //       { value: 'in', label: 'In list' },
  //     ];
  //   }

  //   return baseOperators;
  // }

  // function renderValueInput(condition: Condition) {
  //   const field = tableMetadata.find(f => f.key === condition.field);
    
  //   if (!field) {
  //     return (
  //       <input
  //         type="text"
  //         value={condition.value || ''}
  //         onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
  //         placeholder="Enter value"
  //         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       />
  //     );
  //   }

  //   if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
  //     return (
  //       <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
  //         No value needed
  //       </div>
  //     );
  //   }

  //   // Foreign key field with options
  //   if (field.foreign_key && foreignKeyOptions[field.key]) {
  //     return (
  //       <select
  //         value={condition.value || ''}
  //         onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
  //         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       >
  //         <option value="">Select {field.display_name}</option>
  //         {foreignKeyOptions[field.key].map((option) => (
  //           <option key={option[field.foreign_key!.source_column]} value={option[field.foreign_key!.source_column]}>
  //             {option[field.foreign_key!.display_column]}
  //           </option>
  //         ))}
  //       </select>
  //     );
  //   }

  //   // Date/timestamp fields
  //   if (field.type.includes('timestamp') || field.type === 'date') {
  //     return (
  //       <input
  //         type={field.type === 'date' ? 'date' : 'datetime-local'}
  //         value={condition.value || ''}
  //         onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
  //         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       />
  //     );
  //   }

  //   // Number fields
  //   if (field.type === 'integer' || field.type === 'numeric') {
  //     return (
  //       <input
  //         type="number"
  //         value={condition.value || ''}
  //         onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
  //         placeholder="Enter number"
  //         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       />
  //     );
  //   }

  //   // Boolean fields
  //   if (field.type === 'boolean') {
  //     return (
  //       <select
  //         value={condition.value || ''}
  //         onChange={(e) => updateCondition(condition.id, { value: e.target.value === 'true' })}
  //         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //       >
  //         <option value="">Select value</option>
  //         <option value="true">True</option>
  //         <option value="false">False</option>
  //       </select>
  //     );
  //   }

  //   // Default text input
  //   return (
  //     <input
  //       type="text"
  //       value={condition.value || ''}
  //       onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
  //       placeholder="Enter value"
  //       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //     />
  //   );
  // } 
}