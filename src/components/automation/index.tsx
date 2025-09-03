import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Tag, Spin, Alert, Empty, Row, Col, Tooltip, Dropdown, Badge } from 'antd';
import { 
  PlusOutlined, 
  ThunderboltOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { WorkflowWizard } from './WorkflowWizard';
import { Drawer } from 'antd';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { WorkflowRule } from '../../lib/types';

const { Title, Paragraph } = Typography;

interface AutomationDashboardProps {
  onViewLogs?: (workflowId: string, workflowName: string) => void;
}

export function AutomationDashboard({ onViewLogs }: AutomationDashboardProps = {}) {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [workflowLogCounts, setWorkflowLogCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | undefined>();

  useEffect(() => {
    loadWorkflows();
  }, [user]);

  useEffect(() => {
    if (workflows.length > 0) {
      loadWorkflowLogCounts();
    }
  }, [workflows]);
  const loadWorkflows = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowLogCounts = async () => {
    if (!user?.organization_id || workflows.length === 0) return;

    try {
      const workflowIds = workflows.map(w => w.id).filter(Boolean);
      if (workflowIds.length === 0) return;

      const { data, error } = await supabase
        .schema('workflow')
        .from('wf_logs')
        .select('workflow_id')
        .in('workflow_id', workflowIds)
        .gte('execution_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach(log => {
        counts[log.workflow_id] = (counts[log.workflow_id] || 0) + 1;
      });

      setWorkflowLogCounts(counts);
    } catch (err) {
      console.error('Error loading workflow log counts:', err);
    }
  };
  const toggleWorkflowStatus = async (workflowId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', workflowId);

      if (error) throw error;
      await loadWorkflows();
    } catch (err: any) {
      setError(err.message || 'Failed to update workflow status');
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('old-wf_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;
      await loadWorkflows();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow');
    }
  };

  const openEditWizard = (workflowId: string) => {
    setEditingWorkflowId(workflowId);
    setEditDrawerOpen(true);
  };

  const openCreateWizard = () => {
    setEditingWorkflowId(undefined);
    setEditDrawerOpen(true);
  };

  const openLogsView = (workflowId: string, workflowName: string) => {
    if (onViewLogs) {
      onViewLogs(workflowId, workflowName);
    }
  };

  const handleWorkflowSaved = () => {
    loadWorkflows();
    setEditDrawerOpen(false);
    setEditingWorkflowId(undefined);
  };

  const getTriggerTypeColor = (type: string) => {
    const colors = {
      'on_create': 'green',
      'on_update': 'blue',
      'both': 'purple',
      'cron': 'orange',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getWorkflowActions = (workflow: WorkflowRule) => {
    const logCount = workflowLogCounts[workflow.id!] || 0;
    
    const actions = [
      {
        key: 'logs',
        icon: logCount > 0 ? (
          <Badge count={logCount} size="small">
            <ClockCircleOutlined />
          </Badge>
        ) : (
          <ClockCircleOutlined />
        ),
        tooltip: 'View logs',
        onClick: () => openLogsView(workflow.id!, workflow.name),
      },
      {
        key: 'toggle',
        icon: workflow.is_active ? <PauseCircleOutlined /> : <PlayCircleOutlined />,
        tooltip: workflow.is_active ? 'Pause workflow' : 'Activate workflow',
        onClick: () => toggleWorkflowStatus(workflow.id!, workflow.is_active!),
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        tooltip: 'Edit workflow',
        onClick: () => openEditWizard(workflow.id!),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        tooltip: 'Delete workflow',
        onClick: () => deleteWorkflow(workflow.id!),
        danger: true,
      },
    ];

    if (actions.length <= 3) {
      return (
        <Space size="small">
          {actions.map(action => (
            <Tooltip key={action.key} title={action.tooltip}>
              <Button
                type="text"
                icon={action.icon}
                onClick={action.onClick}
                danger={action.danger}
                size="small"
              />
            </Tooltip>
          ))}
        </Space>
      );
    }

    const visibleActions = actions.slice(0, 2);
    const menuActions = actions.slice(2);

    return (
      <Space size="small">
        {visibleActions.map(action => (
          <Tooltip key={action.key} title={action.tooltip}>
            <Button
              type="text"
              icon={action.icon}
              onClick={action.onClick}
              danger={action.danger}
              size="small"
            />
          </Tooltip>
        ))}
        <Dropdown
          menu={{
            items: menuActions.map(action => ({
              key: action.key,
              icon: action.icon,
              label: action.tooltip,
              onClick: action.onClick,
              danger: action.danger,
            })),
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      </Space>
    );
  };
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Workflow Automation</Title>
          <Paragraph type="secondary">
            Create and manage automated workflows for your organization
          </Paragraph>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openCreateWizard}
          >
            Create Workflow
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: 24 }}
          closable
          onClose={() => setError('')}
        />
      )}

      {workflows.length === 0 ? (
        <Empty
          image={<ThunderboltOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>No Workflows Yet</Title>
              <Paragraph type="secondary">
                Create your first automated workflow to streamline your processes
              </Paragraph>
            </div>
          }
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateWizard}>
            Create First Workflow
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {workflows.map((workflow) => (
            <Col xs={24} key={workflow.id}>
              <Card
                className="workflow-card"
              >
                <Card.Meta
                  title={
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          {workflow.name}
                          <Tag color={getTriggerTypeColor(workflow.trigger_type)}>
                            {workflow.trigger_type.replace('_', ' ').toUpperCase()}
                          </Tag>
                          <Tag color={workflow.is_active ? 'success' : 'default'}>
                            {workflow.is_active ? 'Active' : 'Inactive'}
                          </Tag>
                        </Space>
                      </Col>
                      <Col>
                        {getWorkflowActions(workflow)}
                      </Col>
                    </Row>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }}>{workflow.description}</Paragraph>
                      <Space size="small" wrap>
                        <span>Table: {workflow.trigger_table}</span>
                        <span>Actions: {workflow.actions?.length || 0}</span>
                        <span>Priority: {workflow.priority}</span>
                        {workflow.last_executed_at && (
                          <span>Last run: {new Date(workflow.last_executed_at).toLocaleDateString()}</span>
                        )}
                      </Space>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Drawer
        title={editingWorkflowId ? 'Edit Workflow' : 'Create New Workflow'}
        width="80%"
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingWorkflowId(undefined);
        }}
        destroyOnClose
      >
        <WorkflowWizard
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingWorkflowId(undefined);
          }}
          workflowId={editingWorkflowId}
          onSave={handleWorkflowSaved}
        />
      </Drawer>
    </div>
  );
}