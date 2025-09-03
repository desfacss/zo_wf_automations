import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Radio, Card, Row, Col, Typography, Space, Button } from 'antd';
import { SaveOutlined, BranchesOutlined } from '@ant-design/icons';
import type { WorkflowStage } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface StageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: WorkflowStage) => void;
  stage?: WorkflowStage | null;
  existingStages: WorkflowStage[];
}

export function StageConfigModal({ isOpen, onClose, onSave, stage, existingStages }: StageConfigModalProps) {
  const [form] = Form.useForm();

  const statusCategories = [
    { value: 'NEW', label: 'New', description: 'Initial state for new entities' },
    { value: 'OPEN', label: 'Open', description: 'Open and available for work' },
    { value: 'IN_PROGRESS', label: 'In Progress', description: 'Currently being worked on' },
    { value: 'CLOSED_WON', label: 'Closed Won', description: 'Successfully completed' },
    { value: 'CLOSED_LOST', label: 'Closed Lost', description: 'Unsuccessfully completed' },
    { value: 'CANCELLED', label: 'Cancelled', description: 'Cancelled or abandoned' },
  ];

  useEffect(() => {
    if (stage) {
      form.setFieldsValue({
        ...stage,
        on_entry_event_name: stage.on_entry_event_name || `${stage.id?.toLowerCase()}.entered`,
        on_exit_event_name: stage.on_exit_event_name || `${stage.id?.toLowerCase()}.exited`,
      });
    } else {
      const nextSequence = Math.max(...existingStages.map(s => s.sequence), 0) + 1;
      const initialData = {
        id: '',
        name: '',
        displayLabel: '',
        sequence: nextSequence,
        systemStatusCategory: 'IN_PROGRESS',
        on_entry_event_name: '',
        on_exit_event_name: '',
      };
      form.setFieldsValue(initialData);
    }
  }, [stage, existingStages, isOpen, form]);

  const handleSave = (values: any) => {
    if (!values.name || !values.displayLabel || !values.id) return;

    const finalStageData: WorkflowStage = {
      ...values,
      on_entry_event_name: values.on_entry_event_name || `${values.id?.toLowerCase()}.entered`,
      on_exit_event_name: values.on_exit_event_name || `${values.id?.toLowerCase()}.exited`,
      raci: {
        responsible: [],
        accountable: [],
        consulted: [],
        informed: [],
      },
    };

    onSave(finalStageData);
  };

  const generateId = (name: string) => {
    return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  };

  const handleNameChange = (name: string) => {
    const currentValues = form.getFieldsValue();
    const updates = {
      name,
      id: currentValues.id || generateId(name),
      displayLabel: currentValues.displayLabel || name,
    };
    form.setFieldsValue(updates);
  };

  if (!isOpen) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)',
        color: 'white',
        padding: 24
      }}>
        <Space>
          <BranchesOutlined style={{ fontSize: 24 }} />
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              {stage ? 'Edit Stage' : 'Create New Stage'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              Configure stage properties and behavior
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
          <Card title="Basic Information" size="small">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Stage Name"
                  rules={[{ required: true, message: 'Please enter stage name' }]}
                >
                  <Input
                    placeholder="Enter stage name"
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="displayLabel"
                  label="Display Label"
                  rules={[{ required: true, message: 'Please enter display label' }]}
                >
                  <Input placeholder="Enter display label" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="id"
                  label="Stage ID"
                  rules={[{ required: true, message: 'Please enter stage ID' }]}
                  help="Used internally to reference this stage"
                >
                  <Input placeholder="Unique stage identifier" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="sequence"
                  label="Sequence"
                  rules={[{ required: true, message: 'Please enter sequence' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="System Status Category" size="small">
            <Form.Item
              name="systemStatusCategory"
              rules={[{ required: true, message: 'Please select status category' }]}
            >
              <Radio.Group style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  {statusCategories.map((category) => (
                    <Col xs={24} sm={12} lg={8} key={category.value}>
                      <Card size="small" hoverable>
                        <Radio value={category.value} style={{ width: '100%' }}>
                          <div>
                            <Text strong>{category.label}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {category.description}
                            </Text>
                          </div>
                        </Radio>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </Form.Item>
          </Card>

          <Card title="Event Configuration (Optional)" size="small">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="on_entry_event_name"
                  label="On Entry Event Name"
                  help="Event triggered when entering this stage"
                >
                  <Input placeholder="stage_name.entered" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="on_exit_event_name"
                  label="On Exit Event Name"
                  help="Event triggered when exiting this stage"
                >
                  <Input placeholder="stage_name.exited" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="RACI Matrix (Optional)" size="small">
            <Paragraph type="secondary">
              Define roles and responsibilities for this stage
            </Paragraph>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="responsible"
                  label="Responsible"
                  help="Who does the work"
                >
                  <Input placeholder="e.g., Service Manager, {{ticket.assignee_id}}" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="accountable"
                  label="Accountable"
                  help="Who is ultimately responsible"
                >
                  <Input placeholder="e.g., Service Manager" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="consulted"
                  label="Consulted"
                  help="Who provides input"
                >
                  <Input placeholder="e.g., Technical Lead" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="informed"
                  label="Informed"
                  help="Who needs to be kept informed"
                >
                  <Input placeholder="e.g., Customer, Management" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
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
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
          >
            Save Stage
          </Button>
        </Space>
      </div>
    </div>
  );
}