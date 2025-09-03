import React, { useState } from 'react';
import { 
  Drawer, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Tag, 
  Collapse, 
  Button, 
  Alert,
  Descriptions
} from 'antd';
import { 
  CloseOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined, 
  CopyOutlined,
  BugOutlined,
  ThunderboltOutlined,
  DatabaseOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface WorkflowLog {
  id: string;
  workflow_id: string;
  action_id: string;
  event_id: string;
  status: 'success' | 'failed' | 'pending' | 'running';
  execution_time: string;
  duration_ms: number | null;
  error_message: string | null;
  trigger_data: any;
  conditions_checked: any;
  actions_executed: any;
  context: any;
  retry_attempt: number;
  log_level: string;
  workflow_stage: string | null;
}

interface EventDetailsModalProps {
  log: WorkflowLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsModal({ log, isOpen, onClose }: EventDetailsModalProps) {
  if (!log || !isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'running':
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const JsonViewer = ({ data, title }: { data: any; title: string }) => {
    if (!data) return <Text type="secondary" italic>No data available</Text>;

    const jsonString = JSON.stringify(data, null, 2);
    
    return (
      <Card 
        size="small" 
        title={
          <Space>
            <DatabaseOutlined />
            <span>{title}</span>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(jsonString)}
              title="Copy to clipboard"
            />
          </Space>
        }
      >
        <pre style={{
          backgroundColor: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '12px',
          fontSize: '12px',
          overflow: 'auto',
          maxHeight: '300px',
          margin: 0,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
        }}>
          <code>{jsonString}</code>
        </pre>
      </Card>
    );
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
          {getStatusIcon(log.status)}
          <div>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              Log Details: {log.id.substring(0, 8)}...
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color={getStatusColor(log.status)}>
                {log.status.toUpperCase()}
              </Tag>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                {formatTimestamp(log.execution_time)}
              </Text>
            </Space>
          </div>
        </Space>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Summary */}
          <Card title="Summary" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Execution Time">
                {formatTimestamp(log.execution_time)}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {formatDuration(log.duration_ms)}
              </Descriptions.Item>
              <Descriptions.Item label="Action Name">
                {log.context?.action_name || log.workflow_stage || 'Unknown Action'}
              </Descriptions.Item>
              <Descriptions.Item label="Action Type">
                {log.context?.action_type || log.log_level || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Retry Attempt">
                {log.retry_attempt > 0 ? log.retry_attempt : 'None'}
              </Descriptions.Item>
              <Descriptions.Item label="Log Level">
                {log.log_level}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Error Message */}
          {log.error_message && (
            <Alert
              message="Error Message"
              description={
                <pre style={{
                  backgroundColor: '#fff2f0',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {log.error_message}
                </pre>
              }
              type="error"
              showIcon
              icon={<BugOutlined />}
            />
          )}

          {/* Collapsible Sections */}
          <Collapse size="small" ghost>
            {/* Trigger Data */}
            <Panel 
              header={
                <Space>
                  <ThunderboltOutlined />
                  <span>Trigger Data</span>
                </Space>
              } 
              key="trigger"
            >
              <JsonViewer data={log.trigger_data} title="Event Data" />
              
              {log.trigger_data?.new && (
                <Card title="Key Changes" size="small" style={{ marginTop: 16 }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Entity">
                      {log.trigger_data.trigger_table}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      {log.trigger_data.trigger_type}
                    </Descriptions.Item>
                  </Descriptions>
                  
                  {log.trigger_data.changes && log.trigger_data.changes.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Changed Fields:</Text>
                      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        {log.trigger_data.changes.map((change: any, index: number) => (
                          <li key={index} style={{ fontSize: 12, marginBottom: 4 }}>
                            <Text code>{change.path}</Text>: {JSON.stringify(change.old)} → {JSON.stringify(change.new)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}
            </Panel>

            {/* Conditions Checked */}
            {log.conditions_checked && (
              <Panel 
                header={
                  <Space>
                    <DatabaseOutlined />
                    <span>Conditions Checked</span>
                  </Space>
                } 
                key="conditions"
              >
                <JsonViewer data={log.conditions_checked} title="Condition Results" />
              </Panel>
            )}

            {/* Actions Executed */}
            {log.actions_executed && (
              <Panel 
                header={
                  <Space>
                    <ThunderboltOutlined />
                    <span>Actions Executed</span>
                  </Space>
                } 
                key="actions"
              >
                <JsonViewer data={log.actions_executed} title="Action Configuration" />
                
                {/* Special handling for email actions */}
                {log.context?.action_type === 'send_email' && log.actions_executed && (
                  <Alert
                    message="Email Details"
                    description={
                      <Space direction="vertical" size="small">
                        {log.actions_executed.to && (
                          <Text><strong>To:</strong> {log.actions_executed.to}</Text>
                        )}
                        {log.actions_executed.templateId && (
                          <Text><strong>Template:</strong> {log.actions_executed.templateId}</Text>
                        )}
                        {log.actions_executed._ccTeamName && (
                          <Text><strong>CC Team:</strong> {log.actions_executed._ccTeamName}</Text>
                        )}
                      </Space>
                    }
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}

                {/* Special handling for assign_owner actions */}
                {log.context?.action_type === 'assign_owner' && log.actions_executed && (
                  <Alert
                    message="Assignment Details"
                    description={
                      <Space direction="vertical" size="small">
                        {log.actions_executed.field && (
                          <Text><strong>Field:</strong> {log.actions_executed.field}</Text>
                        )}
                        {log.actions_executed.assignmentRule && (
                          <Text><strong>Rule:</strong> {log.actions_executed.assignmentRule}</Text>
                        )}
                        {log.actions_executed.userGroupId && (
                          <Text><strong>Team ID:</strong> {log.actions_executed.userGroupId}</Text>
                        )}
                      </Space>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Panel>
            )}

            {/* Context Data */}
            {log.context && (
              <Panel 
                header={
                  <Space>
                    <DatabaseOutlined />
                    <span>Context Data</span>
                  </Space>
                } 
                key="context"
              >
                <JsonViewer data={log.context} title="Execution Context" />
              </Panel>
            )}

            {/* Raw Log Data */}
            <Panel 
              header={
                <Space>
                  <DatabaseOutlined />
                  <span>Raw Log Data</span>
                </Space>
              } 
              key="raw"
            >
              <JsonViewer data={log} title="Complete Log Entry" />
            </Panel>
          </Collapse>
        </Space>
      </div>

      {/* Footer */}
      <div style={{
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        padding: '16px 24px'
      }}>
        <Text type="secondary">
          Log ID: <Text code>{log.id}</Text>
        </Text>
      </div>
    </div>
  );
}