import { useState, useEffect } from 'react';
import { getStats, getAdminUsage } from '../../api';

export default function StatsTab() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getStats(), getAdminUsage(1)])
      .then(([s, u]) => {
        setStats(s);
        setLogs(u.logs);
        setLogTotal(u.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (logPage === 1) return;
    getAdminUsage(logPage).then((u) => {
      setLogs(u.logs);
      setLogTotal(u.total);
    });
  }, [logPage]);

  if (loading) return <div className="text-center text-gray-400 py-8">加载中...</div>;
  if (!stats) return null;

  const logPages = Math.ceil(logTotal / 50);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">CDK 总数</div>
          <div className="text-2xl font-bold">{stats.cdks.total}</div>
          <div className="text-xs text-gray-400 mt-1">
            可用 {stats.cdks.active} / 已兑换 {stats.cdks.redeemed}
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">API Key</div>
          <div className="text-2xl font-bold">{stats.apiKeys.total}</div>
          <div className="text-xs text-gray-400 mt-1">活跃 {stats.apiKeys.active}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">总请求次数</div>
          <div className="text-2xl font-bold">{stats.usage.totalRequests.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <div className="text-xs text-gray-500">总消费</div>
          <div className="text-2xl font-bold">${stats.usage.totalCost.toFixed(4)}</div>
          <div className="text-xs text-gray-400 mt-1">
            输入 {(stats.usage.totalInputTokens / 1000000).toFixed(2)}M / 输出 {(stats.usage.totalOutputTokens / 1000000).toFixed(2)}M tokens
          </div>
        </div>
      </div>

      <h3 className="font-medium mb-3">使用记录</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">时间</th>
              <th className="pb-2">API Key</th>
              <th className="pb-2">模型</th>
              <th className="pb-2">接口</th>
              <th className="pb-2 text-right">输入 tokens</th>
              <th className="pb-2 text-right">输出 tokens</th>
              <th className="pb-2 text-right">费用</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="7" className="py-4 text-center text-gray-400">暂无记录</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100">
                <td className="py-2 text-xs">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                <td className="py-2"><code className="text-xs">{log.apiKey?.key?.slice(0, 16)}...</code></td>
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

      {logPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setLogPage(Math.max(1, logPage - 1))} disabled={logPage === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
          <span className="px-3 py-1 text-sm">{logPage} / {logPages}</span>
          <button onClick={() => setLogPage(Math.min(logPages, logPage + 1))} disabled={logPage === logPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  );
}
