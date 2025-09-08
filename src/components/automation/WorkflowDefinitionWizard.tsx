import React, { useState, useEffect } from 'react';
import { Steps, Button, Space, Alert, Spin, Row, Col, Card, Typography } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  ArrowRightOutlined, 
  BranchesOutlined, 
  SettingOutlined, 
  ThunderboltOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { ProcessBasicInfo } from './process/ProcessBasicInfo';
import { ProcessStagesConfig } from './process/ProcessStagesConfig';
import { ProcessAutomationConfig } from './process/ProcessAutomationConfig';
import { ProcessMetricsConfig } from './process/ProcessMetricsConfig';
import type { WorkflowDefinition, ViewConfig, StageMetrics } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface WorkflowDefinitionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  definitionId?: string;
  onSave?: (definition: WorkflowDefinition) => void;
}

export function WorkflowDefinitionWizard({ isOpen, onClose, definitionId, onSave }: WorkflowDefinitionWizardProps) {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Definition data
  const [definition, setDefinition] = useState<Partial<WorkflowDefinition>>({
    organization_id: user?.organization_id || '',
    name: '',
    entity_type: '',
    entity_schema: 'public',
    description: '',
    is_active: true,
    version: 1,
    type: '',
    definitions: {
      name: '',
      description: '',
      processType: 'STATE_DRIVEN',
      startStateId: '',
      stages: [],
      transitions: [],
    },
    initial_template: {},
  });

  const [stageMetrics, setStageMetrics] = useState<Partial<StageMetrics>>({
    metrics_data: [],
  });

  const [availableTables, setAvailableTables] = useState<ViewConfig[]>([]);

  const steps = [
    {
      title: 'Basic Information',
      description: 'Define process name, entity type, and description',
      icon: SettingOutlined,
    },
    {
      title: 'Stages & Transitions',
      description: 'Configure workflow stages and transitions',
      icon: BranchesOutlined,
    },
    {
      title: 'Stage Metrics',
      description: 'Define time and cost metrics for each stage',
      icon: BarChartOutlined,
    },
    {
      title: 'Automation Hooks',
      description: 'Configure automated actions for stage transitions',
      icon: ThunderboltOutlined,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (definitionId) {
        loadDefinition(definitionId);
      }
    }
  }, [isOpen, definitionId]);

  const loadInitialData = async () => {
    setLoading(true);
    console.log('🔄 Loading initial data for process definition wizard');
    try {
      await loadAvailableTables();
      console.log('✅ Initial data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading initial data:', err);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTables = async () => {
    console.log('🔄 Loading available tables from y_view_config');
    try {
      const { data, error } = await supabase
        .from('y_view_config')
        .select('id, entity_type, entity_schema, metadata')
        .eq('is_active', true)
        .order('entity_type');

      console.log('📊 Available tables query result:', { data, error });
      if (error) throw error;
      setAvailableTables(data || []);
      console.log('✅ Available tables loaded:', data?.length || 0, 'tables');
    } catch (err) {
      console.error('❌ Error loading available tables:', err);
    }
  };

  const loadDefinition = async (id: string) => {
    console.log('🔄 Loading workflow definition with ID:', id);
    try {
      setLoading(true);
      
      // Load definition
      console.log('📊 Querying dynamic_workflow_definitions for ID:', id);
      const { data: definitionData, error: definitionError } = await supabase
        .schema('workflow')
        .from('dynamic_workflow_definitions')
        .select('*')
        .eq('id', id)
        .single();

      console.log('📊 Definition query result:', { definitionData, definitionError });
      if (definitionError) throw definitionError;
      
      // Parse definitions JSON
      const parsedDefinition = {
        ...definitionData,
        definitions: typeof definitionData.definitions === 'string' 
          ? JSON.parse(definitionData.definitions) 
          : definitionData.definitions,
      };
      
      setDefinition(parsedDefinition);
      console.log('✅ Definition loaded and parsed:', parsedDefinition);

      // Load stage metrics
      console.log('📊 Querying dynamic_stage_metrics for process_definition_id:', id);
      try {
        const { data: metricsData, error: metricsError } = await supabase
          .schema('workflow')
          .from('dynamic_stage_metrics')
          .select('*')
          .eq('process_definition_id', id)
          .maybeSingle();

        console.log('📊 Stage metrics query result:', { metricsData, metricsError });
        if (!metricsError && metricsData) {
          setStageMetrics({
            ...metricsData,
            metrics_data: typeof metricsData.metrics_data === 'string' 
              ? JSON.parse(metricsData.metrics_data) 
              : metricsData.metrics_data,
          });
          console.log('✅ Stage metrics loaded:', metricsData);
        } else {
          console.log('ℹ️ No stage metrics found for this definition');
        }
      } catch (metricsErr) {
        console.warn('⚠️ Stage metrics not accessible (permission denied):', metricsErr);
        // Continue without stage metrics
      }
    } catch (err) {
      console.error('❌ Error loading workflow definition:', err);
      setError('Failed to load workflow definition');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('🔄 Starting save process for workflow definition');
    setSaving(true);
    setError('');

    try {
      // Save definition
      console.log('📊 Preparing definition data for save:', definition);
      const definitionData = {
        ...definition,
        definitions: JSON.stringify(definition.definitions),
        updated_at: new Date().toISOString(),
      };

      let savedDefinition;
      if (definitionId) {
        console.log('📊 Updating existing definition with ID:', definitionId);
        const { data, error } = await supabase
          .schema('workflow')
          .from('dynamic_workflow_definitions')
          .update(definitionData)
          .eq('id', definitionId)
          .select()
          .single();

        console.log('📊 Update definition result:', { data, error });
        if (error) throw error;
        savedDefinition = data;
        console.log('✅ Definition updated successfully:', savedDefinition);
      } else {
        console.log('📊 Creating new definition');
        const { data, error } = await supabase
          .schema('workflow').from('dynamic_workflow_definitions')
          .insert({
            ...definitionData,
            created_at: new Date().toISOString(),
            created_by: user?.id,
          })
          .select()
          .single();

        console.log('📊 Create definition result:', { data, error });
        if (error) throw error;
        savedDefinition = data;
        console.log('✅ Definition created successfully:', savedDefinition);
      }

      // Save stage metrics if they exist
      if (stageMetrics.metrics_data && stageMetrics.metrics_data.length > 0) {
        console.log('🔄 Saving stage metrics:', stageMetrics);
        try {
          const metricsData = {
            organization_id: user?.organization_id,
            process_definition_id: savedDefinition.id,
            entity_type: `${definition.entity_schema}.${definition.entity_type}`,
            metrics_data: JSON.stringify(stageMetrics.metrics_data),
            updated_at: new Date().toISOString(),
          };

          if (stageMetrics.id) {
            console.log('📊 Updating existing stage metrics with ID:', stageMetrics.id);
            await supabase
              .schema('workflow')
              .from('dynamic_stage_metrics')
              .update(metricsData)
              .eq('id', stageMetrics.id);
            console.log('✅ Stage metrics updated successfully');
          } else {
            console.log('📊 Creating new stage metrics');
            await supabase
              .schema('workflow')
              .from('dynamic_stage_metrics')
              .insert({
                ...metricsData,
                created_at: new Date().toISOString(),
              });
            console.log('✅ Stage metrics created successfully');
          }
        } catch (metricsErr) {
          console.warn('⚠️ Could not save stage metrics (permission denied):', metricsErr);
          // Continue without saving metrics
        }
      } else {
        console.log('ℹ️ No stage metrics to save');
      }

      onSave?.(savedDefinition);
      console.log('✅ Workflow definition save process completed successfully');
      onClose();
    } catch (err) {
      console.error('❌ Error saving workflow definition:', err);
      setError('Failed to save workflow definition');
    } finally {
      setSaving(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0:
        return definition.name && definition.entity_type && definition.definitions?.name;
      case 1:
        return definition.definitions?.stages && definition.definitions.stages.length > 0;
      case 2:
        return true; // Metrics are optional
      case 3:
        return true; // Automation hooks are optional
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

  if (!isOpen) return <div>Loading...</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)', 
        color: 'white', 
        padding: 24 
      }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space>
            <BranchesOutlined style={{ fontSize: 24 }} />
            <div>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {definitionId ? 'Edit Process Definition' : 'Create Process Definition'}
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
              icon: React.createElement(step.icon),
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
              <ProcessBasicInfo
                definition={definition}
                onUpdate={setDefinition}
                availableTables={availableTables}
              />
            )}

            {currentStep === 1 && (
              <ProcessStagesConfig
                definition={definition}
                onUpdate={setDefinition}
              />
            )}

            {currentStep === 2 && (
              <ProcessMetricsConfig
                definition={definition}
                stageMetrics={stageMetrics}
                onUpdate={setStageMetrics}
              />
            )}

            {currentStep === 3 && (
              <ProcessAutomationConfig
                definition={definition}
                onUpdate={setDefinition}
                availableTables={availableTables}
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
                  Save Process
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}