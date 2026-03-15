import { useState, useEffect } from 'react';
import { getPricing, savePricing, deletePricing } from '../../api';

export default function PricingTab() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({ modelPattern: '', inputPricePerM: '', outputPricePerM: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setRules(await getPricing());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    await savePricing(form);
    setForm({ modelPattern: '', inputPricePerM: '', outputPricePerM: '' });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('确认删除？')) return;
    await deletePricing(id);
    load();
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        配置每个模型的 token 价格。使用 <code className="bg-gray-100 px-1">*</code> 作为模型名称来设置默认价格。
        支持精确匹配模型名称（如 <code className="bg-gray-100 px-1">claude-3-opus-20240229</code>）。
      </p>

      <form onSubmit={handleSave} className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="text-xs text-gray-500">模型名称</label>
          <input
            type="text"
            value={form.modelPattern}
            onChange={(e) => setForm({ ...form, modelPattern: e.target.value })}
            placeholder="* 或 模型名称"
            className="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">输入价格 ($/1M tokens)</label>
          <input
            type="number"
            step="0.01"
            value={form.inputPricePerM}
            onChange={(e) => setForm({ ...form, inputPricePerM: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">输出价格 ($/1M tokens)</label>
          <input
            type="number"
            step="0.01"
            value={form.outputPricePerM}
            onChange={(e) => setForm({ ...form, outputPricePerM: e.target.value })}
            className="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="text-sm px-4 py-1 bg-gray-900 text-white rounded">
            保存
          </button>
        </div>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2">模型</th>
            <th className="pb-2 text-right">输入 ($/1M)</th>
            <th className="pb-2 text-right">输出 ($/1M)</th>
            <th className="pb-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" className="py-4 text-center text-gray-400">加载中...</td></tr>
          ) : rules.length === 0 ? (
            <tr><td colSpan="4" className="py-4 text-center text-gray-400">暂无定价规则，将使用环境变量默认值</td></tr>
          ) : rules.map((r) => (
            <tr key={r.id} className="border-b border-gray-100">
              <td className="py-2"><code className="text-xs">{r.modelPattern}</code></td>
              <td className="py-2 text-right">${r.inputPricePerM}</td>
              <td className="py-2 text-right">${r.outputPricePerM}</td>
              <td className="py-2 text-right">
                <button
                  onClick={() => setForm({ modelPattern: r.modelPattern, inputPricePerM: r.inputPricePerM, outputPricePerM: r.outputPricePerM })}
                  className="text-xs text-blue-600 mr-2"
                >
                  编辑
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-xs text-red-600">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
