export interface Organization {
  id: string;
  name: string;
  subdomain?: string;
  module_features?: string[];
  details?: any;
  app_settings?: any;
  created_at?: string;
  updated_at?: string;
  subscription_id?: string;
  settings?: any;
  auth_id?: string;
  created_by?: string;
  updated_by?: string;
}

export interface User {
  id: string;
  auth_id?: string;
  organization_id: string;
  location_id?: string;
  role_id?: string;
  name?: string;
  email?: string;
  is_active?: boolean;
  details?: any;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  details?: any;
  time_zone?: string;
  working_hours?: any;
  settings?: any;
  service_area?: any;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  short_code?: string;
  is_default?: boolean;
}

export interface WorkflowRule {
  id?: string;
  organization_id: string;
  name: string;
  description?: string;
  trigger_table: string;
  trigger_type: 'on_create' | 'on_update' | 'both' | 'cron';
  condition_type?: 'jsonb' | 'sql';
  conditions?: any;
  actions?: string[];
  cron_config?: string;
  cron_description?: string;
  version?: number;
  is_active?: boolean;
  priority?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  last_executed_at?: string;
  error_notification_config?: any;
  workflow_definition_id?: string;
  metadata?: any;
}

export interface WorkflowAction {
  id?: string;
  x_workflow_id?: string;
  action_type: 'send_email' | 'assign_task' | 'create_record' | 'add_tags' | 'update_fields' | 'assign_owner' | 'create_activity' | 'manage_tags' | 'trigger_workflow_event';
  configuration: any;
  action_order: number;
  retry_count?: number;
  max_retries?: number;
  rate_limit?: any;
  is_enabled?: boolean;
  last_executed_at?: string;
  created_at?: string;
  updated_at?: string;
  organization_id: string;
  name: string;
  metadata?: any;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  placeholders?: any;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  details?: {
    subject: string;
    body: string;
  };
  organization_id?: string;
}

export interface TableMetadata {
  key: string;
  type: string;
  display_name: string;
  is_filterable: boolean;
  semantic_type: {
    order: any[];
    sub_type: string;
    default_aggregation: string;
  };
  is_displayable: boolean;
  foreign_key?: {
    source_table: string;
    source_column: string;
    display_column: string;
  };
}

export interface ViewConfig {
  id: string;
  entity_type: string;
  entity_schema?: string;
  metadata: TableMetadata[];
  created_at?: string;
  is_active?: boolean;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  location_id: string;
  details?: any;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Condition {
  id: string;
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}