import React from 'react';
import { LogoutOutlined, UserOutlined, BuildingOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuthStore } from '../lib/store';

export function Header() {
  const { user,setUser } = useAuthStore();

  const handleSignOut = async () => {
    await setUser();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <BuildingOutlined className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Account Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your organization accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BuildingOutlined className="w-4 h-4" />
                <span>Org: {user?.organization_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="w-4 h-4" />
                <span>Location: {user?.location_id}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <UserOutlined className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <LogoutOutlined className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}