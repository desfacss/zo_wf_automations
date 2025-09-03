import React, { useState } from 'react';
import { Modal, Form, Input, Button, Switch, Row, Col, Typography, Space, Tag, Alert, Card, Divider } from 'antd';
import { SaveOutlined, MailOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import type { EmailTemplate } from '../../lib/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
  template?: EmailTemplate | null;
}

export function EmailTemplateModal({ isOpen, onClose, onSave, template }: EmailTemplateModalProps) {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  React.useEffect(() => {
    if (template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description || '',
        subject: template.details?.subject || '',
        body: template.details?.body || '',
        is_active: template.is_active !== false,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        is_active: true,
      });
    }
  }, [template, isOpen, form]);

  const handleSave = async (values: any) => {
    setSaving(true);
    setError('');

    try {
      const emailTemplateData = {
        name: values.name,
        description: values.description,
        details: {
          subject: values.subject,
          body: values.body,
        },
        is_active: values.is_active,
        organization_id: user?.organization_id,
        updated_at: new Date().toISOString(),
      };

      let savedTemplate;
      if (template?.id) {
        const { data, error } = await supabase
          .from('email_templates')
          .update(emailTemplateData)
          .eq('id', template.id)
          .select()
          .single();

        if (error) throw error;
        savedTemplate = data;
      } else {
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            ...emailTemplateData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        savedTemplate = data;
      }

      onSave(savedTemplate);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  const commonPlaceholders = [
    '{{new.display_id}}',
    '{{new.subject}}',
    '{{new.status}}',
    '{{new.created_at}}',
    '{{old.status}}',
    '{{user.name}}',
    '{{organization.name}}',
  ];

  const insertPlaceholder = (placeholder: string, field: 'subject' | 'body') => {
    const currentValue = form.getFieldValue(field) || '';
    form.setFieldValue(field, currentValue + placeholder);
  };

  const formValues = Form.useWatch([], form);

  return (
    <Modal
      title={
        <Space>
          <MailOutlined />
          <span>{template ? 'Edit Email Template' : 'Create Email Template'}</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="preview"
          icon={<EyeOutlined />}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Hide Preview' : 'Show Preview'}
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => form.submit()}
        >
          Save Template
        </Button>,
      ]}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={24}>
        <Col span={16}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Template Name"
                  rules={[{ required: true, message: 'Please enter template name' }]}
                >
                  <Input placeholder="Enter template name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="description"
                  label="Description"
                >
                  <Input placeholder="Brief description" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="subject"
              label="Email Subject"
              rules={[{ required: true, message: 'Please enter email subject' }]}
            >
              <Input placeholder="Enter email subject" />
            </Form.Item>

            <Form.Item
              name="body"
              label="Email Body"
              rules={[{ required: true, message: 'Please enter email body' }]}
            >
              <TextArea
                placeholder="Enter email body content. Use HTML for formatting."
                rows={12}
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              valuePropName="checked"
            >
              <Switch /> <Text>Active template</Text>
            </Form.Item>
          </Form>
        </Col>

        <Col span={8}>
          <Card title="Available Placeholders" size="small">
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {commonPlaceholders.map((placeholder) => (
                <Row key={placeholder} justify="space-between" align="middle">
                  <Col>
                    <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {placeholder}
                    </Tag>
                  </Col>
                  <Col>
                    <Space size="small">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => insertPlaceholder(placeholder, 'subject')}
                        title="Insert into subject"
                      >
                        S
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => insertPlaceholder(placeholder, 'body')}
                        title="Insert into body"
                      >
                        B
                      </Button>
                    </Space>
                  </Col>
                </Row>
              ))}
            </Space>
            
            <Divider />
            <div>
              <Text strong style={{ fontSize: 12 }}>Tips:</Text>
              <ul style={{ fontSize: 12, margin: '8px 0 0 16px', color: '#666' }}>
                <li>HTML formatting is supported</li>
                <li>Click S/B to insert into Subject/Body</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Preview */}
      {previewMode && formValues && (
        <>
          <Divider />
          <Card title="Preview" size="small">
            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 12 }}>
              <Text type="secondary">Subject:</Text>
              <div style={{ fontWeight: 500 }}>{formValues.subject || 'No subject'}</div>
            </div>
            <div>
              <Text type="secondary">Body:</Text>
              <div 
                style={{ marginTop: 8, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: formValues.body || 'No content' }}
              />
            </div>
          </Card>
        </>
      )}
    </Modal>
  );
}