import { useState, useEffect } from 'react';
import { getApiKeys, updateApiKey } from '../../api';

export default function KeysTab() {
  const [keys, setKeys] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getApiKeys(page);
      setKeys(data.keys);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const toggleStatus = async (id, current) => {
    const newStatus = current === 'active' ? 'disabled' : 'active';
    await updateApiKey(id, { status: newStatus });
    load();
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <span className="text-sm text-gray-500">共 {total} 个 API Key</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">API Key</th>
              <th className="pb-2">CDK</th>
              <th className="pb-2 text-right">已用/总额</th>
              <th className="pb-2">到期时间</th>
              <th className="pb-2">请求数</th>
              <th className="pb-2">状态</th>
              <th className="pb-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="py-4 text-center text-gray-400">加载中...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan="7" className="py-4 text-center text-gray-400">暂无数据</td></tr>
            ) : keys.map((k) => {
              const pct = (k.quotaUsed / k.quotaTotal) * 100;
              const isExpired = new Date() > new Date(k.expiresAt);
              return (
                <tr key={k.id} className="border-b border-gray-100">
                  <td className="py-2">
                      <div className="flex items-center gap-1">
                        <code className="text-xs">{k.key.slice(0, 20)}...</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(k.key)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                          title="复制完整 Key"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                  <td className="py-2 text-xs">{k.cdks.map((c) => c.code).join(', ') || '-'}</td>
                  <td className="py-2 text-right text-xs">
                    ${k.quotaUsed.toFixed(4)} / ${k.quotaTotal}
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 ml-auto mt-1">
                      <div className={`h-1.5 rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </td>
                  <td className="py-2 text-xs">{new Date(k.expiresAt).toLocaleDateString('zh-CN')}</td>
                  <td className="py-2 text-xs">{k._count.usageLogs}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${isExpired ? 'bg-red-100 text-red-700' : k.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {isExpired ? '已过期' : k.status === 'active' ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => toggleStatus(k.id, k.status)} className={`text-xs ${k.status === 'active' ? 'text-red-600' : 'text-green-600'}`}>
                      {k.status === 'active' ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">上一页</button>
          <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">下一页</button>
        </div>
      )}
    </div>
  );
}
