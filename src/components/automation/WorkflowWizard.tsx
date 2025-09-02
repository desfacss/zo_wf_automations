import React, { useState, useEffect } from 'react';
import { X, Plus, Save, ArrowLeft, ArrowRight, Settings, Zap, Mail, UserCheck, Tag, Edit, Activity, Workflow } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { WorkflowBasicInfo } from './WorkflowBasicInfo';
import { WorkflowConditions } from './WorkflowConditions';
import { WorkflowActions } from './WorkflowActions';
import type { WorkflowRule, WorkflowAction, ViewConfig, EmailTemplate, Team } from '../../lib/types';

interface WorkflowWizardProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
  onSave?: (workflow: WorkflowRule) => void;
}

export function WorkflowWizard({ isOpen, onClose, workflowId, onSave }: WorkflowWizardProps) {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Workflow data
  const [workflow, setWorkflow] = useState<Partial<WorkflowRule>>({
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
  });

  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [availableTables, setAvailableTables] = useState<ViewConfig[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const steps = [
    {
      title: 'Basic Information',
      description: 'Define workflow name, trigger, and table',
      icon: Settings,
    },
    {
      title: 'Conditions',
      description: 'Set up when this workflow should run',
      icon: Zap,
    },
    {
      title: 'Actions',
      description: 'Configure what actions to perform',
      icon: Activity,
    },
  ];

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (workflowId) {
        loadWorkflow(workflowId);
      }
    }
  }, [isOpen, workflowId]);

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
      
      // Load workflow
      const { data: workflowData, error: workflowError } = await supabase
        .schema('workflow')
        .from('wf_workflows')
        .select('*')
        .eq('id', id)
        .single();

      if (workflowError) throw workflowError;
      setWorkflow(workflowData);

      // Load associated actions
      if (workflowData.actions && workflowData.actions.length > 0) {
        const { data: actionsData, error: actionsError } = await supabase
          .schema('workflow')
          .from('wf_actions')
          .select('*')
          .in('id', workflowData.actions)
          .order('action_order');

        if (actionsError) throw actionsError;
        setActions(actionsData || []);
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
      // Save workflow
      const workflowData = {
        ...workflow,
        actions: actions.map(action => action.id).filter(Boolean),
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

      // Save actions
      for (const action of actions) {
        const actionData = {
          ...action,
          organization_id: user?.organization_id,
          updated_at: new Date().toISOString(),
        };

        if (action.id) {
          await supabase
            .schema('workflow')
            .from('wf_actions')
            .update(actionData)
            .eq('id', action.id);
        } else {
          await supabase
            .schema('workflow')
            .from('wf_actions')
            .insert({
              ...actionData,
              created_at: new Date().toISOString(),
            });
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
        return workflow.name && workflow.trigger_table && workflow.trigger_type;
      case 1:
        return true; // Conditions are optional
      case 2:
        return actions.length > 0;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Workflow className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">
                  {workflowId ? 'Edit Workflow' : 'Create New Workflow'}
                </h2>
                <p className="text-blue-100 mt-1">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`
                      flex items-center gap-3 px-4 py-2 rounded-lg transition-all
                      ${isActive ? 'bg-white bg-opacity-20' : ''}
                      ${isCompleted ? 'text-green-200' : ''}
                    `}>
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${isActive ? 'bg-white text-blue-600' : 
                          isCompleted ? 'bg-green-500 text-white' : 'bg-white bg-opacity-20'}
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="hidden sm:block">
                        <p className="font-medium">{step.title}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-8 h-px bg-white bg-opacity-30 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
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
                  onUpdate={setWorkflow}
                  availableTables={availableTables}
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!canProceedToNext() || saving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Workflow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}