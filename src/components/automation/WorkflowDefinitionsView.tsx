import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Tag, Spin, Alert, Empty, Row, Col, Tooltip, Drawer, Dropdown, Badge } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  BranchesOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { WorkflowDefinitionWizard } from './WorkflowDefinitionWizard';
import { WorkflowDefinitionDetails } from './WorkflowDefinitionDetails';
import type { WorkflowDefinition } from '../../lib/types';

const { Title, Paragraph } = Typography;

export function WorkflowDefinitionsView() {
  const { user } = useAuthStore();
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [definitionLogCounts, setDefinitionLogCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<WorkflowDefinition | null>(null);
  const [editingDefinitionId, setEditingDefinitionId] = useState<string | undefined>();

  useEffect(() => {
    loadDefinitions();
  }, [user]);

  useEffect(() => {
    if (definitions.length > 0) {
      loadDefinitionLogCounts();
    }
  }, [definitions]);
  
  const loadDefinitions = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .schema('workflow')
        .from('dynamic_workflow_definitions')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDefinitions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflow definitions');
    } finally {
      setLoading(false);
    }
  };

  const loadDefinitionLogCounts = async () => {
    if (!user?.organization_id || definitions.length === 0) return;

    try {
      // Get workflows for these definitions
      const definitionIds = definitions.map(d => d.id).filter(Boolean);
      if (definitionIds.length === 0) return;

      const { data: workflowsData, error: workflowsError } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .select('id, workflow_definition_id')
        .in('workflow_definition_id', definitionIds);

      if (workflowsError) throw workflowsError;

      // Count logs for each definition
      const counts: Record<string, number> = {};
      for (const definition of definitions) {
        const workflowsForDefinition = workflowsData?.filter(w => w.workflow_definition_id === definition.id) || [];
        const workflowIds = workflowsForDefinition.map(w => w.id);
        
        if (workflowIds.length > 0) {
          const { count, error: countError } = await supabase
            .schema('workflow').from('wf_logs') 
            .select('*', { count: 'exact', head: true })
            .in('workflow_id', workflowIds);

          if (!countError) {
            counts[definition.id] = count || 0;
          }
        } else {
          counts[definition.id] = 0;
        }
      }
      
      setDefinitionLogCounts(counts);
    } catch (err: any) {
      console.error('Failed to load definition log counts:', err);
    }
  };

  const deleteDefinition = async (definitionId: string) => {
    try {
      const { error } = await supabase
        .schema('workflow').from('dynamic_workflow_definitions')
        .delete()
        .eq('id', definitionId);

      if (error) throw error;
      await loadDefinitions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow definition');
    }
  };

  const openEditWizard = (definitionId: string) => {
    setEditingDefinitionId(definitionId);
    setEditDrawerOpen(true);
  };

  const openCreateWizard = () => {
    setEditingDefinitionId(undefined);
    setEditDrawerOpen(true);
  };

  const openDetailsView = (definition: WorkflowDefinition) => {
    setSelectedDefinition(definition);
    setDetailsDrawerOpen(true);
  };

  const handleDefinitionSaved = () => {
    loadDefinitions();
    setEditDrawerOpen(false);
    setEditingDefinitionId(undefined);
  };

  const getStageCount = (definition: WorkflowDefinition) => {
    try {
      const stages = definition.definitions?.stages;
      if (Array.isArray(stages)) {
        return stages.length;
      }
      // Handle case where definitions might be a JSON string
      if (typeof definition.definitions === 'string') {
        const parsed = JSON.parse(definition.definitions);
        return parsed.stages?.length || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const getTransitionCount = (definition: WorkflowDefinition) => {
    try {
      const transitions = definition.definitions?.transitions;
      if (Array.isArray(transitions)) {
        return transitions.length;
      }
      // Handle case where definitions might be a JSON string
      if (typeof definition.definitions === 'string') {
        const parsed = JSON.parse(definition.definitions);
        return parsed.transitions?.length || 0;
      }
      return 0;
    } catch {
      return 0;
    }
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
          <Title level={2} style={{ margin: 0 }}>Workflow Definitions</Title>
          <Paragraph type="secondary">
            Manage state-driven workflow processes for your organization
          </Paragraph>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openCreateWizard}
          >
            Create Process
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

      {definitions.length === 0 ? (
        <Empty
          image={<BranchesOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>No Workflow Definitions Yet</Title>
              <Paragraph type="secondary">
                Create your first state-driven workflow process to manage complex business flows
              </Paragraph>
            </div>
          }
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateWizard}>
            Create First Process
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {definitions.map((definition) => (
            <Col xs={24} key={definition.id}>
              <Card
                className="workflow-card"
              >
                <Card.Meta
                  title={
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          {definition.name}
                          <Tag color="purple">
                            {definition.entity_schema ? `${definition.entity_schema}.${definition.entity_type}` : definition.entity_type}
                          </Tag>
                          <Tag color={definition.is_active ? 'success' : 'default'}>
                            {definition.is_active ? 'Active' : 'Inactive'}
                          </Tag>
                          {definition.type && (
                            <Tag color="blue">{definition.type}</Tag>
                          )}
                        </Space>
                      </Col>
                      <Col>
                        <Space size="small">
                          <Tooltip title="View details">
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              onClick={() => openDetailsView(definition)}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Edit definition">
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => openEditWizard(definition.id)}
                              size="small"
                            />
                          </Tooltip>
                          <Tooltip title="Delete definition">
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => deleteDefinition(definition.id)}
                              size="small"
                            />
                          </Tooltip>
                        </Space>
                      </Col>
                    </Row>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }}>
                        {definition.description || 'No description provided'}
                      </Paragraph>
                      
                      <Row gutter={16} style={{ marginTop: 12 }}>
                        <Col span={6}>
                          <Space size="small">
                            <BranchesOutlined />
                            <span>{getStageCount(definition)} Stages</span>
                          </Space>
                        </Col>
                        <Col span={6}>
                          <Space size="small">
                            <ThunderboltOutlined />
                            <span>{getTransitionCount(definition)} Transitions</span>
                          </Space>
                        </Col>
                        <Col span={6}>
                          <Space size="small">
                            <SettingOutlined />
                            <span>v{definition.version}</span>
                          </Space>
                        </Col>
                        <Col span={6}>
                          <Space size="small">
                            <ClockCircleOutlined />
                            <span>{new Date(definition.updated_at!).toLocaleDateString()}</span>
                          </Space>
                        </Col>
                      </Row>

                      {(() => {
                        let stages = [];
                        try {
                          if (typeof definition.definitions === 'string') {
                            const parsed = JSON.parse(definition.definitions);
                            stages = parsed.stages || [];
                          } else {
                            stages = definition.definitions?.stages || [];
                          }
                        } catch {
                          stages = [];
                        }
                        
                        return stages.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <Space size="small" wrap>
                            {stages.slice(0, 5).map((stage) => (
                              <Tag key={stage.id} size="small">
                                {stage.displayLabel}
                              </Tag>
                            ))}
                            {stages.length > 5 && (
                              <Tag size="small">
                                +{stages.length - 5} more
                              </Tag>
                            )}
                          </Space>
                        </div>
                        );
                      })()}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Drawer
        title={editingDefinitionId ? 'Edit Process Definition' : 'Create Process Definition'}
        width="90%"
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingDefinitionId(undefined);
        }}
        destroyOnClose
      >
        <WorkflowDefinitionWizard
          isOpen={editDrawerOpen}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditingDefinitionId(undefined);
          }}
          definitionId={editingDefinitionId}
          onSave={handleDefinitionSaved}
        />
      </Drawer>

      <Drawer
        title={selectedDefinition ? `Process: ${selectedDefinition.name}` : 'Process Details'}
        width="80%"
        open={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedDefinition(null);
        }}
        destroyOnClose
      >
        {selectedDefinition && (
          <WorkflowDefinitionDetails
            definition={selectedDefinition}
            onBack={() => {
              setDetailsDrawerOpen(false);
              setSelectedDefinition(null);
            }}
            onEdit={() => {
              setDetailsDrawerOpen(false);
              setSelectedDefinition(null);
              openEditWizard(selectedDefinition.id);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}