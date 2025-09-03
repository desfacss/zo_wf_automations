import React, { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Card, Row, Col, Typography, Space, Switch, Tag, Alert, Spin, Divider } from 'antd';
import { PlusOutlined, MailOutlined, TeamOutlined, FileTextOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons';
import { EmailTemplateModal } from '../EmailTemplateModal';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../lib/store';
import type { WorkflowRule, ViewConfig, EmailTemplate, Team, TableMetadata, User } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface Role {
  id: string;
  name: string;
  organization_id: string;
  location_id?: string;
}

interface EmailActionConfigProps {
  configuration: any;
  onChange: (config: any) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  emailTemplates: EmailTemplate[];
  teams: Team[];
}

export function EmailActionConfig({
  configuration,
  onChange,
  workflow,
  availableTables,
  emailTemplates,
  teams,
}: EmailActionConfigProps) {
  const { user } = useAuthStore();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [tableMetadata, setTableMetadata] = useState<TableMetadata[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (workflow.trigger_table) {
      loadTableMetadata();
    }
    loadRolesAndUsers();
  }, [workflow.trigger_table, availableTables]);

  const loadTableMetadata = async () => {
    console.log('🔄 Loading table metadata for email action config, trigger_table:', workflow.trigger_table);
    try {
      const table = availableTables.find(t => t.entity_type === workflow.trigger_table);
      if (table && table.metadata) {
        console.log('✅ Found metadata in availableTables:', table.metadata.length, 'fields');
        setTableMetadata(table.metadata);
      } else {
        console.log('📊 Querying y_view_config for metadata, entity_type:', workflow.trigger_table);
        const { data, error } = await supabase
          .from('y_view_config')
          .select('metadata')
          .eq('entity_type', workflow.trigger_table)
          .eq('is_active', true)
          .maybeSingle();

        console.log('📊 Metadata query result:', { data, error });
        if (error) {
          console.error('❌ Error loading metadata:', error);
        } else if (data && data.metadata) {
          console.log('✅ Metadata loaded from database:', data.metadata.length, 'fields');
          setTableMetadata(data.metadata);
        } else {
          console.log('ℹ️ No metadata found for table:', workflow.trigger_table);
          setTableMetadata([]);
        }
      }
    } catch (err) {
      console.error('❌ Error loading table metadata:', err);
    }
  };

  const loadRolesAndUsers = async () => {
    if (!user?.organization_id) return;

    console.log('🔄 Loading roles and users for email action config');
    setLoadingData(true);
    
    try {
      // Load roles
      console.log('📊 Querying identity.roles for organization_id:', user.organization_id);
      const { data: rolesData, error: rolesError } = await supabase
        .schema('identity')
        .from('roles')
        .select('id, name, organization_id, location_id')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .order('name');

      console.log('📊 Roles query result:', { rolesData, rolesError });
      if (rolesError) {
        console.error('❌ Error loading roles:', rolesError);
      } else {
        setRoles(rolesData || []);
        console.log('✅ Roles loaded:', rolesData?.length || 0, 'roles');
      }

      // Load users
      console.log('📊 Querying identity.users for organization_id:', user.organization_id);
      const { data: usersData, error: usersError } = await supabase
        .schema('identity')
        .from('users')
        .select('id, name, organization_id, location_id, details')
        .eq('organization_id', user.organization_id)
        .eq('is_active', true)
        .order('name');

      console.log('📊 Users query result:', { usersData, usersError });
      if (usersError) {
        console.error('❌ Error loading users:', usersError);
      } else {
        setUsers(usersData || []);
        console.log('✅ Users loaded:', usersData?.length || 0, 'users');
      }
    } catch (err) {
      console.error('❌ Error loading roles and users:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const emailFields = tableMetadata.filter(field => 
    field.key.includes('email') || 
    field.key.includes('receiver') ||
    (field.type === 'text' && field.display_name.toLowerCase().includes('email')) ||
    (field.type === 'jsonb' && field.key.includes('receivers'))
  );

  const handleConfigChange = (field: string, value: any) => {
    onChange({ ...configuration, [field]: value });
  };

  const handleTemplateCreated = (template: EmailTemplate) => {
    handleConfigChange('templateId', template.id);
    setTemplateModalOpen(false);
  };

  const renderRecipientSelect = (field: 'to' | 'cc', label: string, required = false) => {
  return (
    <Form.Item
      label={label}
      required={required}
      help={`Select recipient type and value for ${label.toLowerCase()}`}
    >
      <Row gutter={8}>
        <Col span={8}>
          <Select
            value={configuration[`${field}Type`] || 'field'}
            onChange={(value) => {
              const updatedConfig = {
                ...configuration,
                [`${field}Type`]: value,
                [field]: '', // Reset value when type changes
                [`_${field}TeamName`]: undefined,
                [`_${field}RoleName`]: undefined,
                [`_${field}UserName`]: undefined,
              };
              onChange(updatedConfig);
            }}
            placeholder="Recipient type"
          >
            <Select.Option value="field">Table Field</Select.Option>
            <Select.Option value="custom_field">Custom Field</Select.Option>
            <Select.Option value="team">Team</Select.Option>
            <Select.Option value="role">Role</Select.Option>
            <Select.Option value="user">User</Select.Option>
            <Select.Option value="custom">Custom Email</Select.Option>
          </Select>
        </Col>
        <Col span={16}>
          {configuration[`${field}Type`] === 'field' && (
            <Select
              value={configuration[field] || ''}
              onChange={(value) => {
                const updatedConfig = { ...configuration, [field]: value };
                onChange(updatedConfig);
              }}
              placeholder="Select email field"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {emailFields.map((field) => (
                <Select.Option key={field.key} value={`{{new.${field.key}}}`}>
                  {field.display_name} ({`{{new.${field.key}}}`})
                </Select.Option>
              ))}
            </Select>
          )}

          {configuration[`${field}Type`] === 'custom_field' && (
            <Select
              value={configuration[field] || ''}
              onChange={(value) => {
                const updatedConfig = { ...configuration, [field]: value };
                onChange(updatedConfig);
              }}
              placeholder="Select any field"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {tableMetadata.map((field) => (
                <Select.Option key={field.key} value={`{{new.${field.key}}}`}>
                  {field.display_name} ({`{{new.${field.key}}}`})
                </Select.Option>
              ))}
            </Select>
          )}

          {configuration[`${field}Type`] === 'team' && (
            <Select
              value={configuration[field] || ''}
              onChange={(value) => {
                const selectedTeam = teams.find(t => t.id === value);
                const updatedConfig = {
                  ...configuration,
                  [field]: value,
                  [`_${field}TeamName`]: selectedTeam?.name || '',
                };
                onChange(updatedConfig);
              }}
              placeholder="Select team"
              loading={loadingData}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {teams.map((team) => (
                <Select.Option key={team.id} value={team.id}>
                  {team.name}
                </Select.Option>
              ))}
            </Select>
          )}

          {configuration[`${field}Type`] === 'role' && (
            <Select
              value={configuration[field] || ''}
              onChange={(value) => {
                const selectedRole = roles.find(r => r.id === value);
                const updatedConfig = {
                  ...configuration,
                  [field]: value,
                  [`_${field}RoleName`]: selectedRole?.name || '',
                };
                onChange(updatedConfig);
              }}
              placeholder="Select role"
              loading={loadingData}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          )}

          {configuration[`${field}Type`] === 'user' && (
            <Select
              value={configuration[field] || ''}
              onChange={(value) => {
                const selectedUser = users.find(u => u.id === value);
                const updatedConfig = {
                  ...configuration,
                  [field]: value,
                  [`_${field}UserName`]: selectedUser?.name || '',
                };
                onChange(updatedConfig);
              }}
              placeholder="Select user"
              loading={loadingData}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name || user.details?.email || user.id}
                </Select.Option>
              ))}
            </Select>
          )}

          {configuration[`${field}Type`] === 'custom' && (
            <Select
              mode="tags"
              value={configuration[field] ? configuration[field].split(',').filter(Boolean) : []}
              onChange={(value) => {
                const updatedConfig = {
                  ...configuration,
                  [field]: Array.isArray(value) ? value.join(',') : value,
                };
                onChange(updatedConfig);
              }}
              placeholder="Enter email address"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
            >
              {/* Allow custom email input */}
            </Select>
          )}
        </Col>
      </Row>

      {/* Preview of selected recipient */}
      {configuration[field] && (
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {configuration[`${field}Type`] === 'field' && `Will use: ${configuration[field]}`}
            {configuration[`${field}Type`] === 'custom_field' && `Will use: ${configuration[field]}`}
            {configuration[`${field}Type`] === 'team' && `Team: ${configuration[`_${field}TeamName`] || 'Unknown'}`}
            {configuration[`${field}Type`] === 'role' && `Role: ${configuration[`_${field}RoleName`] || 'Unknown'}`}
            {configuration[`${field}Type`] === 'user' && `User: ${configuration[`_${field}UserName`] || 'Unknown'}`}
            {configuration[`${field}Type`] === 'custom' && `Email: ${configuration[field]}`}
          </Text>
        </div>
      )}
    </Form.Item>
  );
};

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Form layout="vertical" size="large">
        {/* To Recipients */}
        {renderRecipientSelect('to', 'Send To', true)}

        {/* CC Recipients */}
        {renderRecipientSelect('cc', 'CC (Optional)')}

        <Form.Item
          label="Email Template"
          required
          help="Choose or create an email template"
        >
          <Row gutter={8}>
            <Col flex="auto">
              <Select
                value={configuration.templateId || ''}
                onChange={(value) => handleConfigChange('templateId', value)}
                placeholder="Select email template"
              >
                {emailTemplates.map((template) => (
                  <Select.Option key={template.id} value={template.id}>
                    {template.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col flex="none">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setTemplateModalOpen(true)}
              >
                New Template
              </Button>
            </Col>
          </Row>
          
          {configuration.templateId && (
            <Alert
              message={emailTemplates.find(t => t.id === configuration.templateId)?.name}
              description={emailTemplates.find(t => t.id === configuration.templateId)?.description}
              type="info"
              showIcon
              icon={<FileTextOutlined />}
              style={{ marginTop: 12 }}
            />
          )}
        </Form.Item>

        <Card title="Additional Settings" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row align="middle">
              <Col span={4}>
                <Switch
                  checked={configuration.sendImmediately !== false}
                  onChange={(checked) => handleConfigChange('sendImmediately', checked)}
                />
              </Col>
              <Col span={20}>
                <Text>Send email immediately (don't queue)</Text>
              </Col>
            </Row>
            
            <Row align="middle">
              <Col span={4}>
                <Switch
                  checked={configuration.trackOpens || false}
                  onChange={(checked) => handleConfigChange('trackOpens', checked)}
                />
              </Col>
              <Col span={20}>
                <Text>Track email opens</Text>
              </Col>
            </Row>
          </Space>
        </Card>
      </Form>

      {/* Configuration Preview */}
      {(configuration.to || configuration.cc) && (
        <Alert
          message="Email Configuration Preview"
          description={
            <Space direction="vertical" size="small">
              {configuration.to && (
                <Text>
                  <strong>To:</strong> {
                    configuration.toType === 'field' ? configuration.to :
                    configuration.toType === 'team' ? `Team: ${configuration._toTeamName}` :
                    configuration.toType === 'role' ? `Role: ${configuration._toRoleName}` :
                    configuration.toType === 'user' ? `User: ${configuration._toUserName}` :
                    configuration.toType === 'custom' ? configuration.to :
                    'Not configured'
                  }
                </Text>
              )}
              {configuration.cc && (
                <Text>
                  <strong>CC:</strong> {
                    configuration.ccType === 'field' ? configuration.cc :
                    configuration.ccType === 'team' ? `Team: ${configuration._ccTeamName}` :
                    configuration.ccType === 'role' ? `Role: ${configuration._ccRoleName}` :
                    configuration.ccType === 'user' ? `User: ${configuration._ccUserName}` :
                    configuration.ccType === 'custom' ? configuration.cc :
                    'Not configured'
                  }
                </Text>
              )}
              {configuration.templateId && (
                <Text>
                  <strong>Template:</strong> {emailTemplates.find(t => t.id === configuration.templateId)?.name}
                </Text>
              )}
            </Space>
          }
          type="success"
          showIcon
          icon={<MailOutlined />}
        />
      )}

      <EmailTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleTemplateCreated}
      />
    </Space>
  );
}