import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Popconfirm, message, Empty, Drawer, Row, Col, Alert, Spin, Tooltip } from 'antd';
import { 
  PlusOutlined, 
  ThunderboltOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { WorkflowWizard } from '../WorkflowWizard';
import { useAuthStore } from '../../../lib/store';
import type { WorkflowDefinition, ViewConfig, WorkflowRule } from '../../../lib/types';

const { Title, Paragraph } = Typography;

interface ProcessAutomationConfigProps {
  definition: Partial<WorkflowDefinition>;
  onUpdate: (definition: Partial<WorkflowDefinition>) => void;
  availableTables: ViewConfig[];
}

export function ProcessAutomationConfig({ definition, onUpdate, availableTables }: ProcessAutomationConfigProps) {
  const { user } = useAuthStore();
  const [relatedWorkflows, setRelatedWorkflows] = useState<WorkflowRule[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (definition.id) {
      loadRelatedWorkflows();
    }
  }, [definition.id]);

  const loadRelatedWorkflows = async () => {
    if (!definition.id || !user?.organization_id) return;

    console.log('🔄 Loading related workflows for definition ID:', definition.id);
    try {
      setLoading(true);
      console.log('📊 Querying wf_workflows with params:', {
        workflow_definition_id: definition.id,
        organization_id: user.organization_id
      });
      const { data, error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .select('*')
        .eq('workflow_definition_id', definition.id)
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false });

      console.log('📊 Related workflows query result:', { data, error });
      if (error) throw error;
      setRelatedWorkflows(data || []);
      console.log('✅ Related workflows loaded:', data?.length || 0, 'workflows');
    } catch (err) {
      console.error('❌ Error loading related workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewWorkflow = () => {
    setEditingWorkflowId(undefined);
    setDrawerOpen(true);
  };

  const editWorkflow = (workflow: WorkflowRule) => {
    setEditingWorkflowId(workflow.id);
    setDrawerOpen(true);
  };

  const deleteWorkflow = async (workflowId: string) => {
    setDrawerOpen(false);
    setEditingWorkflowId(undefined);
    console.log('🔄 Deleting workflow with ID:', workflowId);
    try {
      console.log('📊 Executing delete query for workflow ID:', workflowId);
      const { error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .delete()
        .eq('id', workflowId);

      console.log('📊 Delete workflow result:', { error });
      if (error) throw error;
      console.log('✅ Workflow deleted successfully');
      await loadRelatedWorkflows();
    } catch (err) {
      console.error('❌ Error deleting workflow:', err);
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, isActive: boolean) => {
    console.log('🔄 Toggling workflow status:', { workflowId, currentStatus: isActive, newStatus: !isActive });
    try {
      console.log('📊 Executing status update query for workflow ID:', workflowId);
      const { error } = await supabase
        .schema('workflow').from('wf_workflows')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', workflowId);

      console.log('📊 Toggle status result:', { error });
      if (error) throw error;
      console.log('✅ Workflow status toggled successfully');
      await loadRelatedWorkflows();
    } catch (err) {
      console.error('❌ Error updating workflow status:', err);
    }
  };

  const handleWorkflowSaved = () => {
    loadRelatedWorkflows();
    setDrawerOpen(false);
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

  const getTriggerTypeLabel = (type: string) => {
    const types = {
      'on_create': 'On Create',
      'on_update': 'On Update', 
      'both': 'Create & Update',
      'cron': 'Scheduled',
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={3} style={{ margin: 0 }}>Process Automation Hooks</Title>
          <Paragraph type="secondary">
            Configure automated workflows that trigger during this process
          </Paragraph>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewWorkflow}
          >
            Add Automation
          </Button>
        </Col>
      </Row>

      <Alert
        message="About Process Automation Hooks"
        description="Automation hooks are event-driven workflows that execute automatically when entities in this process are created, updated, or reach specific stages. They can send emails, assign users, update fields, and perform other actions to streamline your process."
        type="info"
        showIcon
        icon={<ThunderboltOutlined />}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      ) : relatedWorkflows.length === 0 ? (
        <Empty
          image={<ThunderboltOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>No Automation Hooks Configured</Title>
              <Paragraph type="secondary">
                Add automation workflows to handle events during this process
              </Paragraph>
            </div>
          }
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={createNewWorkflow}>
            Add First Automation
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {relatedWorkflows.map((workflow) => (
            <Col xs={24} key={workflow.id}>
              <Card
                className="workflow-card"
                actions={[
                  <Tooltip title={workflow.is_active ? 'Pause' : 'Activate'}>
                    <Button
                      type="text"
                      icon={workflow.is_active ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                      onClick={() => toggleWorkflowStatus(workflow.id!, workflow.is_active!)}
                    />
                  </Tooltip>,
                  <Tooltip title="Edit workflow">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => editWorkflow(workflow)}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete workflow">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => deleteWorkflow(workflow.id!)}
                    />
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      {workflow.name}
                      <Tag color={getTriggerTypeColor(workflow.trigger_type)}>
                        {getTriggerTypeLabel(workflow.trigger_type)}
                      </Tag>
                      <Tag color={workflow.is_active ? 'success' : 'default'}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }}>{workflow.description}</Paragraph>
                      <Space size="small" wrap style={{ marginTop: 8 }}>
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
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingWorkflowId(undefined);
        }}
        destroyOnClose
      >
        <WorkflowWizard
          onClose={() => {
            setDrawerOpen(false);
            setEditingWorkflowId(undefined);
          }}
          workflowId={editingWorkflowId}
          onSave={handleWorkflowSaved}
          processDefinitionId={definition.id}
        />
      </Drawer>
    </Space>
  );
}