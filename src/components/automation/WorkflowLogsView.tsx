import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Table, 
  Card, 
  Space, 
  Typography, 
  Tag, 
  Alert, 
  Row, 
  Col, 
  Select, 
  DatePicker, 
  Spin,
  Drawer,
  Tooltip
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EyeOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined, 
  FilterOutlined, 
  ReloadOutlined 
} from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { EventDetailsModal } from './EventDetailsModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface WorkflowLog {
  id: string;
  workflow_id: string;
  action_id: string;
  event_id: string;
  status: 'success' | 'failed' | 'pending' | 'running';
  execution_time: string;
  duration_ms: number | null;
  error_message: string | null;
  trigger_data: any;
  conditions_checked: any;
  actions_executed: any;
  context: any;
  retry_attempt: number;
  log_level: string;
  workflow_stage: string | null;
}

interface WorkflowLogsViewProps {
  workflowId?: string;
  workflowName?: string;
  onBack?: () => void;
  showAllLogs?: boolean;
}

export function WorkflowLogsView({ workflowId, workflowName, onBack, showAllLogs = false }: WorkflowLogsViewProps) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLog, setSelectedLog] = useState<WorkflowLog | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ]);
  const [includeUnknownActions, setIncludeUnknownActions] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [workflowId, statusFilter, dateRange, showAllLogs]);

  // Apply filtering logic to logs
  const filteredLogs = logs.filter(log => {
    // If includeUnknownActions is true, show all logs
    if (includeUnknownActions) {
      return true;
    }
    
    // Filter out logs with unknown actions
    const hasActionName = log.context?.action_name && log.context.action_name !== 'Unknown Action';
    const hasActionType = log.context?.action_type && log.context.action_type !== 'N/A';
    const hasWorkflowStage = log.workflow_stage && log.workflow_stage !== 'Unknown Action';
    
    return hasActionName || hasActionType || hasWorkflowStage;
  });

  const loadLogs = async () => {
    if (!user?.organization_id) return;

    console.log('🔄 Loading workflow logs with params:', {
      workflowId,
      showAllLogs,
      statusFilter,
      dateRange: dateRange.map(d => d.format('YYYY-MM-DD HH:mm:ss')),
      organization_id: user.organization_id
    });

    try {
      setLoading(true);
      setError('');

      let query = supabase
        .schema('workflow').from('wf_logs')
        .select('*')
        .eq('organization_id', user.organization_id);

      // Filter by specific workflow if provided
      if (!showAllLogs && workflowId) {
        console.log('📊 Adding workflow_id filter:', workflowId);
        query = query.eq('workflow_id', workflowId);
      }

      // Filter by status
      if (statusFilter !== 'all') {
        console.log('📊 Adding status filter:', statusFilter);
        query = query.eq('status', statusFilter);
      }

      // Filter by date range
      const startDate = dateRange[0].toISOString();
      const endDate = dateRange[1].toISOString();
      console.log('📊 Adding date range filter:', { startDate, endDate });
      query = query
        .gte('execution_time', startDate)
        .lte('execution_time', endDate);

      query = query.order('execution_time', { ascending: false });

      console.log('📊 Executing workflow logs query');
      const { data, error } = await query;

      console.log('📊 Workflow logs query result:', { 
        data: data ? `${data.length} logs` : 'null', 
        error 
      });

      if (error) throw error;
      setLogs(data || []);
      console.log('✅ Workflow logs loaded successfully:', data?.length || 0, 'logs');
    } catch (err: any) {
      console.error('❌ Error loading workflow logs:', err);
      setError(err.message || 'Failed to load workflow logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'running':
        return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#8c8c8c' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'warning';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const openDetailsModal = (log: WorkflowLog) => {
    setSelectedLog(log);
    setDetailsDrawerOpen(true);
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>
            {status.toUpperCase()}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Execution Time',
      dataIndex: 'execution_time',
      key: 'execution_time',
      width: 180,
      render: (time: string) => (
        <Text>{dayjs(time).format('MMM DD, HH:mm:ss')}</Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (record: WorkflowLog) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.context?.action_name || record.workflow_stage || 'Unknown Action'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.context?.action_type || record.log_level || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 100,
      render: (duration: number | null) => (
        <Text>{formatDuration(duration)}</Text>
      ),
    },
    {
      title: 'Retry',
      dataIndex: 'retry_attempt',
      key: 'retry_attempt',
      width: 80,
      render: (retry: number) => (
        <Text>{retry > 0 ? retry : '-'}</Text>
      ),
    },
    {
      title: 'Error',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      render: (error: string | null) => (
        error ? (
          <Tooltip title={error}>
            <Text type="danger" ellipsis style={{ maxWidth: 180 }}>
              {error}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (record: WorkflowLog) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetailsModal(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              {onBack && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={onBack}
                />
              )}
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {showAllLogs ? 'All Workflow Logs' : `Workflow Logs: ${workflowName}`}
                </Title>
                <Text type="secondary">
                  {showAllLogs 
                    ? 'View execution logs for all workflows in your organization'
                    : `Execution history for ${workflowName}`
                  }
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadLogs}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>

        {/* Filters */}
        <Card title={
          <Space>
            <FilterOutlined />
            <span>Filters</span>
          </Space>
        } size="small">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>Date Range</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    if (dates) {
                      setDateRange([
                        dates[0]!.startOf('day'),
                        dates[1]!.endOf('day')
                      ]);
                    }
                  }}
                  style={{ width: '100%' }}
                  showTime
                />
              </Space>
            </Col>
            
            <Col xs={24} sm={6}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>Status</Text>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="all">All Statuses</Select.Option>
                  <Select.Option value="success">Success</Select.Option>
                  <Select.Option value="failed">Failed</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                  <Select.Option value="running">Running</Select.Option>
                </Select>
              </Space>
            </Col>

            <Col xs={24} sm={10}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>Quick Filters</Text>
                <Space wrap>
                  <Button
                    size="small"
                    onClick={() => setDateRange([dayjs().startOf('day'), dayjs().endOf('day')])}
                  >
                    Today
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setDateRange([dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')])}
                  >
                    Yesterday
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setDateRange([dayjs().subtract(7, 'days').startOf('day'), dayjs().endOf('day')])}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setStatusFilter('failed')}
                    danger={statusFilter === 'failed'}
                  >
                    Failed Only
                  </Button>
                </Space>
              </Space>
            </Col>

            <Col xs={24} sm={10}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>Display Options</Text>
                <Space wrap>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={includeUnknownActions}
                      onChange={(e) => setIncludeUnknownActions(e.target.checked)}
                    />
                    <Text>Include unknown actions</Text>
                  </label>
                </Space>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Error Loading Logs"
            description={error}
            type="error"
            closable
            onClose={() => setError('')}
          />
        )}

        {/* Logs Table */}
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              <span>Execution Logs</span>
              <Text type="secondary">({logs.length} entries)</Text>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredLogs}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} logs${logs.length !== filteredLogs.length ? ` (${logs.length} total)` : ''}`,
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <ClockCircleOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
                  <Title level={4}>No Logs Found</Title>
                  <Text type="secondary">
                    {statusFilter === 'all' 
                      ? 'No workflow executions found for the selected date range'
                      : `No logs found with status: ${statusFilter}`
                    }
                  </Text>
                </div>
              )
            }}
          />
        </Card>
      </Space>

      {/* Event Details Drawer */}
      <Drawer
        title={selectedLog ? `Log Details: ${selectedLog.id.substring(0, 8)}...` : 'Log Details'}
        width="80%"
        open={detailsDrawerOpen}
        onClose={() => {
          setDetailsDrawerOpen(false);
          setSelectedLog(null);
        }}
        destroyOnClose
      >
        {selectedLog && (
          <EventDetailsModal
            log={selectedLog}
            isOpen={detailsDrawerOpen}
            onClose={() => {
              setDetailsDrawerOpen(false);
              setSelectedLog(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}