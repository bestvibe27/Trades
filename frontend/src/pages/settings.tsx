import React, { useState } from 'react';
import Layout from '../components/common/Layout';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    account: {
      name: 'Demo Account',
      email: 'demo@example.com',
      timezone: 'UTC',
      currency: 'USD'
    },
    trading: {
      defaultLeverage: 10,
      maxPositionSize: 0.1,
      riskPerTrade: 0.02,
      stopLossEnabled: true,
      takeProfitEnabled: true
    },
    notifications: {
      emailEnabled: false,
      emailAddress: '',
      tradeAlerts: true,
      errorAlerts: true,
      dailyReports: false
    },
    api: {
      brokerApiKey: '',
      brokerSecret: '',
      marketDataApiKey: ''
    }
  });

  const [activeTab, setActiveTab] = useState('account');

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'trading', name: 'Trading', icon: '💹' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'api', name: 'API Keys', icon: '🔑' }
  ];

  return (
    <Layout title="Settings - Trading Dashboard">
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure your trading account and preferences
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Tab navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      type="text"
                      value={settings.account.name}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, name: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={settings.account.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, email: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                      value={settings.account.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, timezone: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={settings.account.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, currency: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trading' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Trading Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Leverage</label>
                    <input
                      type="number"
                      value={settings.trading.defaultLeverage}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, defaultLeverage: Number(e.target.value) }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Position Size (%)</label>
                    <input
                      type="number"
                      value={settings.trading.maxPositionSize}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, maxPositionSize: Number(e.target.value) }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="0.01"
                      max="1"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Risk Per Trade (%)</label>
                    <input
                      type="number"
                      value={settings.trading.riskPerTrade}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, riskPerTrade: Number(e.target.value) }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      min="0.01"
                      max="0.1"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.trading.stopLossEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, stopLossEnabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Stop Loss</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.trading.takeProfitEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, takeProfitEnabled: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Take Profit</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailEnabled: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Email Notifications</span>
                    </label>
                  </div>
                  {settings.notifications.emailEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input
                        type="email"
                        value={settings.notifications.emailAddress}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailAddress: e.target.value }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.tradeAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, tradeAlerts: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Trade Alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.errorAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, errorAlerts: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Error Alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.dailyReports}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, dailyReports: e.target.checked }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Daily Reports</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="text-yellow-800 text-sm">
                    <strong>Security Notice:</strong> API keys are stored securely and encrypted. 
                    Never share your API keys with anyone.
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Broker API Key</label>
                    <input
                      type="password"
                      value={settings.api.brokerApiKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, brokerApiKey: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your broker API key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Broker Secret</label>
                    <input
                      type="password"
                      value={settings.api.brokerSecret}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, brokerSecret: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your broker secret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Market Data API Key</label>
                    <input
                      type="password"
                      value={settings.api.marketDataApiKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, marketDataApiKey: e.target.value }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your market data API key"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;










