import React, { useState } from 'react';
import { X, Clock, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight, Copy } from 'lucide-react';

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

interface EventDetailsModalProps {
  log: WorkflowLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailsModal({ log, isOpen, onClose }: EventDetailsModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  if (!isOpen || !log) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const JsonViewer = ({ data, title }: { data: any; title: string }) => {
    if (!data) return <p className="text-gray-500 italic">No data available</p>;

    const jsonString = JSON.stringify(data, null, 2);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <button
            onClick={() => copyToClipboard(jsonString)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
          <code className="text-gray-800">{jsonString}</code>
        </pre>
      </div>
    );
  };

  const CollapsibleSection = ({ 
    id, 
    title, 
    children, 
    defaultExpanded = false 
  }: { 
    id: string; 
    title: string; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
        >
          <h3 className="font-medium text-gray-900">{title}</h3>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="p-4 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(log.status)}
              <div>
                <h2 className="text-xl font-semibold">
                  Log Details: {log.id.substring(0, 8)}...
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(log.status)}`}>
                    {log.status.toUpperCase()}
                  </span>
                  <span className="text-gray-200 text-sm">
                    {formatTimestamp(log.execution_time)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Summary Section */}
            <CollapsibleSection id="summary" title="Summary" defaultExpanded>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Execution Time</label>
                    <p className="text-gray-900">{formatTimestamp(log.execution_time)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <p className="text-gray-900">{formatDuration(log.duration_ms)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Retry Attempt</label>
                    <p className="text-gray-900">{log.retry_attempt > 0 ? log.retry_attempt : 'None'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Action Name</label>
                    <p className="text-gray-900">{log.context?.action_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Action Type</label>
                    <p className="text-gray-900">{log.context?.action_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Log Level</label>
                    <p className="text-gray-900">{log.log_level}</p>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Error Message */}
            {log.error_message && (
              <CollapsibleSection id="error" title="Error Message" defaultExpanded>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-mono text-sm">{log.error_message}</p>
                </div>
              </CollapsibleSection>
            )}

            {/* Trigger Data */}
            <CollapsibleSection id="trigger" title="Trigger Data">
              <JsonViewer data={log.trigger_data} title="Event Data" />
              {log.trigger_data?.new && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Key Changes</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm">
                      <p><strong>Entity:</strong> {log.trigger_data.trigger_table}</p>
                      <p><strong>Type:</strong> {log.trigger_data.trigger_type}</p>
                      {log.trigger_data.changes && log.trigger_data.changes.length > 0 && (
                        <div className="mt-2">
                          <p><strong>Changed Fields:</strong></p>
                          <ul className="list-disc list-inside ml-2">
                            {log.trigger_data.changes.map((change: any, index: number) => (
                              <li key={index} className="text-xs">
                                {change.path}: {JSON.stringify(change.old)} → {JSON.stringify(change.new)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* Conditions Checked */}
            {log.conditions_checked && (
              <CollapsibleSection id="conditions" title="Conditions Checked">
                <JsonViewer data={log.conditions_checked} title="Condition Results" />
              </CollapsibleSection>
            )}

            {/* Actions Executed */}
            {log.actions_executed && (
              <CollapsibleSection id="actions" title="Actions Executed">
                <JsonViewer data={log.actions_executed} title="Action Configuration" />
                
                {/* Special handling for email actions */}
                {log.context?.action_type === 'send_email' && log.actions_executed && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-900 mb-2">Email Details</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      {log.actions_executed.to && (
                        <p><strong>To:</strong> {log.actions_executed.to}</p>
                      )}
                      {log.actions_executed.templateId && (
                        <p><strong>Template:</strong> {log.actions_executed.templateId}</p>
                      )}
                      {log.actions_executed._ccTeamName && (
                        <p><strong>CC Team:</strong> {log.actions_executed._ccTeamName}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Special handling for assign_owner actions */}
                {log.context?.action_type === 'assign_owner' && log.actions_executed && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-900 mb-2">Assignment Details</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      {log.actions_executed.field && (
                        <p><strong>Field:</strong> {log.actions_executed.field}</p>
                      )}
                      {log.actions_executed.assignmentRule && (
                        <p><strong>Rule:</strong> {log.actions_executed.assignmentRule}</p>
                      )}
                      {log.actions_executed.userGroupId && (
                        <p><strong>Team ID:</strong> {log.actions_executed.userGroupId}</p>
                      )}
                    </div>
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Raw Log Data */}
            <CollapsibleSection id="raw" title="Raw Log Data">
              <JsonViewer data={log} title="Complete Log Entry" />
            </CollapsibleSection>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Log ID: <code className="bg-gray-200 px-2 py-1 rounded">{log.id}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}