import { useState } from 'react';
import { getStatus, getUsage } from '../api';

export default function Dashboard() {
  const [key, setKey] = useState('');
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async (e) => {
    e.preventDefault();
    setError('');
    setStatus(null);
    setLogs([]);
    setLoading(true);
    try {
      const [s, u] = await Promise.all([getStatus(key.trim()), getUsage(key.trim())]);
      setStatus(s);
      setLogs(u.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pct = status ? Math.min(100, (status.quotaUsed / status.quotaTotal) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">额度查询</h1>
        <form onSubmit={handleQuery} className="flex gap-2">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入您的 API Key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            disabled={!key.trim() || loading}
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? '查询中...' : '查询'}
          </button>
        </form>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        {status && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">状态</div>
                <div className={`font-medium ${status.isExpired || status.status !== 'active' ? 'text-red-600' : 'text-green-600'}`}>
                  {status.isExpired ? '已过期' : status.status === 'active' ? '正常' : '已禁用'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">到期时间</div>
                <div className="font-medium text-sm">{new Date(status.expiresAt).toLocaleString('zh-CN')}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">总请求次数</div>
                <div className="font-medium">{status.totalRequests}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">创建时间</div>
                <div className="font-medium text-sm">{new Date(status.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>额度使用</span>
                <span>${status.quotaUsed.toFixed(4)} / ${status.quotaTotal.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">剩余: ${status.quotaRemaining.toFixed(4)}</div>
            </div>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="font-bold mb-3">使用记录</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">时间</th>
                  <th className="pb-2">模型</th>
                  <th className="pb-2">接口</th>
                  <th className="pb-2 text-right">输入</th>
                  <th className="pb-2 text-right">输出</th>
                  <th className="pb-2 text-right">费用</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100">
                    <td className="py-2 text-xs">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="py-2"><code className="text-xs">{log.model}</code></td>
                    <td className="py-2 text-xs">{log.endpoint}</td>
                    <td className="py-2 text-right">{log.inputTokens.toLocaleString()}</td>
                    <td className="py-2 text-right">{log.outputTokens.toLocaleString()}</td>
                    <td className="py-2 text-right">${log.cost.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
