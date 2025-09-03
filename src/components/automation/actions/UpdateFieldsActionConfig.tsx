import React, { useState, useEffect } from 'react';
import { Button, Select, Input, Card, Row, Col, Typography, Space, Alert, Empty, Form } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { WorkflowRule, ViewConfig, TableMetadata } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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
    onChange({
      ...configuration,
      updates: fieldUpdates.map(({ id, ...update }) => update),
    });
  }, [fieldUpdates, onChange]);

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

  const updatableFields = tableMetadata.filter(field => 
    !['id', 'created_at', 'updated_at'].includes(field.key) &&
    field.key !== 'organization_id' &&
    field.key !== 'location_id'
  );

  const renderValueInput = (update: FieldUpdate) => {
    const field = tableMetadata.find(f => f.key === update.field);
    
    if (update.valueType === 'dynamic') {
      return (
        <Input
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="{{new.field_name}} or {{old.field_name}}"
        />
      );
    }

    if (update.valueType === 'expression') {
      return (
        <TextArea
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="JavaScript expression: new Date().toISOString()"
          rows={2}
        />
      );
    }

    if (!field) {
      return (
        <Input
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="Enter value"
        />
      );
    }

    if (field.type.includes('timestamp') || field.type === 'date') {
      return (
        <Input
          type={field.type === 'date' ? 'date' : 'datetime-local'}
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
        />
      );
    }

    if (field.type === 'integer' || field.type === 'numeric') {
      return (
        <Input
          type="number"
          value={update.value || ''}
          onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
          placeholder="Enter number"
        />
      );
    }

    if (field.type === 'boolean') {
      return (
        <Select
          value={update.value}
          onChange={(value) => updateFieldUpdate(update.id, { value })}
          placeholder="Select value"
        >
          <Select.Option value={true}>True</Select.Option>
          <Select.Option value={false}>False</Select.Option>
        </Select>
      );
    }

    return (
      <Input
        value={update.value || ''}
        onChange={(e) => updateFieldUpdate(update.id, { value: e.target.value })}
        placeholder="Enter value"
      />
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>Field Updates</Title>
          <Text type="secondary">Specify which fields to update and their new values</Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addFieldUpdate}
          >
            Add Field
          </Button>
        </Col>
      </Row>

      {fieldUpdates.length === 0 ? (
        <Empty
          image={<EditOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>No Field Updates Configured</Title>
              <Paragraph type="secondary">
                Add field updates to specify what changes to make
              </Paragraph>
            </div>
          }
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addFieldUpdate}
          >
            Add Field Update
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {fieldUpdates.map((update) => (
            <Card key={update.id} size="small">
              <Row gutter={16} align="bottom">
                <Col xs={24} sm={8}>
                  <Form.Item label="Field" style={{ marginBottom: 0 }}>
                    <Select
                      value={update.field}
                      onChange={(value) => updateFieldUpdate(update.id, { field: value, value: '' })}
                      placeholder="Select field"
                    >
                      {updatableFields.map((field) => (
                        <Select.Option key={field.key} value={field.key}>
                          {field.display_name} ({field.type})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={6}>
                  <Form.Item label="Value Type" style={{ marginBottom: 0 }}>
                    <Select
                      value={update.valueType}
                      onChange={(value) => updateFieldUpdate(update.id, { valueType: value, value: '' })}
                    >
                      <Select.Option value="static">Static Value</Select.Option>
                      <Select.Option value="dynamic">Dynamic (Template)</Select.Option>
                      <Select.Option value="expression">Expression</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={8}>
                  <Form.Item label="Value" style={{ marginBottom: 0 }}>
                    {renderValueInput(update)}
                  </Form.Item>
                </Col>

                <Col xs={24} sm={2}>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => removeFieldUpdate(update.id)}
                    style={{ width: '100%' }}
                  />
                </Col>
              </Row>

              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {update.valueType === 'static' && 'Enter a fixed value that will be used for all records'}
                  {update.valueType === 'dynamic' && 'Use {{new.field}} or {{old.field}} to reference record data'}
                  {update.valueType === 'expression' && 'Write a JavaScript expression that will be evaluated'}
                </Text>
              </div>
            </Card>
          ))}
        </Space>
      )}

      {/* Preview */}
      {fieldUpdates.length > 0 && (
        <Alert
          message="Update Preview"
          description={
            <Space direction="vertical" size="small">
              {fieldUpdates.map((update) => {
                const field = tableMetadata.find(f => f.key === update.field);
                return (
                  <Text key={update.id}>
                    Set <Text strong>{field?.display_name || update.field}</Text> to{' '}
                    {update.valueType === 'static' ? `"${update.value}"` : 
                     update.valueType === 'dynamic' ? `${update.value}` : 
                     `expression: ${update.value}`}
                  </Text>
                );
              })}
            </Space>
          }
          type="info"
          showIcon
        />
      )}
    </Space>
  );
}