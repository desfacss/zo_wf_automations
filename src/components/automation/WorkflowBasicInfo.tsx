import React from 'react';
import { Form, Input, Select, Radio, Switch, Space, Typography, Card, Row, Col } from 'antd';
import { DatabaseOutlined, ClockCircleOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { WorkflowRule, ViewConfig } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface WorkflowBasicInfoProps {
  workflow: Partial<WorkflowRule>;
  onUpdate: (workflow: Partial<WorkflowRule>) => void;
  availableTables: ViewConfig[];
}

export function WorkflowBasicInfo({ workflow, onUpdate, availableTables }: WorkflowBasicInfoProps) {
  const [form] = Form.useForm();

  const triggerTypes = [
    { value: 'on_create', label: 'On Create', description: 'Trigger when new records are created', icon: ThunderboltOutlined },
    { value: 'on_update', label: 'On Update', description: 'Trigger when records are updated', icon: ReloadOutlined },
    { value: 'both', label: 'Create & Update', description: 'Trigger on both create and update', icon: DatabaseOutlined },
    { value: 'cron', label: 'Scheduled', description: 'Run on a schedule using cron', icon: ClockCircleOutlined },
  ];

  React.useEffect(() => {
    form.setFieldsValue({
      name: workflow.name || '',
      description: workflow.description || '',
      trigger_type: workflow.trigger_type || 'on_create',
      trigger_table: workflow.trigger_table || '',
      cron_config: workflow.cron_config || '',
      cron_description: workflow.cron_description || '',
      priority: workflow.priority || 0,
      is_active: workflow.is_active !== false,
    });
  }, [workflow, form]);

  const handleInputChange = (field: keyof WorkflowRule, value: any) => {
    onUpdate({ ...workflow, [field]: value });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Basic Workflow Information</Title>
        <Paragraph type="secondary">
          Configure the fundamental properties of your workflow
        </Paragraph>
      </div>
        
      <Form 
        form={form}
        layout="vertical" 
        size="large"
        onValuesChange={(changedValues) => {
          Object.keys(changedValues).forEach(key => {
            handleInputChange(key as keyof WorkflowRule, changedValues[key]);
          });
        }}
      >
        <Card title="Basic Information" size="small">
          <Form.Item
            name="name"
            label="Workflow Name"
            rules={[{ required: true, message: 'Please enter workflow name' }]}
            help="Enter a descriptive name for your workflow"
          >
            <Input placeholder="Enter a descriptive name for your workflow" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            help="Describe what this workflow does and when it should run"
          >
            <TextArea
              placeholder="Describe what this workflow does and when it should run"
              rows={3}
            />
          </Form.Item>
        </Card>

        <Card title="Trigger Configuration" size="small">
          <Form.Item
            name="trigger_type"
            label="Trigger Type"
            rules={[{ required: true, message: 'Please select trigger type' }]}
            help="Choose when this workflow should execute"
          >
            <Radio.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {triggerTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Col xs={24} sm={12} key={type.value}>
                      <Card size="small" hoverable>
                        <Radio value={type.value} style={{ width: '100%' }}>
                          <Space>
                            <Icon style={{ color: '#1890ff' }} />
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

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.trigger_type !== currentValues.trigger_type}
          >
            {({ getFieldValue }) =>
              getFieldValue('trigger_type') === 'cron' ? (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="cron_config"
                      label="Cron Expression"
                      rules={[{ required: true, message: 'Please enter cron expression' }]}
                      help='Example: "0 9 * * 1-5" runs at 9 AM on weekdays'
                    >
                      <Input placeholder="0 9 * * 1-5" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="cron_description"
                      label="Schedule Description"
                      help="Human-readable description of the schedule"
                    >
                      <Input placeholder="Every weekday at 9 AM" />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="trigger_table"
            label="Target Table"
            rules={[{ required: true, message: 'Please select target table' }]}
            help="Choose the table that this workflow will monitor for changes"
          >
            <Select
              placeholder="Select a table to monitor"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableTables.map((table) => (
                <Select.Option key={table.id} value={table.entity_type}>
                  {table.entity_schema ? `${table.entity_schema}.${table.entity_type}` : table.entity_type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card title="Settings" size="small">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priority"
                label="Priority"
                help="Higher priority workflows execute first"
              >
                <Select>
                  <Select.Option value={-1}>Low (-1)</Select.Option>
                  <Select.Option value={0}>Normal (0)</Select.Option>
                  <Select.Option value={1}>High (1)</Select.Option>
                  <Select.Option value={2}>Critical (2)</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="is_active"
                label="Enable Workflow"
                help="Enable this workflow immediately after creation"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </Space>
  );
}