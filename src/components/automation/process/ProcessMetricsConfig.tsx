import React from 'react';
import { Card, Row, Col, Typography, Space, InputNumber, Tag, Button, Empty } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, DollarOutlined, TeamOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import type { WorkflowDefinition, StageMetrics, StageMetric } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface ProcessMetricsConfigProps {
  definition: Partial<WorkflowDefinition>;
  stageMetrics: Partial<StageMetrics>;
  onUpdate: (metrics: Partial<StageMetrics>) => void;
}

export function ProcessMetricsConfig({ definition, stageMetrics, onUpdate }: ProcessMetricsConfigProps) {
  const stages = definition.definitions?.stages || [];
  const metricsData = stageMetrics.metrics_data || [];

  const updateStageMetric = (stageId: string, updates: Partial<StageMetric>) => {
    const existingIndex = metricsData.findIndex(metric => metric.stage_id === stageId);
    
    if (existingIndex >= 0) {
      const updatedMetrics = [...metricsData];
      updatedMetrics[existingIndex] = { ...updatedMetrics[existingIndex], ...updates };
      onUpdate({ ...stageMetrics, metrics_data: updatedMetrics });
    } else {
      const newMetric: StageMetric = {
        stage_id: stageId,
        pertTime: {
          optimisticHours: 0.1,
          mostLikelyHours: 1,
          pessimisticHours: 4,
        },
        pertCost: {
          optimisticUsd: 5,
          mostLikelyUsd: 20,
          pessimisticUsd: 50,
        },
        aspirationalMetrics: {
          targetTimeHours: 0.5,
          targetCostUsd: 15,
        },
        requiredSkills: [],
        resourceRequirements: [],
        ...updates,
      };
      onUpdate({ ...stageMetrics, metrics_data: [...metricsData, newMetric] });
    }
  };

  const getStageMetric = (stageId: string): StageMetric | undefined => {
    return metricsData.find(metric => metric.stage_id === stageId);
  };

  const addSkill = (stageId: string, skill: string) => {
    const metric = getStageMetric(stageId);
    if (metric && skill.trim() && !metric.requiredSkills.includes(skill.trim())) {
      updateStageMetric(stageId, {
        requiredSkills: [...metric.requiredSkills, skill.trim()],
      });
    }
  };

  const removeSkill = (stageId: string, skillToRemove: string) => {
    const metric = getStageMetric(stageId);
    if (metric) {
      updateStageMetric(stageId, {
        requiredSkills: metric.requiredSkills.filter(skill => skill !== skillToRemove),
      });
    }
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3}>Stage Metrics Configuration</Title>
        <Paragraph type="secondary">
          Define time and cost estimates, required skills, and resource requirements for each stage
        </Paragraph>
      </div>

      {stages.length === 0 ? (
        <Empty
          image={<BarChartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>No Stages Available</Title>
              <Paragraph type="secondary">
                Configure stages in the previous step before setting up metrics
              </Paragraph>
            </div>
          }
        />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {stages.map((stage) => {
            const metric = getStageMetric(stage.id) || {
              stage_id: stage.id,
              pertTime: { optimisticHours: 0.1, mostLikelyHours: 1, pessimisticHours: 4 },
              pertCost: { optimisticUsd: 5, mostLikelyUsd: 20, pessimisticUsd: 50 },
              aspirationalMetrics: { targetTimeHours: 0.5, targetCostUsd: 15 },
              requiredSkills: [],
              resourceRequirements: [],
            };

            return (
              <Card key={stage.id} title={
                <Space>
                  <Text strong style={{ fontSize: 18 }}>{stage.displayLabel}</Text>
                  <Tag color={getStatusCategoryColor(stage.systemStatusCategory)}>
                    {stage.systemStatusCategory}
                  </Tag>
                </Space>
              }>
                <Row gutter={[24, 24]}>
                  {/* Time Estimates */}
                  <Col xs={24} lg={12}>
                    <Card size="small" title={
                      <Space>
                        <ClockCircleOutlined />
                        <span>Time Estimates (Hours)</span>
                      </Space>
                    }>
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Text type="secondary">Optimistic</Text>
                          <InputNumber
                            value={metric.pertTime.optimisticHours}
                            onChange={(value) => updateStageMetric(stage.id, {
                              pertTime: { ...metric.pertTime, optimisticHours: value || 0 }
                            })}
                            min={0}
                            step={0.1}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Most Likely</Text>
                          <InputNumber
                            value={metric.pertTime.mostLikelyHours}
                            onChange={(value) => updateStageMetric(stage.id, {
                              pertTime: { ...metric.pertTime, mostLikelyHours: value || 0 }
                            })}
                            min={0}
                            step={0.1}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Pessimistic</Text>
                          <InputNumber
                            value={metric.pertTime.pessimisticHours}
                            onChange={(value) => updateStageMetric(stage.id, {
                              pertTime: { ...metric.pertTime, pessimisticHours: value || 0 }
                            })}
                            min={0}
                            step={0.1}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Target</Text>
                          <InputNumber
                            value={metric.aspirationalMetrics.targetTimeHours}
                            onChange={(value) => updateStageMetric(stage.id, {
                              aspirationalMetrics: { ...metric.aspirationalMetrics, targetTimeHours: value || 0 }
                            })}
                            min={0}
                            step={0.1}
                            style={{ width: '100%', borderColor: '#52c41a' }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  {/* Cost Estimates */}
                  <Col xs={24} lg={12}>
                    <Card size="small" title={
                      <Space>
                        <DollarOutlined />
                        <span>Cost Estimates (USD)</span>
                      </Space>
                    }>
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Text type="secondary">Optimistic</Text>
                          <InputNumber
                            value={metric.pertCost.optimisticUsd}
                            onChange={(value) => updateStageMetric(stage.id, {
                              pertCost: { ...metric.pertCost, optimisticUsd: value || 0 }
                            })}
                            min={0}
                            step={0.01}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Most Likely</Text>
                          <InputNumber
                            value={metric.pertCost.mostLikelyUsd}
                            onChange={(value) => updateStageMetric(stage.id, {
                              pertCost: { ...metric.pertCost, mostLikelyUsd: value || 0 }
                            })}
                            min={0}
                            step={0.01}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Pessimistic</Text>
                          <InputNumber
                            value={metric.pertCost.pessimisticUsd}
                            onChange={(value) => updateStageMetric(stage.id, {
                              pertCost: { ...metric.pertCost, pessimisticUsd: value || 0 }
                            })}
                            min={0}
                            step={0.01}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col span={12}>
                          <Text type="secondary">Target</Text>
                          <InputNumber
                            value={metric.aspirationalMetrics.targetCostUsd}
                            onChange={(value) => updateStageMetric(stage.id, {
                              aspirationalMetrics: { ...metric.aspirationalMetrics, targetCostUsd: value || 0 }
                            })}
                            min={0}
                            step={0.01}
                            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                            style={{ width: '100%', borderColor: '#52c41a' }}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>

                {/* Skills and Resources */}
                <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} lg={12}>
                    <Card size="small" title={
                      <Space>
                        <TeamOutlined />
                        <span>Required Skills</span>
                      </Space>
                    }>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space wrap>
                          {metric.requiredSkills.map((skill) => (
                            <Tag
                              key={skill}
                              closable
                              onClose={() => removeSkill(stage.id, skill)}
                              color="blue"
                            >
                              {skill}
                            </Tag>
                          ))}
                        </Space>
                        <input
                          type="text"
                          placeholder="Add skill and press Enter"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addSkill(stage.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card size="small" title={
                      <Space>
                        <SettingOutlined />
                        <span>Resource Requirements</span>
                      </Space>
                    }>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {metric.resourceRequirements.map((resource, index) => (
                          <Card key={index} size="small" style={{ background: '#fafafa' }}>
                            <Row justify="space-between" align="middle">
                              <Col>
                                <Space>
                                  <Tag color={resource.type === 'worker' ? 'green' : 'orange'}>
                                    {resource.type}
                                  </Tag>
                                  <Text>{resource.skills.join(', ')}</Text>
                                </Space>
                              </Col>
                              <Col>
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={() => {
                                    const updatedRequirements = [...metric.resourceRequirements];
                                    updatedRequirements.splice(index, 1);
                                    updateStageMetric(stage.id, {
                                      resourceRequirements: updatedRequirements,
                                    });
                                  }}
                                />
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const updatedRequirements = [...metric.resourceRequirements, {
                                type: e.target.value as 'worker' | 'system',
                                skills: ['general']
                              }];
                              updateStageMetric(stage.id, {
                                resourceRequirements: updatedRequirements,
                              });
                              e.target.value = '';
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Add resource type</option>
                          <option value="worker">Worker</option>
                          <option value="system">System</option>
                        </select>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Space>
      )}

      {/* Summary */}
      {stages.length > 0 && metricsData.length > 0 && (
        <Card title="Process Summary" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {metricsData.reduce((sum, metric) => sum + metric.pertTime.mostLikelyHours, 0).toFixed(1)}h
                </div>
                <Text type="secondary">Total Est. Time</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  ${metricsData.reduce((sum, metric) => sum + metric.pertCost.mostLikelyUsd, 0).toFixed(0)}
                </div>
                <Text type="secondary">Total Est. Cost</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                  {metricsData.reduce((sum, metric) => sum + metric.aspirationalMetrics.targetTimeHours, 0).toFixed(1)}h
                </div>
                <Text type="secondary">Target Time</Text>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                  ${metricsData.reduce((sum, metric) => sum + metric.aspirationalMetrics.targetCostUsd, 0).toFixed(0)}
                </div>
                <Text type="secondary">Target Cost</Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}
    </Space>
  );
}