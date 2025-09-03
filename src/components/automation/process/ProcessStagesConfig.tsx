import React, { useState } from 'react';
import { Button, Space, Typography, Empty, Drawer, Card, Row, Col, Tag, Divider } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  BranchesOutlined, 
  ArrowRightOutlined, 
  ArrowUpOutlined,
  ArrowDownOutlined,
  StarOutlined
} from '@ant-design/icons';
import { StageConfigModal } from './StageConfigModal';
import { TransitionConfigModal } from './TransitionConfigModal';
import type { WorkflowDefinition, WorkflowStage, WorkflowTransition } from '../../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface ProcessStagesConfigProps {
  definition: Partial<WorkflowDefinition>;
  onUpdate: (definition: Partial<WorkflowDefinition>) => void;
}

export function ProcessStagesConfig({ definition, onUpdate }: ProcessStagesConfigProps) {
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);

  const stages = definition.definitions?.stages || [];
  const transitions = definition.definitions?.transitions || [];

  const addStage = () => {
    setEditingStage(null);
    setStageModalOpen(true);
  };

  const editStage = (stage: WorkflowStage) => {
    setEditingStage(stage);
    setStageModalOpen(true);
  };

  const addTransition = () => {
    setEditingTransition(null);
    setTransitionModalOpen(true);
  };

  const editTransition = (transition: WorkflowTransition) => {
    setEditingTransition(transition);
    setTransitionModalOpen(true);
  };

  const handleSaveStage = (stageData: WorkflowStage) => {
    const updatedStages = stages.find(s => s.id === stageData.id)
      ? stages.map(stage => stage.id === stageData.id ? stageData : stage)
      : [...stages, stageData];

    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions!,
        stages: updatedStages,
      },
    });

    setStageModalOpen(false);
    setEditingStage(null);
  };

  const handleSaveTransition = (transitionData: WorkflowTransition) => {
    const updatedTransitions = transitions.find(t => t.id === transitionData.id)
      ? transitions.map(transition => transition.id === transitionData.id ? transitionData : transition)
      : [...transitions, transitionData];

    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions!,
        transitions: updatedTransitions,
      },
    });

    setTransitionModalOpen(false);
    setEditingTransition(null);
  };

  const removeStage = (stageId: string) => {
    const updatedStages = stages.filter(stage => stage.id !== stageId);
    const updatedTransitions = transitions.filter(transition => 
      transition.from !== stageId && 
      transition.to !== stageId &&
      (!Array.isArray(transition.from) || !transition.from.includes(stageId))
    );

    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions!,
        stages: updatedStages,
        transitions: updatedTransitions,
      },
    });
  };

  const removeTransition = (transitionId: string) => {
    const updatedTransitions = transitions.filter(transition => transition.id !== transitionId);
    
    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions!,
        transitions: updatedTransitions,
      },
    });
  };

  const moveStage = (stageId: string, direction: 'up' | 'down') => {
    const currentIndex = stages.findIndex(stage => stage.id === stageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const newStages = [...stages];
    [newStages[currentIndex], newStages[newIndex]] = [newStages[newIndex], newStages[currentIndex]];
    
    const reorderedStages = newStages.map((stage, index) => ({
      ...stage,
      sequence: index + 1,
    }));
    
    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions!,
        stages: reorderedStages,
      },
    });
  };

  const setStartStage = (stageId: string) => {
    onUpdate({
      ...definition,
      definitions: {
        ...definition.definitions!,
        startStateId: stageId,
      },
    });
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
      {/* Stages Section */}
      <div>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Process Stages</Title>
            <Paragraph type="secondary">
              Define the stages that entities will progress through in this process
            </Paragraph>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addStage}
              size="large"
            >
              Add Stage
            </Button>
          </Col>
        </Row>

        {stages.length === 0 ? (
          <Empty
            image={<BranchesOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description={
              <div>
                <Title level={4}>No Stages Configured</Title>
                <Paragraph type="secondary">
                  Add stages to define the workflow progression
                </Paragraph>
              </div>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={addStage}>
              Add First Stage
            </Button>
          </Empty>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {stages.map((stage, index) => (
              <Card key={stage.id} size="small" hoverable>
                <Row align="middle" gutter={16}>
                  <Col flex="none">
                    <Space direction="vertical" size="small">
                      <Button
                        type="text"
                        icon={<ArrowUpOutlined />}
                        onClick={() => moveStage(stage.id, 'up')}
                        disabled={index === 0}
                        size="small"
                      />
                      <Button
                        type="text"
                        icon={<ArrowDownOutlined />}
                        onClick={() => moveStage(stage.id, 'down')}
                        disabled={index === stages.length - 1}
                        size="small"
                      />
                    </Space>
                  </Col>

                  <Col flex="none">
                    <div style={{
                      background: '#722ed1',
                      color: 'white',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 500
                    }}>
                      {stage.sequence}
                    </div>
                  </Col>

                  <Col flex="auto">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space wrap>
                        <Text strong style={{ fontSize: 16 }}>{stage.displayLabel}</Text>
                        <Tag color={getStatusCategoryColor(stage.systemStatusCategory)}>
                          {stage.systemStatusCategory}
                        </Tag>
                        {definition.definitions?.startStateId === stage.id && (
                          <Tag color="green" icon={<StarOutlined />}>
                            Start Stage
                          </Tag>
                        )}
                      </Space>
                      <Text type="secondary">{stage.name}</Text>
                    </Space>
                  </Col>

                  <Col flex="none">
                    <Space>
                      {definition.definitions?.startStateId !== stage.id && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => setStartStage(stage.id)}
                        >
                          Set as Start
                        </Button>
                      )}
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => editStage(stage)}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeStage(stage.id)}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </div>

      {/* Transitions Section */}
      <div>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Stage Transitions</Title>
            <Paragraph type="secondary">
              Define how entities move between stages
            </Paragraph>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addTransition}
              disabled={stages.length < 2}
              size="large"
            >
              Add Transition
            </Button>
          </Col>
        </Row>

        {transitions.length === 0 ? (
          <Empty
            image={<ArrowRightOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description={
              <div>
                <Title level={4}>No Transitions Configured</Title>
                <Paragraph type="secondary">
                  {stages.length < 2 
                    ? 'Add at least 2 stages before creating transitions'
                    : 'Add transitions to define how entities move between stages'
                  }
                </Paragraph>
              </div>
            }
          >
            {stages.length >= 2 && (
              <Button type="primary" icon={<PlusOutlined />} onClick={addTransition}>
                Add First Transition
              </Button>
            )}
          </Empty>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {transitions.map((transition) => (
              <Card key={transition.id} size="small" hoverable>
                <Row align="middle" gutter={16}>
                  <Col flex="auto">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space wrap>
                        <Text strong style={{ fontSize: 16 }}>{transition.name}</Text>
                        <Tag color={
                          transition.trigger === 'automatic' ? 'green' :
                          transition.trigger === 'manual' ? 'blue' :
                          transition.trigger === 'event' ? 'purple' :
                          transition.trigger === 'time_elapsed_in_state' ? 'orange' :
                          'default'
                        }>
                          {transition.trigger || 'manual'}
                        </Tag>
                      </Space>
                      <Space>
                        <Text type="secondary">
                          From: <Text strong>{Array.isArray(transition.from) ? transition.from.join(', ') : transition.from}</Text>
                        </Text>
                        <ArrowRightOutlined />
                        <Text type="secondary">
                          To: <Text strong>{transition.to}</Text>
                        </Text>
                        {transition.timeThresholdHours && (
                          <Tag color="orange">
                            After {transition.timeThresholdHours}h
                          </Tag>
                        )}
                      </Space>
                    </Space>
                  </Col>

                  <Col flex="none">
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => editTransition(transition)}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTransition(transition.id)}
                      />
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </div>

      {/* Process Flow Visualization */}
      {stages.length > 0 && (
        <Card title="Process Flow Preview" size="small">
          <Space wrap>
            {stages.map((stage, index) => (
              <React.Fragment key={stage.id}>
                <Tag
                  color={definition.definitions?.startStateId === stage.id ? 'green' : 'default'}
                  style={{ padding: '4px 8px', fontSize: 12 }}
                >
                  <Space size="small">
                    {definition.definitions?.startStateId === stage.id && <StarOutlined />}
                    <span>{stage.displayLabel}</span>
                    <Text type="secondary">#{stage.sequence}</Text>
                  </Space>
                </Tag>
                {index < stages.length - 1 && (
                  <ArrowRightOutlined style={{ color: '#8c8c8c' }} />
                )}
              </React.Fragment>
            ))}
          </Space>
        </Card>
      )}

      <Drawer
        title={editingStage ? 'Edit Stage' : 'Create New Stage'}
        width="60%"
        open={stageModalOpen}
        onClose={() => {
          setStageModalOpen(false);
          setEditingStage(null);
        }}
        destroyOnClose
      >
        <StageConfigModal
          isOpen={stageModalOpen}
          onClose={() => {
            setStageModalOpen(false);
            setEditingStage(null);
          }}
          onSave={handleSaveStage}
          stage={editingStage}
          existingStages={stages}
        />
      </Drawer>

      <Drawer
        title={editingTransition ? 'Edit Transition' : 'Create New Transition'}
        width="60%"
        open={transitionModalOpen}
        onClose={() => {
          setTransitionModalOpen(false);
          setEditingTransition(null);
        }}
        destroyOnClose
      >
        <TransitionConfigModal
          isOpen={transitionModalOpen}
          onClose={() => {
            setTransitionModalOpen(false);
            setEditingTransition(null);
          }}
          onSave={handleSaveTransition}
          transition={editingTransition}
          stages={stages}
        />
      </Drawer>
    </Space>
  );
}