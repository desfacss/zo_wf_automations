import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Typography, Space, Tag, Tabs, Spin, Empty } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  BranchesOutlined, 
  ThunderboltOutlined, 
  ClockCircleOutlined, 
  TeamOutlined, 
  DollarOutlined, 
  SettingOutlined, 
  EyeOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { WorkflowDefinition, StageMetrics, WorkflowRule } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface WorkflowDefinitionDetailsProps {
  definition: WorkflowDefinition;
  onBack: () => void;
  onEdit: () => void;
}

export function WorkflowDefinitionDetails({ definition, onBack, onEdit }: WorkflowDefinitionDetailsProps) {
  const { user } = useAuthStore();
  const [stageMetrics, setStageMetrics] = useState<StageMetrics | null>(null);
  const [relatedWorkflows, setRelatedWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadRelatedData();
  }, [definition.id]);

  const loadRelatedData = async () => {
    console.log('🔄 Loading related data for definition ID:', definition.id);
    try {
      setLoading(true);

      try {
        console.log('📊 Querying dynamic_stage_metrics for process_definition_id:', definition.id);
        try {
          const { data: metricsData, error: metricsError } = await supabase
            .schema('workflow')
            .from('dynamic_stage_metrics')
            .select('*')
            .eq('process_definition_id', definition.id)
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
            console.log('ℹ️ No stage metrics found or access denied');
          }
        } catch (metricsAccessErr) {
          console.warn('⚠️ Stage metrics table not accessible (permission denied):', metricsAccessErr);
          // Continue without stage metrics
        }
      } catch (metricsErr) {
        console.warn('⚠️ Stage metrics not accessible:', metricsErr);
      }

      console.log('📊 Querying wf_workflows for workflow_definition_id:', definition.id);
      const { data: workflowsData, error: workflowsError } = await supabase
        .schema('workflow').from('wf_workflows')
        .select('*')
        .eq('workflow_definition_id', definition.id)
        .order('created_at', { ascending: false });

      console.log('📊 Related workflows query result:', { workflowsData, workflowsError });
      if (!workflowsError) {
        setRelatedWorkflows(workflowsData || []);
        console.log('✅ Related workflows loaded:', workflowsData?.length || 0, 'workflows');
      } else {
        console.error('❌ Error loading related workflows:', workflowsError);
      }
    } catch (err) {
      console.error('❌ Error loading related data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageMetric = (stageId: string) => {
    return stageMetrics?.metrics_data?.find(metric => metric.stage_id === stageId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`;
    }
    if (hours < 24) {
      return `${hours}h`;
    }
    return `${Math.round(hours / 24)}d`;
  };

  const getStatusCategoryColor = (category: string) => {
    switch (category) {
      case 'OPEN':
      case 'NEW':
        return 'blue';
      case 'IN_PROGRESS':
        return 'orange';
      case 'CLOSED_WON':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
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

  const tabItems = [
    {
      key: 'overview',
      label: (
        <Space>
          <EyeOutlined />
          Overview
        </Space>
      ),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Process Information">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Description</Text>
                  <Paragraph>{definition.description || 'No description provided'}</Paragraph>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Entity Type</Text>
                    <Paragraph>{definition.entity_schema}.{definition.entity_type}</Paragraph>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Process Type</Text>
                    <Paragraph>{definition.definitions?.processType || 'STATE_DRIVEN'}</Paragraph>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Version</Text>
                    <Paragraph>v{definition.version}</Paragraph>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Start Stage</Text>
                    <Paragraph>{definition.definitions?.startStateId || 'Not defined'}</Paragraph>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Quick Stats">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row align="middle">
                  <Col span={6}>
                    <BranchesOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                  </Col>
                  <Col span={18}>
                    <Text type="secondary">Stages</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                      {definition.definitions?.stages?.length || 0}
                    </div>
                  </Col>
                </Row>
                <Row align="middle">
                  <Col span={6}>
                    <ThunderboltOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                  </Col>
                  <Col span={18}>
                    <Text type="secondary">Transitions</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                      {definition.definitions?.transitions?.length || 0}
                    </div>
                  </Col>
                </Row>
                <Row align="middle">
                  <Col span={6}>
                    <ThunderboltOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                  </Col>
                  <Col span={18}>
                    <Text type="secondary">Automations</Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                      {relatedWorkflows.length}
                    </div>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'stages',
      label: (
        <Space>
          <BranchesOutlined />
          Stages
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={4}>Process Stages</Title>
          <Row gutter={[16, 16]}>
            {definition.definitions?.stages?.map((stage) => {
              const metric = getStageMetric(stage.id);
              return (
                <Col xs={24} key={stage.id}>
                  <Card>
                    <Row justify="space-between" align="top">
                      <Col flex="auto">
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Space wrap>
                            <Title level={5} style={{ margin: 0 }}>{stage.displayLabel}</Title>
                            <Tag>#{stage.sequence}</Tag>
                            <Tag color={getStatusCategoryColor(stage.systemStatusCategory)}>
                              {stage.systemStatusCategory}
                            </Tag>
                          </Space>
                          
                          {metric && (
                            <Row gutter={16}>
                              <Col xs={12} sm={6}>
                                <Space>
                                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                                  <div>
                                    <Text type="secondary">Est. Time</Text>
                                    <div style={{ fontWeight: 500 }}>{formatHours(metric.pertTime.mostLikelyHours)}</div>
                                  </div>
                                </Space>
                              </Col>
                              <Col xs={12} sm={6}>
                                <Space>
                                  <DollarOutlined style={{ color: '#52c41a' }} />
                                  <div>
                                    <Text type="secondary">Est. Cost</Text>
                                    <div style={{ fontWeight: 500 }}>{formatCurrency(metric.pertCost.mostLikelyUsd)}</div>
                                  </div>
                                </Space>
                              </Col>
                              <Col xs={12} sm={6}>
                                <Space>
                                  <TeamOutlined style={{ color: '#722ed1' }} />
                                  <div>
                                    <Text type="secondary">Skills</Text>
                                    <div style={{ fontWeight: 500 }}>{metric.requiredSkills.length}</div>
                                  </div>
                                </Space>
                              </Col>
                              <Col xs={12} sm={6}>
                                <Space>
                                  <SettingOutlined style={{ color: '#fa8c16' }} />
                                  <div>
                                    <Text type="secondary">Resources</Text>
                                    <div style={{ fontWeight: 500 }}>{metric.resourceRequirements.length}</div>
                                  </div>
                                </Space>
                              </Col>
                            </Row>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Space>
      ),
    },
    {
      key: 'transitions',
      label: (
        <Space>
          <ThunderboltOutlined />
          Transitions
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={4}>Process Transitions</Title>
          <Row gutter={[16, 16]}>
            {definition.definitions?.transitions?.map((transition) => (
              <Col xs={24} key={transition.id}>
                <Card>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Title level={5} style={{ margin: 0 }}>{transition.name}</Title>
                    <Space wrap>
                      <Text>From: <Text strong>{Array.isArray(transition.from) ? transition.from.join(', ') : transition.from}</Text></Text>
                      <Text>→</Text>
                      <Text>To: <Text strong>{transition.to}</Text></Text>
                    </Space>
                    
                    <Space wrap>
                      <Tag color={
                        transition.trigger === 'automatic' ? 'green' :
                        transition.trigger === 'manual' ? 'blue' :
                        transition.trigger === 'event' ? 'purple' :
                        transition.trigger === 'time_elapsed_in_state' ? 'orange' :
                        'default'
                      }>
                        {transition.trigger || 'manual'}
                      </Tag>
                      
                      {transition.timeThresholdHours && (
                        <Tag color="orange">
                          After {formatHours(transition.timeThresholdHours)}
                        </Tag>
                      )}
                    </Space>

                    {transition.condition && (
                      <Card size="small" style={{ background: '#fafafa' }}>
                        <Text type="secondary">Condition:</Text>
                        <Paragraph code style={{ margin: 0 }}>{transition.condition.rule}</Paragraph>
                      </Card>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Space>
      ),
    },
    {
      key: 'automations',
      label: (
        <Space>
          <ThunderboltOutlined />
          Automations
        </Space>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4}>Related Automations</Title>
            </Col>
            <Col>
              <Text type="secondary">{relatedWorkflows.length} automation(s)</Text>
            </Col>
          </Row>
          
          {relatedWorkflows.length > 0 ? (
            <Row gutter={[16, 16]}>
              {relatedWorkflows.map((workflow) => (
                <Col xs={24} key={workflow.id}>
                  <Card>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space wrap>
                        <Title level={5} style={{ margin: 0 }}>{workflow.name}</Title>
                        <Tag color={getTriggerTypeColor(workflow.trigger_type)}>
                          {workflow.trigger_type}
                        </Tag>
                        <Tag color={workflow.is_active ? 'success' : 'default'}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Tag>
                      </Space>
                      
                      <Paragraph>{workflow.description}</Paragraph>
                      
                      <Space wrap>
                        <Text type="secondary">Table: {workflow.trigger_table}</Text>
                        <Text type="secondary">Actions: {workflow.actions?.length || 0}</Text>
                        <Text type="secondary">Priority: {workflow.priority}</Text>
                      </Space>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              image={<ThunderboltOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                <div>
                  <Title level={4}>No Automations Configured</Title>
                  <Paragraph type="secondary">
                    No automated workflows are linked to this process definition
                  </Paragraph>
                </div>
              }
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
            />
            <div>
              <Title level={2} style={{ margin: 0 }}>{definition.name}</Title>
              <Space wrap style={{ marginTop: 8 }}>
                <Tag color="purple">
                  {definition.entity_schema}.{definition.entity_type}
                </Tag>
                <Tag color={definition.is_active ? 'success' : 'default'}>
                  {definition.is_active ? 'Active' : 'Inactive'}
                </Tag>
                {definition.type && (
                  <Tag color="blue">{definition.type}</Tag>
                )}
              </Space>
            </div>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
          >
            Edit Process
          </Button>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </Space>
  );
}