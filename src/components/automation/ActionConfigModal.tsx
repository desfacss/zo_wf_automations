import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Radio, Card, Row, Col, Typography, Space, Button, Switch, Alert } from 'antd';
import { SaveOutlined, MailOutlined, UserSwitchOutlined, TagOutlined, EditOutlined, ThunderboltOutlined, DatabaseOutlined, BranchesOutlined } from '@ant-design/icons';
import { EmailActionConfig } from './actions/EmailActionConfig';
import { AssignOwnerActionConfig } from './actions/AssignOwnerActionConfig';
import { UpdateFieldsActionConfig } from './actions/UpdateFieldsActionConfig';
import type { WorkflowAction, WorkflowRule, ViewConfig, EmailTemplate, Team } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface ActionConfigModalProps {
  visible?: boolean;
  onClose: () => void;
  onSave: (action: Partial<WorkflowAction>) => void;
  onCancel?: () => void;
  action?: WorkflowAction | null;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  emailTemplates: EmailTemplate[];
  teams: Team[];
}

export default function ActionConfigModal({
  visible = true,
  onClose,
  onSave,
  onCancel,
  action,
  workflow,
  availableTables,
  emailTemplates,
  teams,
}: ActionConfigModalProps) {
  const [form] = Form.useForm();
  const [actionData, setActionData] = useState<Partial<WorkflowAction>>({
    action_type: 'send_email',
    configuration: {},
    is_enabled: true,
    max_retries: 3,
    name: '',
  });

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', description: 'Send an email notification', icon: MailOutlined },
    { value: 'assign_owner', label: 'Assign Owner', description: 'Assign record to a user or team', icon: UserSwitchOutlined },
    { value: 'update_fields', label: 'Update Fields', description: 'Update specific fields in the record', icon: EditOutlined },
    { value: 'add_tags', label: 'Add Tags', description: 'Add tags to the record', icon: TagOutlined },
    { value: 'create_activity', label: 'Create Activity', description: 'Create a follow-up activity', icon: ThunderboltOutlined },
    { value: 'create_record', label: 'Create Record', description: 'Create a new record in another table', icon: DatabaseOutlined },
    { value: 'trigger_workflow_event', label: 'Trigger Workflow', description: 'Trigger another workflow', icon: BranchesOutlined },
  ];

  useEffect(() => {
    if (action) {
      const formData = {
        ...action,
        conditionRule: action.configuration?.condition?.rule || '',
      };
      setActionData(action);
      form.setFieldsValue(formData);
    } else {
      const initialData = {
        action_type: 'send_email',
        configuration: {},
        is_enabled: true,
        max_retries: 3,
        name: '',
      };
      setActionData(initialData);
      form.setFieldsValue(initialData);
    }
  }, [action, form]);

  const handleSave = (values: any) => {
    if (!values.name || !values.action_type) return;
    
    const finalActionData = {
      ...actionData,
      ...values,
      id: actionData.id || `temp-${Date.now()}-${Math.random()}`,
    };
    
    onSave(finalActionData);
  };

  const handleInputChange = (field: keyof WorkflowAction, value: any) => {
    const updatedData = { ...actionData, [field]: value };
    setActionData(updatedData);
    form.setFieldsValue({ [field]: value });
  };

  const handleConfigurationChange = (config: any) => {
    const updatedData = { ...actionData, configuration: config };
    setActionData(updatedData);
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
          <Alert
            message={`Configuration for "${actionData.action_type}" action type is not yet implemented.`}
            type="warning"
            showIcon
          />
        );
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        color: 'white',
        padding: 24
      }}>
        <Space>
          <ThunderboltOutlined style={{ fontSize: 24 }} />
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              {action ? 'Edit Action' : 'Configure New Action'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              Configure what happens when this workflow triggers
            </Paragraph>
          </div>
        </Space>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          size="large"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Basic Info */}
            <Card title="Basic Information" size="small">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="name"
                    label="Action Name"
                    rules={[{ required: true, message: 'Please enter action name' }]}
                  >
                    <Input
                      placeholder="Enter action name"
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="max_retries"
                    label="Max Retries"
                    help="Number of retry attempts if action fails"
                  >
                    <InputNumber
                      min={0}
                      max={10}
                      style={{ width: '100%' }}
                      onChange={(value) => handleInputChange('max_retries', value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Action Type */}
            <Card title="Action Type" size="small">
              <Form.Item
                name="action_type"
                rules={[{ required: true, message: 'Please select action type' }]}
              >
                <Radio.Group
                  onChange={(e) => {
                    handleInputChange('action_type', e.target.value);
                    handleConfigurationChange({});
                  }}
                  style={{ width: '100%' }}
                >
                  <Row gutter={[16, 16]}>
                    {actionTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Col xs={24} sm={12} lg={8} key={type.value}>
                          <Card
                            size="small"
                            hoverable
                            style={{ height: '100%' }}
                          >
                            <Radio value={type.value} style={{ width: '100%' }}>
                              <Space>
                                <Icon style={{ fontSize: 16, color: '#1890ff' }} />
                                <div>
                                  <Text strong>{type.label}</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {type.description}
                                  </Text>
                                </div>
                              </Space>
                            </Radio>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Radio.Group>
              </Form.Item>
            </Card>

            {/* Action Configuration */}
            <Card title="Action Configuration" size="small">
              {renderActionConfiguration()}
            </Card>

            {/* Enable/Disable */}
            <Card title="Settings" size="small">
              <Form.Item
                name="is_enabled"
                valuePropName="checked"
              >
                <Switch />
                <Text style={{ marginLeft: 8 }}>Enable this action</Text>
              </Form.Item>
            </Card>
          </Space>
        </Form>
      </div>

      {/* Footer */}
      <div style={{
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <Space>
          <Button onClick={onCancel || onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
          >
            Save Action
          </Button>
        </Space>
      </div>
    </div>
  );
}