import React, { useEffect, useState } from 'react';
import { BuildingOutlined, EnvironmentOutlined, CalendarOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
// import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../lib/store';

interface Account {
  id: string;
  name: string;
  organization_id: string;
  location_id: string;
  created_at: string;
  [key: string]: any;
}

export function AccountsList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .schema('external')
        .from('accounts')
        .select('*')
        // .eq('organization_id', user?.organization_id)
        // .eq('location_id', user?.location_id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setAccounts(data || []);
      }
    } catch (err) {
      setError('Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">
          <BuildingOutlined className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error Loading Accounts</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={fetchAccounts}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
        >
          <ReloadOutlined className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
          <p className="text-gray-600 mt-1">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} found for your organization
          </p>
        </div>
        <button
          onClick={fetchAccounts}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          <ReloadOutlined className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="relative">
        <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12">
          <BuildingOutlined className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No matching accounts' : 'No accounts found'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'No accounts are available for your organization and location'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {account.name}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <BuildingOutlined className="w-4 h-4" />
                      <span>Org: {account.organization_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvironmentOutlined className="w-4 h-4" />
                      <span>Location: {account.location_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarOutlined className="w-4 h-4" />
                      <span>Created: {formatDate(account.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}