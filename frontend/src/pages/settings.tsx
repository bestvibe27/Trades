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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
            Configure your trading account and preferences
          </p>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {/* Tab navigation */}
          <div style={{
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: '32px',
            paddingLeft: '24px',
            paddingRight: '24px'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-dim)',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  transition: 'all 160ms ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = 'var(--text-dim)';
                  }
                }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '24px' }}>
            {activeTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium" style={{ color: 'var(--text)' }}>Account Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Account Name</label>
                    <input
                      type="text"
                      value={settings.account.name}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, name: e.target.value }
                      })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Email</label>
                    <input
                      type="email"
                      value={settings.account.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, email: e.target.value }
                      })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Timezone</label>
                    <select
                      value={settings.account.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, timezone: e.target.value }
                      })}
                      className="input"
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
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Currency</label>
                    <select
                      value={settings.account.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        account: { ...settings.account, currency: e.target.value }
                      })}
                      className="input"
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
                <h3 className="text-lg font-medium" style={{ color: 'var(--text)' }}>Trading Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Default Leverage</label>
                    <input
                      type="number"
                      value={settings.trading.defaultLeverage}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, defaultLeverage: Number(e.target.value) }
                      })}
                      className="input"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Max Position Size (%)</label>
                    <input
                      type="number"
                      value={settings.trading.maxPositionSize}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, maxPositionSize: Number(e.target.value) }
                      })}
                      className="input"
                      min="0.01"
                      max="1"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Risk Per Trade (%)</label>
                    <input
                      type="number"
                      value={settings.trading.riskPerTrade}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, riskPerTrade: Number(e.target.value) }
                      })}
                      className="input"
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
                      style={{
                        accentColor: 'var(--accent)'
                      }}
                    />
                    <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>Enable Stop Loss</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.trading.takeProfitEnabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        trading: { ...settings.trading, takeProfitEnabled: e.target.checked }
                      })}
                      style={{
                        accentColor: 'var(--accent)'
                      }}
                    />
                    <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>Enable Take Profit</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium" style={{ color: 'var(--text)' }}>Notification Settings</h3>
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
                        style={{
                          accentColor: 'var(--accent)'
                        }}
                      />
                      <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>Enable Email Notifications</span>
                    </label>
                  </div>
                  {settings.notifications.emailEnabled && (
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Email Address</label>
                      <input
                        type="email"
                        value={settings.notifications.emailAddress}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailAddress: e.target.value }
                        })}
                        className="input"
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
                        style={{
                          accentColor: 'var(--accent)'
                        }}
                      />
                      <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>Trade Alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.errorAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, errorAlerts: e.target.checked }
                        })}
                        style={{
                          accentColor: 'var(--accent)'
                        }}
                      />
                      <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>Error Alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.dailyReports}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, dailyReports: e.target.checked }
                        })}
                        style={{
                          accentColor: 'var(--accent)'
                        }}
                      />
                      <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>Daily Reports</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium" style={{ color: 'var(--text)' }}>API Configuration</h3>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid var(--warning)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px'
                }}>
                  <div style={{ color: 'var(--warning)', fontSize: '14px' }}>
                    <strong>Security Notice:</strong> API keys are stored securely and encrypted. 
                    Never share your API keys with anyone.
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Broker API Key</label>
                    <input
                      type="password"
                      value={settings.api.brokerApiKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, brokerApiKey: e.target.value }
                      })}
                      className="input"
                      placeholder="Enter your broker API key"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Broker Secret</label>
                    <input
                      type="password"
                      value={settings.api.brokerSecret}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, brokerSecret: e.target.value }
                      })}
                      className="input"
                      placeholder="Enter your broker secret"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>Market Data API Key</label>
                    <input
                      type="password"
                      value={settings.api.marketDataApiKey}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, marketDataApiKey: e.target.value }
                      })}
                      className="input"
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
                className="btn-primary"
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










