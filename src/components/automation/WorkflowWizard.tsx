import React, { useState, useEffect } from 'react';
import { Steps, Button, Space, Alert, Spin, Row, Col, Card, Typography } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  SettingOutlined, 
  ThunderboltOutlined, 
  BranchesOutlined
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { WorkflowBasicInfo } from './WorkflowBasicInfo';
import { WorkflowConditions } from './WorkflowConditions';
import { WorkflowActions } from './WorkflowActions';
import type { WorkflowRule, WorkflowAction, ViewConfig, EmailTemplate, Team } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface WorkflowWizardProps {
  onClose: () => void;
  workflowId?: string;
  onSave?: (workflow: WorkflowRule) => void;
  processDefinitionId?: string;
}

export function WorkflowWizard({ onClose, workflowId, onSave, processDefinitionId }: WorkflowWizardProps) {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [workflow, setWorkflow] = useState<Partial<WorkflowRule>>(() => ({
    organization_id: user?.organization_id || '',
    name: '',
    description: '',
    trigger_table: '',
    trigger_type: 'on_create',
    condition_type: 'jsonb',
    conditions: {},
    actions: [],
    is_active: true,
    priority: 0,
    workflow_definition_id: processDefinitionId,
  }));

  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [availableTables, setAvailableTables] = useState<ViewConfig[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const steps = [
    {
      title: 'Basic Information',
      description: 'Define workflow name, trigger, and table',
      icon: <SettingOutlined />,
    },
    {
      title: 'Conditions',
      description: 'Set up when this workflow should run',
      icon: <ThunderboltOutlined />,
    },
    {
      title: 'Actions',
      description: 'Configure what actions to perform',
      icon: <BranchesOutlined />,
    },
  ];

  useEffect(() => {
    loadInitialData();
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAvailableTables(),
        loadEmailTemplates(),
        loadTeams(),
      ]);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTables = async () => {
    try {
      const { data, error } = await supabase
        .from('y_view_config')
        .select('id, entity_type, entity_schema, metadata')
        .eq('is_active', true)
        .order('entity_type');

      if (error) throw error;
      setAvailableTables(data || []);
    } catch (err) {
      console.error('Error loading available tables:', err);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setEmailTemplates(data || []);
    } catch (err) {
      console.error('Error loading email templates:', err);
    }
  };

  const loadTeams = async () => {
    try {
      const { data, error } = await supabase
        .schema('identity')
        .from('teams')
        .select('*')
        .eq('organization_id', user?.organization_id)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  const loadWorkflow = async (id: string) => {
    try {
      setLoading(true);
      
      const { data: workflowData, error: workflowError } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (workflowError) throw workflowError;
      setWorkflow(workflowData);

      if (workflowData.actions && workflowData.actions.length > 0) {
        const validActionIds = workflowData.actions.filter(id => 
          id && typeof id === 'string' && !id.startsWith('temp-')
        );
        
        if (validActionIds.length > 0) {
          const { data: actionsData, error: actionsError } = await supabase
            .schema('workflow')
            .from('wf_actions')
            .select('*')
            .in('id', validActionIds)
            .order('action_order');

          if (actionsError) throw actionsError;
          setActions(actionsData || []);
        }
      }
    } catch (err) {
      setError('Failed to load workflow');
      console.error('Error loading workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const workflowData = {
        ...workflow,
        actions: actions.map(action => action.id || `temp-${Date.now()}-${Math.random()}`),
        updated_at: new Date().toISOString(),
      };

      let savedWorkflow;
      if (workflowId) {
        const { data, error } = await supabase
          .schema('workflow')
          .from('wf_workflows')
          .update(workflowData)
          .eq('id', workflowId)
          .select()
          .single();

        if (error) throw error;
        savedWorkflow = data;
      } else {
        const { data, error } = await supabase
          .schema('workflow')
          .from('wf_workflows')
          .insert({
            ...workflowData,
            created_at: new Date().toISOString(),
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        savedWorkflow = data;
      }

      for (const action of actions) {
        if (!action.id || action.id.startsWith('temp-')) {
          const actionData = {
            ...action,
            id: undefined,
            organization_id: user?.organization_id,
            x_workflow_id: savedWorkflow.id,
            created_at: new Date().toISOString(),
          };
          
          const { error: actionError } = await supabase
            .schema('workflow')
            .from('wf_actions')
            .insert(actionData);

          if (actionError) throw actionError;
        } else {
          const actionData = {
            ...action,
            organization_id: user?.organization_id,
            updated_at: new Date().toISOString(),
          };

          const { error: actionError } = await supabase
            .schema('workflow').from('wf_actions')
            .update(actionData)
            .eq('id', action.id);

          if (actionError) throw actionError;
        }
      }

      onSave?.(savedWorkflow);
      onClose();
    } catch (err) {
      setError('Failed to save workflow');
      console.error('Error saving workflow:', err);
    } finally {
      setSaving(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return Boolean(workflow.name && workflow.trigger_table && workflow.trigger_type);
      case 1:
        return true;
      case 2:
        return actions.length > 0 && actions.every(action => action.name && action.action_type);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)', 
        color: 'white', 
        padding: 24 
      }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <BranchesOutlined style={{ fontSize: 24 }} />
            <div>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {workflowId ? 'Edit Workflow' : 'Create New Workflow'}
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                {steps[currentStep].description}
              </Paragraph>
            </div>
          </Space>
          
          <Steps
            current={currentStep}
            size="small"
            items={steps.map((step, index) => ({
              title: step.title,
              icon: step.icon,
              status: index === currentStep ? 'process' : index < currentStep ? 'finish' : 'wait'
            }))}
            style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 8 }}
          />
        </Space>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {error && (
          <Alert
            message={error}
            type="error"
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError('')}
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>Loading...</Paragraph>
          </div>
        ) : (
          <Card style={{ height: '100%' }}>
            {currentStep === 0 && (
              <WorkflowBasicInfo
                workflow={workflow}
                onUpdate={setWorkflow}
                availableTables={availableTables}
              />
            )}

            {currentStep === 1 && (
              <WorkflowConditions
                workflow={workflow}
                onUpdate={(conditions) => setWorkflow(prev => ({ ...prev, conditions }))}
                availableTables={availableTables.map(t => t.entity_type)}
              />
            )}

            {currentStep === 2 && (
              <WorkflowActions
                actions={actions}
                onUpdate={setActions}
                workflow={workflow}
                availableTables={availableTables}
                emailTemplates={emailTemplates}
                teams={teams}
              />
            )}
          </Card>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#fafafa', 
        borderTop: '1px solid #f0f0f0', 
        padding: '16px 24px' 
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary">
              Step {currentStep + 1} of {steps.length}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                icon={<ArrowLeftOutlined />}
              >
                Previous
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  icon={<ArrowRightOutlined />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleSave}
                  disabled={!canProceedToNext() || saving}
                  loading={saving}
                  icon={<SaveOutlined />}
                >
                  Save Workflow
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}