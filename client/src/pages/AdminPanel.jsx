import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CdkTab from './admin/CdkTab';
import PricingTab from './admin/PricingTab';
import KeysTab from './admin/KeysTab';
import StatsTab from './admin/StatsTab';

const tabs = [
  { key: 'cdks', label: 'CDK 管理' },
  { key: 'pricing', label: '定价管理' },
  { key: 'keys', label: 'API Key' },
  { key: 'stats', label: '统计概览' },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('cdks');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
          退出登录
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'cdks' && <CdkTab />}
        {activeTab === 'pricing' && <PricingTab />}
        {activeTab === 'keys' && <KeysTab />}
        {activeTab === 'stats' && <StatsTab />}
      </div>
    </div>
  );
}
