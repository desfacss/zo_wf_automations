import React, { useState } from 'react';
import { Tabs, Layout, Drawer } from 'antd';
import { ThunderboltOutlined, BranchesOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { AutomationDashboard } from './index';
import { WorkflowDefinitionsView } from './WorkflowDefinitionsView';
import { WorkflowLogsView } from './WorkflowLogsView';
import dayjs from 'dayjs';

const { Content } = Layout;

export function AutomationTabs() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<{ id: string; name: string } | null>(null);

  const openLogsView = (workflowId: string, workflowName: string) => {
    setSelectedWorkflow({ id: workflowId, name: workflowName });
    setLogsDrawerOpen(true);
  };

  const tabItems = [
    {
      key: 'workflows',
      label: (
        <span>
          <ThunderboltOutlined />
          Event Workflows
        </span>
      ),
      children: <AutomationDashboard onViewLogs={openLogsView} />,
    },
    {
      key: 'definitions',
      label: (
        <span>
          <BranchesOutlined />
          Process Definitions
        </span>
      ),
      children: <WorkflowDefinitionsView />,
    },
    {
      key: 'logs',
      label: (
        <span>
          <ClockCircleOutlined />
          Execution Logs
        </span>
      ),
      children: <WorkflowLogsView showAllLogs={true} />,
    },
  ];

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: 0 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            style={{ padding: '0 24px' }}
          />
        </Content>
      </Layout>

      <Drawer
        title={selectedWorkflow ? `Logs: ${selectedWorkflow.name}` : 'Workflow Logs'}
        width="80%"
        open={logsDrawerOpen}
        onClose={() => {
          setLogsDrawerOpen(false);
          setSelectedWorkflow(null);
        }}
        destroyOnClose
      >
        {selectedWorkflow && (
          <WorkflowLogsView
            workflowId={selectedWorkflow.id}
            workflowName={selectedWorkflow.name}
            onBack={() => {
              setLogsDrawerOpen(false);
              setSelectedWorkflow(null);
            }}
          />
        )}
      </Drawer>
    </>
  );
}