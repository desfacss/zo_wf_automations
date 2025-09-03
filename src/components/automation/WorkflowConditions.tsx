import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Input, Button, Space, Row, Col, Typography, Empty, Alert, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import type { ViewConfig, TableMetadata } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface WorkflowCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface WorkflowConditionsProps {
  workflow: {
    id?: string;
    conditions?: any;
    trigger_table?: string;
  };
  onUpdate: (conditions: any) => void;
  availableTables?: ViewConfig[];
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'in', label: 'In (comma separated)' },
  { value: 'not_in', label: 'Not In (comma separated)' },
];

export function WorkflowConditions({
  workflow,
  onUpdate,
  availableTables = []
}: WorkflowConditionsProps) {
  const [conditions, setConditions] = useState<WorkflowCondition[]>([]);
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string[]>>({});
  const [loadingFieldValues, setLoadingFieldValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (workflow.conditions && Array.isArray(workflow.conditions)) {
      setConditions(workflow.conditions);
    } else {
      setConditions([]);
    }
  }, [workflow.conditions]);

  useEffect(() => {
    if (workflow.trigger_table) {
      loadTableMetadata();
    }
  }, [workflow.trigger_table, availableTables]);

  const loadTableMetadata = async () => {
    console.log('🔄 Loading table metadata for trigger_table:', workflow.trigger_table);
    setLoadingMetadata(true);
    setMetadataError('');

    try {
      // First try to find in availableTables
      const tableConfig = availableTables.find(table => table.entity_type === workflow.trigger_table);
      
      if (tableConfig && tableConfig.metadata) {
        console.log('✅ Found metadata in availableTables:', tableConfig.metadata.length, 'fields');
        setTableMetadata(tableConfig.metadata);
      } else {
        // Fallback: query y_view_config directly
        console.log('📊 Querying y_view_config for entity_type:', workflow.trigger_table);
        const { data, error } = await supabase
          .from('y_view_config')
          .select('metadata')
          .eq('entity_type', workflow.trigger_table)
          .eq('is_active', true)
          .maybeSingle();

        console.log('📊 Table metadata query result:', { data, error });
        
        if (error) {
          console.error('❌ Error loading table metadata:', error);
          setMetadataError(error.message);
        } else if (data && data.metadata) {
          console.log('✅ Table metadata loaded from database:', data.metadata.length, 'fields');
          setTableMetadata(data.metadata);
        } else {
          console.log('ℹ️ No metadata found for table:', workflow.trigger_table);
          setTableMetadata([]);
        }
      }
    } catch (err: any) {
      console.error('❌ Error loading table metadata:', err);
      setMetadataError(err.message || 'Failed to load table metadata');
    } finally {
      setLoadingMetadata(false);
    }
  };

  const addCondition = () => {
    const newCondition: WorkflowCondition = {
      id: Date.now().toString(),
      field: '',
      operator: 'equals',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined
    };
    
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    onUpdate(updatedConditions);
  };

  const removeCondition = (id: string) => {
    const updatedConditions = conditions.filter(condition => condition.id !== id);
    setConditions(updatedConditions);
    onUpdate(updatedConditions);
  };

  const updateCondition = (id: string, field: keyof WorkflowCondition, value: string) => {
    const updatedConditions = conditions.map(condition =>
      condition.id === id ? { ...condition, [field]: value } : condition
    );
    setConditions(updatedConditions);
    onUpdate(updatedConditions);
  };

  const getFieldDisplayName = (fieldKey: string) => {
    const field = tableMetadata.find(f => f.key === fieldKey);
    return field ? `${field.display_name} (${field.type})` : fieldKey;
  };

  const getFieldType = (fieldKey: string) => {
    const field = tableMetadata.find(f => f.key === fieldKey);
    return field?.type || 'text';
  };

  const loadFieldValues = async (fieldKey: string) => {
    if (!workflow.trigger_table || !fieldKey) return;
    
    console.log('🔄 Loading unique field values for field:', fieldKey, 'from table:', workflow.trigger_table);
    setLoadingFieldValues(prev => ({ ...prev, [fieldKey]: true }));
    
    try {
      // Determine schema and table name
      const [schema, tableName] = workflow.trigger_table.includes('.') 
        ? workflow.trigger_table.split('.') 
        : ['public', workflow.trigger_table];
      
      console.log('📊 Querying for unique values from schema:', schema, 'table:', tableName, 'field:', fieldKey);
      
      const { data, error } = await supabase
        .schema(schema)
        .from(tableName)
        .select(fieldKey)
        .not(fieldKey, 'is', null)
        .limit(100)
        .order('created_at', { ascending: false });

      console.log('📊 Field values query result:', { data, error });
      
      if (error) {
        console.error('❌ Error loading field values:', error);
      } else if (data) {
        // Extract unique values
        const uniqueValues = [...new Set(data.map(row => row[fieldKey]).filter(val => val != null))]
          .slice(0, 10)
          .map(val => String(val));
        
        console.log('✅ Unique field values loaded:', uniqueValues.length, 'values for field:', fieldKey);
        setFieldValues(prev => ({ ...prev, [fieldKey]: uniqueValues }));
      }
    } catch (err) {
      console.error('❌ Error loading field values:', err);
    } finally {
      setLoadingFieldValues(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const renderValueInput = (condition: WorkflowCondition) => {
    const fieldType = getFieldType(condition.field);
    const availableValues = fieldValues[condition.field] || [];
    const isLoadingValues = loadingFieldValues[condition.field] || false;
    
    // Don't show value input for null checks
    if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
      return null;
    }

    if (fieldType === 'boolean') {
      return (
        <Select
          value={condition.value}
          onChange={(value) => updateCondition(condition.id, 'value', value)}
          placeholder="Select value"
          style={{ width: '100%' }}
        >
          <Select.Option value="true">True</Select.Option>
          <Select.Option value="false">False</Select.Option>
        </Select>
      );
    }

    if (fieldType.includes('timestamp') || fieldType === 'date') {
      return (
        <Input
          type={fieldType === 'date' ? 'date' : 'datetime-local'}
          value={condition.value}
          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
          style={{ width: '100%' }}
        />
      );
    }

    if (fieldType === 'integer' || fieldType === 'numeric') {
      return (
        <Select
          mode={condition.operator === 'in' || condition.operator === 'not_in' ? 'tags' : undefined}
          value={condition.value}
          onChange={(value) => updateCondition(condition.id, 'value', Array.isArray(value) ? value.join(',') : value)}
          placeholder="Enter number"
          style={{ width: '100%' }}
          loading={isLoadingValues}
          onFocus={() => !availableValues.length && loadFieldValues(condition.field)}
          allowClear
        >
          {availableValues.map((val) => (
            <Select.Option key={val} value={val}>
              {val}
            </Select.Option>
          ))}
        </Select>
      );
    }

    // For text fields and others, show dropdown with recent values
    return (
      <Select
        mode={condition.operator === 'in' || condition.operator === 'not_in' ? 'tags' : undefined}
        value={condition.value}
        onChange={(value) => updateCondition(condition.id, 'value', Array.isArray(value) ? value.join(',') : value)}
        placeholder={
          condition.operator === 'in' || condition.operator === 'not_in' 
            ? "Select or enter values"
            : "Select or enter value"
        }
        style={{ width: '100%' }}
        loading={isLoadingValues}
        onFocus={() => !availableValues.length && loadFieldValues(condition.field)}
        allowClear
        showSearch
        filterOption={(input, option) =>
          (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
        }
      >
        {availableValues.map((val) => (
          <Select.Option key={val} value={val}>
            {val}
          </Select.Option>
        ))}
      </Select>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Workflow Conditions</Title>
        <Paragraph type="secondary">
          Define conditions that must be met for this workflow to execute
        </Paragraph>
      </div>

      {!workflow.trigger_table && (
        <Alert
          message="No Target Table Selected"
          description="Please select a target table in the basic information step to configure conditions."
          type="warning"
          showIcon
        />
      )}

      {workflow.trigger_table && metadataError && (
        <Alert
          message="Error Loading Table Metadata"
          description={metadataError}
          type="error"
          showIcon
          closable
          onClose={() => setMetadataError('')}
        />
      )}

      {workflow.trigger_table && loadingMetadata && (
        <Card>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>Loading table metadata...</Paragraph>
          </div>
        </Card>
      )}

      {workflow.trigger_table && !loadingMetadata && !metadataError && (
        <>
          {conditions.length === 0 ? (
            <Empty
              image={<FilterOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                <div>
                  <Title level={4}>No Conditions Set</Title>
                  <Paragraph type="secondary">
                    Add conditions to control when this workflow runs
                  </Paragraph>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addCondition}
                disabled={tableMetadata.length === 0}
              >
                Add First Condition
              </Button>
            </Empty>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {conditions.map((condition, index) => (
                <Card key={condition.id} size="small">
                  <Row gutter={16} align="middle">
                    {index > 0 && (
                      <Col xs={24} sm={3}>
                        <Select
                          value={condition.logicalOperator}
                          onChange={(value) => updateCondition(condition.id, 'logicalOperator', value)}
                          style={{ width: '100%' }}
                        >
                          <Select.Option value="AND">AND</Select.Option>
                          <Select.Option value="OR">OR</Select.Option>
                        </Select>
                      </Col>
                    )}
                    
                    <Col xs={24} sm={index > 0 ? 6 : 8}>
                      <Select
                        placeholder="Select field"
                        value={condition.field}
                        onChange={(value) => updateCondition(condition.id, 'field', value)}
                        style={{ width: '100%' }}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {tableMetadata.map(field => (
                          <Select.Option key={field.key} value={field.key}>
                            {getFieldDisplayName(field.key)}
                          </Select.Option>
                        ))}
                      </Select>
                    </Col>
                    
                    <Col xs={24} sm={5}>
                      <Select
                        value={condition.operator}
                        onChange={(value) => updateCondition(condition.id, 'operator', value)}
                        style={{ width: '100%' }}
                      >
                        {operators.map(op => (
                          <Select.Option key={op.value} value={op.value}>{op.label}</Select.Option>
                        ))}
                      </Select>
                    </Col>
                    
                    <Col xs={24} sm={6}>
                      {renderValueInput(condition)}
                    </Col>
                    
                    <Col xs={24} sm={2}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeCondition(condition.id)}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          )}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addCondition}
            block
            disabled={tableMetadata.length === 0}
          >
            Add Condition
          </Button>

          {tableMetadata.length === 0 && workflow.trigger_table && (
            <Alert
              message="No Metadata Available"
              description={`No field metadata found for table "${workflow.trigger_table}". Please ensure the table is configured in the view configuration.`}
              type="warning"
              showIcon
            />
          )}
        </>
      )}
    </Space>
  );
}