import { useState, useEffect } from 'react';
import { getCdks, createCdks, updateCdk, batchUpdateCdks, batchDeleteCdks } from '../../api';

export default function CdkTab() {
  const [cdks, setCdks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [form, setForm] = useState({ count: 1, quota: '', expiryDays: '', note: '' });
  const [batchForm, setBatchForm] = useState({ quota: '', expiryDays: '', status: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCdks(page, filter);
      setCdks(data.cdks);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createCdks({
      count: parseInt(form.count),
      quota: form.quota,
      expiryDays: form.expiryDays,
      note: form.note,
    });
    setShowCreate(false);
    setForm({ count: 1, quota: '', expiryDays: '', note: '' });
    load();
  };

  const handleBatchUpdate = async (e) => {
    e.preventDefault();
    const data = { ids: [...selected] };
    if (batchForm.quota) data.quota = batchForm.quota;
    if (batchForm.expiryDays) data.expiryDays = batchForm.expiryDays;
    if (batchForm.status) data.status = batchForm.status;
    await batchUpdateCdks(data);
    setShowBatch(false);
    setSelected(new Set());
    setBatchForm({ quota: '', expiryDays: '', status: '' });
    load();
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确认删除 ${selected.size} 个 CDK？`)) return;
    await batchDeleteCdks([...selected]);
    setSelected(new Set());
    load();
  };

  const toggleSelect = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === cdks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cdks.map((c) => c.id)));
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="border rounded px-2 py-1 text-sm">
            <option value="">全部状态</option>
            <option value="active">可用</option>
            <option value="redeemed">已兑换</option>
            <option value="disabled">已禁用</option>
          </select>
          <span className="text-sm text-gray-500 leading-8">共 {total} 条</span>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <>
              <button onClick={() => setShowBatch(true)} className="text-sm px-3 py-1 bg-blue-600 text-white rounded">
                批量修改 ({selected.size})
              </button>
              <button onClick={handleBatchDelete} className="text-sm px-3 py-1 bg-red-600 text-white rounded">
                批量删除
              </button>
            </>
          )}
          <button onClick={() => setShowCreate(true)} className="text-sm px-3 py-1 bg-gray-900 text-white rounded">
            创建 CDK
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="mb-4 p-4 bg-gray-50 rounded border">
          <h3 className="font-medium mb-3">创建 CDK</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500">数量</label>
              <input type="number" min="1" max="500" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">额度 (USD)</label>
              <input type="number" step="0.01" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">有效天数</label>
              <input type="number" min="1" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">备注</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div className="col-span-4 flex gap-2">
              <button type="submit" className="text-sm px-4 py-1 bg-gray-900 text-white rounded">确认创建</button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm px-4 py-1 border rounded">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* Batch edit modal */}
      {showBatch && (
        <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-medium mb-3">批量修改 ({selected.size} 项)</h3>
          <form onSubmit={handleBatchUpdate} className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">额度 (留空不修改)</label>
              <input type="number" step="0.01" value={batchForm.quota} onChange={(e) => setBatchForm({ ...batchForm, quota: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">有效天数 (留空不修改)</label>
              <input type="number" min="1" value={batchForm.expiryDays} onChange={(e) => setBatchForm({ ...batchForm, expiryDays: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">状态 (留空不修改)</label>
              <select value={batchForm.status} onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value })} className="w-full border rounded px-2 py-1 text-sm">
                <option value="">不修改</option>
                <option value="active">可用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
            <div className="col-span-3 flex gap-2">
              <button type="submit" className="text-sm px-4 py-1 bg-blue-600 text-white rounded">确认修改</button>
              <button type="button" onClick={() => setShowBatch(false)} className="text-sm px-4 py-1 border rounded">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 w-8"><input type="checkbox" checked={cdks.length > 0 && selected.size === cdks.length} onChange={toggleAll} /></th>
              <th className="pb-2">CDK 码</th>
              <th className="pb-2">额度</th>
              <th className="pb-2">天数</th>
              <th className="pb-2">状态</th>
              <th className="pb-2">备注</th>
              <th className="pb-2">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="py-4 text-center text-gray-400">加载中...</td></tr>
            ) : cdks.length === 0 ? (
              <tr><td colSpan="7" className="py-4 text-center text-gray-400">暂无数据</td></tr>
            ) : cdks.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td>
                <td className="py-2"><code className="text-xs">{c.code}</code></td>
                <td className="py-2">${c.quota}</td>
                <td className="py-2">{c.expiryDays}</td>
                <td className="py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'redeemed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {c.status === 'active' ? '可用' : c.status === 'redeemed' ? '已兑换' : '已禁用'}
                  </span>
                </td>
                <td className="py-2 text-xs text-gray-500">{c.note || '-'}</td>
                <td className="py-2 text-xs text-gray-500">{new Date(c.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td>
              </tr>
            ))}
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
