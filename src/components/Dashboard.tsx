import React from 'react';
import { Header } from './Header';
import { AccountsList } from './AccountsList';
// import { useAuth } from '../hooks/useAuth';
import { Building2, MapPin, User } from 'lucide-react';
import { useAuthStore } from '../lib/store';

export function Dashboard() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <User className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              User Profile Not Found
            </h3>
            <p className="text-yellow-700">
              Unable to load your organization and location information. 
              Please contact your administrator.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Context</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Organization</p>
                <p className="text-lg font-semibold text-blue-700">{user?.organization_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <MapPin className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Location</p>
                <p className="text-lg font-semibold text-green-700">{user?.location_id}</p>
              </div>
            </div>
          </div>
        </div>

        <AccountsList />
      </main>
    </div>
  );
}