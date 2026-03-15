import { useState } from 'react';
import { redeemCdk } from '../api';

export default function Home() {
  const [cdk, setCdk] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await redeemCdk(cdk.trim());
      setResult(data);
      setCdk('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">CDK 兑换</h1>
        <p className="text-gray-500 text-sm mb-6">
          输入您的 CDK 兑换码，获取 API Key 用于访问 OpenAI / Anthropic 兼容接口。
        </p>

        <form onSubmit={handleRedeem}>
          <input
            type="text"
            value={cdk}
            onChange={(e) => setCdk(e.target.value)}
            placeholder="请输入 CDK 兑换码"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            disabled={!cdk.trim() || loading}
            className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? '兑换中...' : '兑换'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h3 className="font-medium text-green-800 mb-2">兑换成功</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">API Key: </span>
                <code className="bg-white px-2 py-1 rounded border text-xs break-all select-all">
                  {result.apiKey}
                </code>
              </div>
              <div>
                <span className="text-gray-500">额度: </span>
                <span className="font-medium">${result.quota}</span>
              </div>
              <div>
                <span className="text-gray-500">到期时间: </span>
                <span>{new Date(result.expiresAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              请妥善保存您的 API Key，关闭页面后将无法再次查看。
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="font-bold mb-3">接口说明</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-gray-800">OpenAI 兼容接口</h3>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
              POST {'{baseUrl}'}/v1/chat/completions
            </code>
            <p className="mt-1">Header: <code className="text-xs bg-gray-100 px-1">Authorization: Bearer {'<your-api-key>'}</code></p>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Anthropic 兼容接口</h3>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
              POST {'{baseUrl}'}/v1/messages
            </code>
            <p className="mt-1">Header: <code className="text-xs bg-gray-100 px-1">x-api-key: {'<your-api-key>'}</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
