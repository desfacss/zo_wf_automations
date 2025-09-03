// import React, { useState } from 'react';
// import { Button, Card, Row, Col, Typography, Space, Tag, Empty, Drawer } from 'antd';
// import { 
//   PlusOutlined, 
//   DeleteOutlined, 
//   EditOutlined, 
//   MailOutlined, 
//   UserSwitchOutlined, 
//   TagOutlined, 
//   ThunderboltOutlined, 
//   DatabaseOutlined, 
//   BranchesOutlined, 
//   ArrowUpOutlined,
//   ArrowDownOutlined
// } from '@ant-design/icons';
// import { ActionConfigModal } from './ActionConfigModal';
// import ActionConfigModal from './ActionConfigModal';
// import type { WorkflowAction, WorkflowRule, ViewConfig, EmailTemplate, Team } from '../../lib/types';

// const { Title, Paragraph, Text } = Typography;

// interface WorkflowActionsProps {
//   actions: WorkflowAction[];
//   onUpdate: (actions: WorkflowAction[]) => void;
//   workflow: Partial<WorkflowRule>;
//   availableTables: ViewConfig[];
//   emailTemplates: EmailTemplate[];
//   teams: Team[];
// }

// export function WorkflowActions({ 
//   actions, 
//   onUpdate, 
//   workflow, 
//   availableTables, 
//   emailTemplates, 
//   teams 
// }: WorkflowActionsProps) {
//   const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);

//   const actionTypes = [
//     { value: 'send_email', label: 'Send Email', description: 'Send an email notification', icon: MailOutlined, color: 'blue' },
//     { value: 'assign_owner', label: 'Assign Owner', description: 'Assign record to a user or team', icon: UserSwitchOutlined, color: 'green' },
//     { value: 'update_fields', label: 'Update Fields', description: 'Update specific fields in the record', icon: EditOutlined, color: 'purple' },
//     { value: 'add_tags', label: 'Add Tags', description: 'Add tags to the record', icon: TagOutlined, color: 'orange' },
//     { value: 'create_activity', label: 'Create Activity', description: 'Create a follow-up activity', icon: ThunderboltOutlined, color: 'cyan' },
//     { value: 'create_record', label: 'Create Record', description: 'Create a new record in another table', icon: DatabaseOutlined, color: 'geekblue' },
//     { value: 'trigger_workflow_event', label: 'Trigger Workflow', description: 'Trigger another workflow', icon: BranchesOutlined, color: 'magenta' },
//   ];

//   const getActionTypeInfo = (type: string) => {
//     return actionTypes.find(at => at.value === type) || actionTypes[0];
//   };

//   const handleAddAction = () => {
//     setEditingAction(null);
//     setDrawerOpen(true);
//   };

//   const handleEditAction = (action: WorkflowAction) => {
//     setEditingAction(action);
//     setDrawerOpen(true);
//   };

//   const handleSaveAction = (actionData: Partial<WorkflowAction>) => {
//     const editingActionExists = actionData.id && actionData.id.startsWith('temp-') ? null : 
//       actions.find(a => a.id === actionData.id);
    
//     if (editingActionExists) {
//       const updatedActions = actions.map(action => 
//         action.id === editingActionExists.id ? { ...action, ...actionData } : action
//       );
//       onUpdate(updatedActions);
//     } else {
//       const newAction: WorkflowAction = {
//         action_type: actionData.action_type!,
//         configuration: actionData.configuration || {},
//         action_order: actions.length + 1,
//         retry_count: 0,
//         max_retries: 3,
//         is_enabled: true,
//         organization_id: workflow.organization_id!,
//         name: actionData.name || `${actionData.action_type} Action`,
//         ...actionData,
//       };
//       onUpdate([...actions, newAction]);
//     }
//     setDrawerOpen(false);
//     setEditingAction(null);
//   };

//   const removeAction = (actionId: string) => {
//     const updatedActions = actions
//       .filter(action => action.id !== actionId)
//       .map((action, index) => ({ ...action, action_order: index + 1 }));
//     onUpdate(updatedActions);
//   };

//   const moveAction = (actionId: string, direction: 'up' | 'down') => {
//     const currentIndex = actions.findIndex(action => action.id === actionId);
//     if (currentIndex === -1) return;

//     const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
//     if (newIndex < 0 || newIndex >= actions.length) return;

//     const newActions = [...actions];
//     [newActions[currentIndex], newActions[newIndex]] = [newActions[newIndex], newActions[currentIndex]];
    
//     const reorderedActions = newActions.map((action, index) => ({
//       ...action,
//       action_order: index + 1,
//     }));
    
//     onUpdate(reorderedActions);
//   };

//   return (
//     <Space direction="vertical" size="large" style={{ width: '100%' }}>
//       <Row justify="space-between" align="middle">
//         <Col>
//           <Title level={4} style={{ margin: 0 }}>Workflow Actions</Title>
//           <Text type="secondary">
//             Define what happens when this workflow triggers. Actions run in order.
//           </Text>
//         </Col>
//         <Col>
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={handleAddAction}
//           >
//             Add Action
//           </Button>
//         </Col>
//       </Row>

//       {actions.length === 0 ? (
//         <Empty
//           image={<ThunderboltOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
//           description={
//             <div>
//               <Title level={4}>No Actions Configured</Title>
//               <Paragraph type="secondary">
//                 Add actions to define what happens when this workflow triggers
//               </Paragraph>
//             </div>
//           }
//         >
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={handleAddAction}
//           >
//             Add First Action
//           </Button>
//         </Empty>
//       ) : (
//         <Space direction="vertical" size="middle" style={{ width: '100%' }}>
//           {actions.map((action, index) => {
//             const actionInfo = getActionTypeInfo(action.action_type);
//             const Icon = actionInfo.icon;
            
//             return (
//               <Card key={action.id} size="small" hoverable>
//                 <Row align="middle" gutter={16}>
//                   <Col flex="none">
//                     <Space direction="vertical" size="small">
//                       <Button
//                         type="text"
//                         icon={<ArrowUpOutlined />}
//                         onClick={() => moveAction(action.id!, 'up')}
//                         disabled={index === 0}
//                         size="small"
//                       />
//                       <Button
//                         type="text"
//                         icon={<ArrowDownOutlined />}
//                         onClick={() => moveAction(action.id!, 'down')}
//                         disabled={index === actions.length - 1}
//                         size="small"
//                       />
//                     </Space>
//                   </Col>

//                   <Col flex="none">
//                     <div style={{
//                       background: '#f0f0f0',
//                       color: '#666',
//                       width: 32,
//                       height: 32,
//                       borderRadius: '50%',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       fontSize: 14,
//                       fontWeight: 500
//                     }}>
//                       {action.action_order}
//                     </div>
//                   </Col>

//                   <Col flex="none">
//                     <div style={{
//                       width: 40,
//                       height: 40,
//                       borderRadius: 8,
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       background: `var(--ant-color-${actionInfo.color}-1)`
//                     }}>
//                       <Icon style={{ fontSize: 20, color: `var(--ant-color-${actionInfo.color}-6)` }} />
//                     </div>
//                   </Col>

//                   <Col flex="auto">
//                     <Space direction="vertical" size="small" style={{ width: '100%' }}>
//                       <Space wrap>
//                         <Text strong style={{ fontSize: 16 }}>{action.name}</Text>
//                         <Tag color={actionInfo.color}>
//                           {actionInfo.label}
//                         </Tag>
//                         {!action.is_enabled && (
//                           <Tag>Disabled</Tag>
//                         )}
//                       </Space>
//                       <Text type="secondary">{actionInfo.description}</Text>
                      
//                       {/* Configuration Preview */}
//                       <div>
//                         {action.action_type === 'send_email' && action.configuration.templateId && (
//                           <Text type="secondary" style={{ fontSize: 12 }}>
//                             Template: {action.configuration.templateId}
//                           </Text>
//                         )}
//                         {action.action_type === 'assign_owner' && action.configuration.field && (
//                           <Text type="secondary" style={{ fontSize: 12 }}>
//                             Field: {action.configuration.field}
//                           </Text>
//                         )}
//                       </div>
//                     </Space>
//                   </Col>

//                   <Col flex="none">
//                     <Space>
//                       <Button
//                         type="text"
//                         icon={<EditOutlined />}
//                         onClick={() => handleEditAction(action)}
//                       />
//                       <Button
//                         type="text"
//                         danger
//                         icon={<DeleteOutlined />}
//                         onClick={() => removeAction(action.id!)}
//                       />
//                     </Space>
//                   </Col>
//                 </Row>
//               </Card>
//             );
//           })}
//         </Space>
//       )}

//       <Drawer
//         title={editingAction ? 'Edit Action' : 'Create New Action'}
//         width="60%"
//         open={drawerOpen}
//         onClose={() => {
//           setDrawerOpen(false);
//           setEditingAction(null);
//         }}
//         destroyOnClose
//       >
//         <ActionConfigModal
//           visible={drawerOpen}
//           onClose={() => {
//             setDrawerOpen(false);
//             setEditingAction(null);
//           }}
//           onSave={handleSaveAction}
//           action={editingAction}
//           workflow={workflow}
//           availableTables={availableTables}
//           emailTemplates={emailTemplates}
//           teams={teams}
//         />
//       </Drawer>
//     </Space>
//   );
// }



import React, { useState } from 'react';
import { Button, Card, Row, Col, Typography, Space, Tag, Empty, Drawer } from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  MailOutlined, 
  UserSwitchOutlined, 
  TagOutlined, 
  ThunderboltOutlined, 
  DatabaseOutlined, 
  BranchesOutlined, 
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import ActionConfigModal from './ActionConfigModal';
import type { WorkflowAction, WorkflowRule, ViewConfig, EmailTemplate, Team } from '../../lib/types';

const { Title, Paragraph, Text } = Typography;

interface WorkflowActionsProps {
  actions: WorkflowAction[];
  onUpdate: (actions: WorkflowAction[]) => void;
  workflow: Partial<WorkflowRule>;
  availableTables: ViewConfig[];
  emailTemplates: EmailTemplate[];
  teams: Team[];
}

export function WorkflowActions({ 
  actions, 
  onUpdate, 
  workflow, 
  availableTables, 
  emailTemplates, 
  teams 
}: WorkflowActionsProps) {
  const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const actionTypes = [
    { value: 'send_email', label: 'Send Email', description: 'Send an email notification', icon: MailOutlined, color: 'blue' },
    { value: 'assign_owner', label: 'Assign Owner', description: 'Assign record to a user or team', icon: UserSwitchOutlined, color: 'green' },
    { value: 'update_fields', label: 'Update Fields', description: 'Update specific fields in the record', icon: EditOutlined, color: 'purple' },
    { value: 'add_tags', label: 'Add Tags', description: 'Add tags to the record', icon: TagOutlined, color: 'orange' },
    { value: 'create_activity', label: 'Create Activity', description: 'Create a follow-up activity', icon: ThunderboltOutlined, color: 'cyan' },
    { value: 'create_record', label: 'Create Record', description: 'Create a new record in another table', icon: DatabaseOutlined, color: 'geekblue' },
    { value: 'trigger_workflow_event', label: 'Trigger Workflow', description: 'Trigger another workflow', icon: BranchesOutlined, color: 'magenta' },
  ];

  const getActionTypeInfo = (type: string) => {
    return actionTypes.find(at => at.value === type) || actionTypes[0];
  };

  const handleAddAction = () => {
    setEditingAction(null);
    setDrawerOpen(true);
  };

  const handleEditAction = (action: WorkflowAction) => {
    setEditingAction(action);
    setDrawerOpen(true);
  };

  const handleSaveAction = (actionData: Partial<WorkflowAction>) => {
    // Check if the action being saved already exists
    const existingActionIndex = actions.findIndex(a => a.id === actionData.id);

    if (existingActionIndex !== -1) {
      // Update existing action
      const updatedActions = [...actions];
      updatedActions[existingActionIndex] = { ...updatedActions[existingActionIndex], ...actionData };
      onUpdate(updatedActions);
    } else {
      // Create new action
      const newAction: WorkflowAction = {
        id: `temp-${Date.now()}`, // Assign a temporary ID for new actions
        action_type: actionData.action_type!,
        configuration: actionData.configuration || {},
        action_order: actions.length + 1,
        retry_count: 0,
        max_retries: 3,
        is_enabled: true,
        organization_id: workflow.organization_id!,
        name: actionData.name || `${getActionTypeInfo(actionData.action_type!).label} Action`,
        ...actionData,
      };
      onUpdate([...actions, newAction]);
    }
    setDrawerOpen(false);
    setEditingAction(null);
  };

  const removeAction = (actionId: string) => {
    const updatedActions = actions
      .filter(action => action.id !== actionId)
      .map((action, index) => ({ ...action, action_order: index + 1 }));
    onUpdate(updatedActions);
  };

  const moveAction = (actionId: string, direction: 'up' | 'down') => {
    const newActions = [...actions];
    const currentIndex = newActions.findIndex(action => action.id === actionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= newActions.length) return;

    [newActions[currentIndex], newActions[newIndex]] = [newActions[newIndex], newActions[currentIndex]];
    
    const reorderedActions = newActions.map((action, index) => ({
      ...action,
      action_order: index + 1,
    }));
    
    onUpdate(reorderedActions);
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>Workflow Actions</Title>
          <Text type="secondary">
            Define what happens when this workflow triggers. Actions run in order.
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAction}
          >
            Add Action
          </Button>
        </Col>
      </Row>

      {actions.length === 0 ? (
        <Empty
          image={<ThunderboltOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>No Actions Configured</Title>
              <Paragraph type="secondary">
                Add actions to define what happens when this workflow triggers
              </Paragraph>
            </div>
          }
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAction}
          >
            Add First Action
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {actions
            .sort((a, b) => (a.action_order || 0) - (b.action_order || 0))
            .map((action, index) => {
              const actionInfo = getActionTypeInfo(action.action_type);
              const Icon = actionInfo.icon;
              
              return (
                <Card key={action.id} size="small" hoverable>
                  <Row align="middle" gutter={16}>
                    <Col flex="none">
                      <Space direction="vertical" size="small">
                        <Button
                          type="text"
                          icon={<ArrowUpOutlined />}
                          onClick={() => moveAction(action.id!, 'up')}
                          disabled={index === 0}
                          size="small"
                        />
                        <Button
                          type="text"
                          icon={<ArrowDownOutlined />}
                          onClick={() => moveAction(action.id!, 'down')}
                          disabled={index === actions.length - 1}
                          size="small"
                        />
                      </Space>
                    </Col>

                    <Col flex="none">
                      <div style={{
                        background: '#f0f0f0',
                        color: '#666',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 500
                      }}>
                        {action.action_order}
                      </div>
                    </Col>

                    <Col flex="none">
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `var(--ant-color-${actionInfo.color}-1)`
                      }}>
                        <Icon style={{ fontSize: 20, color: `var(--ant-color-${actionInfo.color}-6)` }} />
                      </div>
                    </Col>

                    <Col flex="auto">
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space wrap>
                          <Text strong style={{ fontSize: 16 }}>{action.name}</Text>
                          <Tag color={actionInfo.color}>
                            {actionInfo.label}
                          </Tag>
                          {!action.is_enabled && (
                            <Tag>Disabled</Tag>
                          )}
                        </Space>
                        <Text type="secondary">{actionInfo.description}</Text>
                        
                        {/* Configuration Preview */}
                        <div>
                          {action.action_type === 'send_email' && action.configuration.templateId && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Template: {emailTemplates.find(t => t.id === action.configuration.templateId)?.name || action.configuration.templateId}
                            </Text>
                          )}
                          {action.action_type === 'assign_owner' && action.configuration.field && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Field: {action.configuration.field}
                            </Text>
                          )}
                        </div>
                      </Space>
                    </Col>

                    <Col flex="none">
                      <Space>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEditAction(action)}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeAction(action.id!)}
                        />
                      </Space>
                    </Col>
                  </Row>
                </Card>
              );
            })}
        </Space>
      )}

      <Drawer
        title={editingAction ? 'Edit Action' : 'Create New Action'}
        width="60%"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingAction(null);
        }}
        destroyOnClose
      >
        <ActionConfigModal
          visible={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingAction(null);
          }}
          onSave={handleSaveAction}
          action={editingAction}
          workflow={workflow}
          availableTables={availableTables}
          emailTemplates={emailTemplates}
          teams={teams}
        />
      </Drawer>
    </Space>
  );
}