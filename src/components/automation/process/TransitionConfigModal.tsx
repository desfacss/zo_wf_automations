import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Radio, Card, Row, Col, Typography, Space, Button } from 'antd';
import { SaveOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { WorkflowTransition, WorkflowStage } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface TransitionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transition: WorkflowTransition) => void;
  transition?: WorkflowTransition | null;
  stages: WorkflowStage[];
}

export function TransitionConfigModal({ isOpen, onClose, onSave, transition, stages }: TransitionConfigModalProps) {
  const [form] = Form.useForm();

  const triggerTypes = [
    { value: 'manual', label: 'Manual', description: 'User-initiated transition' },
    { value: 'automatic', label: 'Automatic', description: 'Happens automatically when entering the stage' },
    { value: 'event', label: 'Event-Based', description: 'Triggered by specific events' },
    { value: 'time_elapsed_in_state', label: 'Time-Based', description: 'Triggered after time threshold' },
  ];

  useEffect(() => {
    if (transition) {
      form.setFieldsValue({
        ...transition,
        conditionRule: transition.condition?.rule || '',
      });
    } else {
      const initialData = {
        id: '',
        name: '',
        from: '',
        to: '',
        trigger: 'manual',
        conditionRule: '',
        timeThresholdHours: undefined,
      };
      form.setFieldsValue(initialData);
    }
  }, [transition, isOpen, form]);

  const handleSave = (values: any) => {
    if (!values.name || !values.from || !values.to || !values.id) return;

    const finalTransitionData: WorkflowTransition = {
      ...values,
      condition: values.conditionRule ? { rule: values.conditionRule } : undefined,
    };

    onSave(finalTransitionData);
  };

  const generateId = (name: string) => {
    return `T_${name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toUpperCase()}`;
  };

  const handleNameChange = (name: string) => {
    const currentValues = form.getFieldsValue();
    const updates = {
      name,
      id: currentValues.id || generateId(name),
    };
    form.setFieldsValue(updates);
  };

  if (!isOpen) return null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
        color: 'white',
        padding: 24
      }}>
        <Space>
          <ArrowRightOutlined style={{ fontSize: 24 }} />
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              {transition ? 'Edit Transition' : 'Create New Transition'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
              Configure how entities move between stages
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
                  label="Transition Name"
                  rules={[{ required: true, message: 'Please enter transition name' }]}
                >
                  <Input
                    placeholder="Enter transition name"
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="id"
                  label="Transition ID"
                  rules={[{ required: true, message: 'Please enter transition ID' }]}
                  help="Used internally to reference this transition"
                >
                  <Input placeholder="Unique transition identifier" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="from"
                  label="From Stage(s)"
                  rules={[{ required: true, message: 'Please select source stage' }]}
                  help="Stage(s) this transition can start from"
                >
                  <Select placeholder="Select source stage">
                    {stages.map((stage) => (
                      <Select.Option key={stage.id} value={stage.id}>
                        {stage.displayLabel}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="to"
                  label="To Stage"
                  rules={[{ required: true, message: 'Please select destination stage' }]}
                  help="Stage this transition leads to"
                >
                  <Select placeholder="Select destination stage">
                    {stages.map((stage) => (
                      <Select.Option key={stage.id} value={stage.id}>
                        {stage.displayLabel}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Trigger Configuration" size="small">
            <Form.Item
              name="trigger"
              label="Trigger Type"
              rules={[{ required: true, message: 'Please select trigger type' }]}
            >
              <Radio.Group style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  {triggerTypes.map((type) => (
                    <Col xs={24} sm={12} key={type.value}>
                      <Card size="small" hoverable>
                        <Radio value={type.value} style={{ width: '100%' }}>
                          <div>
                            <Text strong>{type.label}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {type.description}
                            </Text>
                          </div>
                        </Radio>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.trigger !== currentValues.trigger}
            >
              {({ getFieldValue }) =>
                getFieldValue('trigger') === 'time_elapsed_in_state' ? (
                  <Form.Item
                    name="timeThresholdHours"
                    label="Time Threshold (Hours)"
                    rules={[{ required: true, message: 'Please enter time threshold' }]}
                    help="Transition will trigger after this many hours in the source stage"
                  >
                    <InputNumber
                      min={0}
                      step={0.1}
                      placeholder="Enter hours"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Card>

          <Card title="Condition (Optional)" size="small">
            <Form.Item
              name="conditionRule"
              label="Condition Rule"
              help="Optional condition that must be met for this transition to be available"
            >
              <TextArea
                placeholder="e.g., {{ticket.assignee_id}} IS NOT NULL"
                rows={3}
              />
            </Form.Item>
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
            Save Transition
          </Button>
        </Space>
      </div>
    </div>
  );
}