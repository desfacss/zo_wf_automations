import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Alert } from 'antd';
import { MailOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

const { Title, Text } = Typography;

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();

  const fetchUserProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .schema('identity')
        .from('users')
        .select('*')
        .eq('auth_id', authId);

      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUser(data[0]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      fetchUserProfile(data.user.id);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <Card style={{ width: '100%', maxWidth: 400, borderRadius: 16 }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <LoginOutlined style={{ fontSize: 32, color: 'white' }} />
            </div>
            <Title level={2} style={{ margin: 0 }}>Welcome Back</Title>
            <Text type="secondary">Sign in to access your accounts</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Enter your email" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Enter your password" 
              />
            </Form.Item>

            {error && (
              <Form.Item>
                <Alert message={error} type="error" showIcon />
              </Form.Item>
            )}

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                icon={<LoginOutlined />}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Access your organization's accounts and manage your dashboard
          </Text>
        </Space>
      </Card>
    </div>
  );
}