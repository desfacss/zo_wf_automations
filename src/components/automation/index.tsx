import React, { useState, useEffect } from 'react';
import { Plus, Settings, Zap, Play, Pause, Edit, Trash2, Eye, Activity, Clock } from 'lucide-react';
import { WorkflowWizard } from './WorkflowWizard';
import { WorkflowLogsView } from './WorkflowLogsView';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { WorkflowRule } from '../../lib/types';

export function AutomationDashboard() {
  const { user } = useAuthStore();
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | undefined>();
  const [viewingLogsWorkflow, setViewingLogsWorkflow] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, [user]);

  const loadWorkflows = async () => {
    if (!user?.organization_id) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (workflowId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', workflowId);

      if (error) throw error;
      await loadWorkflows();
    } catch (err: any) {
      setError(err.message || 'Failed to update workflow status');
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;
      await loadWorkflows();
    } catch (err: any) {
      setError(err.message || 'Failed to delete workflow');
    }
  };

  const openEditWizard = (workflowId: string) => {
    setEditingWorkflowId(workflowId);
    setIsWizardOpen(true);
  };

  const openCreateWizard = () => {
    setEditingWorkflowId(undefined);
    setIsWizardOpen(true);
  };

  const openLogsView = (workflowId: string, workflowName: string) => {
    setViewingLogsWorkflow({ id: workflowId, name: workflowName });
  };

  const closeLogsView = () => {
    setViewingLogsWorkflow(null);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setEditingWorkflowId(undefined);
  };

  const handleWorkflowSaved = () => {
    loadWorkflows();
  };

  const getTriggerTypeLabel = (type: string) => {
    const types = {
      'on_create': 'On Create',
      'on_update': 'On Update', 
      'both': 'Create & Update',
      'cron': 'Scheduled',
    };
    return types[type as keyof typeof types] || type;
  };

  const getTriggerTypeColor = (type: string) => {
    const colors = {
      'on_create': 'green',
      'on_update': 'blue',
      'both': 'purple',
      'cron': 'orange',
    };
    return colors[type as keyof typeof colors] || 'gray';
  };

  // Show logs view if selected
  if (viewingLogsWorkflow) {
    return (
      <WorkflowLogsView
        workflowId={viewingLogsWorkflow.id}
        workflowName={viewingLogsWorkflow.name}
        onBack={closeLogsView}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-2">
            Create and manage automated workflows for your organization
          </p>
        </div>
        <button
          onClick={openCreateWizard}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Workflow
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Workflows Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first automated workflow to streamline your processes
          </p>
          <button
            onClick={openCreateWizard}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create First Workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {workflows.map((workflow) => {
            const triggerColor = getTriggerTypeColor(workflow.trigger_type);
            
            return (
              <div
                key={workflow.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{workflow.name}</h3>
                      <span className={`px-3 py-1 text-sm rounded-full bg-${triggerColor}-100 text-${triggerColor}-700`}>
                        {getTriggerTypeLabel(workflow.trigger_type)}
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        workflow.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{workflow.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span>Table: {workflow.trigger_table}</span>
                      <span>Actions: {workflow.actions?.length || 0}</span>
                      <span>Priority: {workflow.priority}</span>
                      {workflow.last_executed_at && (
                        <span>Last run: {new Date(workflow.last_executed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openLogsView(workflow.id!, workflow.name)}
                      className="text-gray-600 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      title="View logs"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleWorkflowStatus(workflow.id!, workflow.is_active!)}
                      className={`p-2 rounded-lg transition-colors ${
                        workflow.is_active
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={workflow.is_active ? 'Pause workflow' : 'Activate workflow'}
                    >
                      {workflow.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => openEditWizard(workflow.id!)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      title="Edit workflow"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteWorkflow(workflow.id!)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard */}
      <WorkflowWizard
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        workflowId={editingWorkflowId}
        onSave={handleWorkflowSaved}
      />
    </div>
  );
}