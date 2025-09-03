import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingOutlined className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600">Checking your authentication status</p>
      </div>
    </div>
  );
}