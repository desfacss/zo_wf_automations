import React from 'react';
import { Form, Input, Select, Radio, Card, Row, Col, Typography, Space, Switch } from 'antd';
import { DatabaseOutlined, BranchesOutlined, SettingOutlined } from '@ant-design/icons';
import type { WorkflowDefinition, ViewConfig } from '../../../lib/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProcessBasicInfoProps {
  definition: Partial<WorkflowDefinition>;
  onUpdate: (definition: Partial<WorkflowDefinition>) => void;
  availableTables: ViewConfig[];
}

export function ProcessBasicInfo({ definition, onUpdate, availableTables }: ProcessBasicInfoProps) {
  const [form] = Form.useForm();

  const processTypes = [
    { value: 'STATE_DRIVEN', label: 'State-Driven Process', description: 'Workflow with defined stages and transitions' },
    { value: 'APPROVAL', label: 'Approval Process', description: 'Multi-step approval workflow' },
    { value: 'ESCALATION', label: 'Escalation Process', description: 'Time-based escalation workflow' },
  ];

  React.useEffect(() => {
    form.setFieldsValue({
      name: definition.name || '',
      description: definition.description || '',
      processType: definition.definitions?.processType || 'STATE_DRIVEN',
      entity_schema: definition.entity_schema || 'public',
      entity_type: definition.entity_type || '',
      type: definition.type || '',
      is_active: definition.is_active !== false,
    });
  }, [definition, form]);

  const handleInputChange = (field: keyof WorkflowDefinition, value: any) => {
    if (field === 'entity_type') {
      onUpdate({ 
        ...definition, 
        [field]: value,
        definitions: {
          ...definition.definitions,
          name: definition.name || '',
        }
      });
    } else if (field === 'name') {
      onUpdate({ 
        ...definition, 
        [field]: value,
        definitions: {
          ...definition.definitions,
          name: value,
        }
      });
    } else {
      onUpdate({ ...definition, [field]: value });
    }
  };

  const handleDefinitionsChange = (field: string, value: any) => {
    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions,
        [field]: value,
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Basic Process Information</Title>
        <Paragraph type="secondary">
          Configure the fundamental properties of your workflow process
        </Paragraph>
      </div>
        
      <Form 
        form={form}
        layout="vertical" 
        size="large"
        onValuesChange={(changedValues, allValues) => {
          Object.keys(changedValues).forEach(key => {
            if (key === 'processType') {
              handleDefinitionsChange(key, changedValues[key]);
            } else {
              handleInputChange(key as keyof WorkflowDefinition, changedValues[key]);
            }
          });
        }}
      >
        <Card title="Basic Information" size="small">
          <Form.Item
            name="name"
            label="Process Name"
            rules={[{ required: true, message: 'Please enter process name' }]}
            help="Enter a descriptive name for your process"
          >
            <Input placeholder="Enter a descriptive name for your process" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            help="Describe what this process manages and its purpose"
          >
            <TextArea
              placeholder="Describe what this process manages and its purpose"
              rows={3}
            />
          </Form.Item>
        </Card>

        <Card title="Process Type" size="small">
          <Form.Item
            name="processType"
            rules={[{ required: true, message: 'Please select process type' }]}
            help="Choose the type of workflow process"
          >
            <Radio.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {processTypes.map((type) => (
                  <Col xs={24} sm={8} key={type.value}>
                    <Card size="small" hoverable>
                      <Radio value={type.value} style={{ width: '100%' }}>
                        <Space>
                          <BranchesOutlined style={{ color: '#1890ff' }} />
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
                ))}
              </Row>
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title="Entity Configuration" size="small">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="entity_schema"
                label="Entity Schema"
                help="Choose the database schema"
              >
                <Select>
                  <Select.Option value="public">public</Select.Option>
                  <Select.Option value="organization">organization</Select.Option>
                  <Select.Option value="external">external</Select.Option>
                  <Select.Option value="identity">identity</Select.Option>
                  <Select.Option value="workflow">workflow</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={12}>
              <Form.Item
                name="entity_type"
                label="Entity Type"
                rules={[{ required: true, message: 'Please select entity type' }]}
                help="Choose the table/entity this process will manage"
              >
                <Select
                  placeholder="Select entity type"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {availableTables
                    .filter(table => table.entity_schema === (definition.entity_schema || 'public'))
                    .map((table) => (
                      <Select.Option key={table.id} value={table.entity_type}>
                        {table.entity_type}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="type"
            label="Type Category"
            help="Optional category to group similar processes"
          >
            <Input placeholder="e.g., Work Order, Support Ticket, Leave Application" />
          </Form.Item>
        </Card>

        <Card title="Activation" size="small">
          <Form.Item
            name="is_active"
            valuePropName="checked"
            help="Enable this process definition immediately after creation"
          >
            <Switch />
            <Text style={{ marginLeft: 8 }}>
              Activate this process definition immediately after creation
            </Text>
          </Form.Item>
        </Card>
      </Form>
    </Space>
  );
}