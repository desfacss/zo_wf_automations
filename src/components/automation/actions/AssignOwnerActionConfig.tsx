import React, { useEffect, useState } from 'react';
import { Form, Select, Radio, Card, Row, Col, Typography, Space, Alert } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import type { WorkflowRule, ViewConfig, TableMetadata, Team } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface AssignOwnerActionConfigProps {
  configuration: any;
  onChange: (config: any) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  teams: Team[];
}

export function AssignOwnerActionConfig({
  configuration,
  onChange,
  workflow,
  availableTables,
  teams,
}: AssignOwnerActionConfigProps) {
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);

  useEffect(() => {
    const table = availableTables.find(t => t.entity_type === workflow.trigger_table);
    if (table && table.metadata) {
      setTableMetadata(table.metadata);
    }
  }, [workflow.trigger_table, availableTables]);

  const assignableFields = tableMetadata.filter(field => 
    field.key.includes('assignee') || 
    field.key.includes('owner') ||
    field.key.includes('agent') ||
    (field.foreign_key && field.foreign_key.source_table === 'identity.users')
  );

  const assignmentRules = [
    { value: 'round_robin', label: 'Round Robin', description: 'Distribute evenly among team members' },
    { value: 'least_busy', label: 'Least Busy', description: 'Assign to user with fewest active assignments' },
    { value: 'random', label: 'Random', description: 'Randomly assign to team members' },
    { value: 'specific_user', label: 'Specific User', description: 'Always assign to a specific user' },
  ];

  const handleConfigChange = (field: string, value: any) => {
    onChange({ ...configuration, [field]: value });
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form layout="vertical" size="large">
        <Form.Item
          label="Assignment Field"
          required
          help="Choose which field will receive the assigned user ID"
        >
          <Select
            value={configuration.field || ''}
            onChange={(value) => handleConfigChange('field', value)}
            placeholder="Select field to assign"
          >
            {assignableFields.map((field) => (
              <Select.Option key={field.key} value={field.key}>
                {field.display_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Assignment Rule"
          required
          help="Choose how users will be assigned"
        >
          <Radio.Group
            value={configuration.assignmentRule}
            onChange={(e) => handleConfigChange('assignmentRule', e.target.value)}
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              {assignmentRules.map((rule) => (
                <Col xs={24} sm={12} key={rule.value}>
                  <Card size="small" hoverable>
                    <Radio value={rule.value} style={{ width: '100%' }}>
                      <Space>
                        <TeamOutlined style={{ color: '#1890ff' }} />
                        <div>
                          <Text strong>{rule.label}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {rule.description}
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

        {configuration.assignmentRule !== 'specific_user' && (
          <Form.Item
            label="Team"
            required
            help="Users will be assigned from this team based on the selected rule"
          >
            <Select
              value={configuration.userGroupId || ''}
              onChange={(value) => handleConfigChange('userGroupId', value)}
              placeholder="Select team"
            >
              {teams.map((team) => (
                <Select.Option key={team.id} value={team.id}>
                  {team.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Card title="Assignment Condition (Optional)" size="small">
          <Paragraph type="secondary">
            Only assign if the specified condition is met
          </Paragraph>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Field"
                help="Field to check before assignment"
              >
                <Select
                  value={configuration.condition?.field || ''}
                  onChange={(value) => handleConfigChange('condition', { 
                    ...configuration.condition, 
                    field: value 
                  })}
                  placeholder="No condition"
                  allowClear
                >
                  {assignableFields.map((field) => (
                    <Select.Option key={field.key} value={field.key}>
                      {field.display_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Must Be"
                help="Condition that must be met"
              >
                <Select
                  value={configuration.condition?.must_be || ''}
                  onChange={(value) => handleConfigChange('condition', { 
                    ...configuration.condition, 
                    must_be: value 
                  })}
                  placeholder="Any value"
                  allowClear
                >
                  <Select.Option value="NULL">Empty/Null</Select.Option>
                  <Select.Option value="NOT_NULL">Not empty</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>

      {/* Preview */}
      {configuration.field && configuration.assignmentRule && (
        <Alert
          message="Assignment Preview"
          description={
            <Space direction="vertical">
              <Text>
                Will assign <Text strong>{tableMetadata.find(f => f.key === configuration.field)?.display_name}</Text> using{' '}
                <Text strong>{assignmentRules.find(r => r.value === configuration.assignmentRule)?.label}</Text>
                {configuration.userGroupId && (
                  <span> from team <Text strong>{teams.find(t => t.id === configuration.userGroupId)?.name}</Text></span>
                )}
              </Text>
            </Space>
          }
          type="success"
          showIcon
          icon={<UserOutlined />}
        />
      )}
    </Space>
  );
}