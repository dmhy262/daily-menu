import { useState } from 'react';
import { X, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function BatchImport({ onClose, onImportSuccess, refreshRecipes }) {
  const [dishNames, setDishNames] = useState('');
  const [phase, setPhase] = useState('input'); // input, processing, completed
  const [importStatus, setImportStatus] = useState(null);
  const [error, setError] = useState(null);

  const startImport = async () => {
    if (!dishNames.trim()) return;

    const names = dishNames.split('\n').filter(n => n.trim());
    if (names.length === 0) return;

    try {
      setError(null);
      setPhase('processing');
      
      // 初始状态
      setImportStatus({
        status: 'processing',
        total: names.length,
        processed: 0,
        results: []
      });

      const res = await fetch('/api/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishNames: names })
      });

      const result = await res.json();

      if (result.success) {
        setImportStatus({
          status: 'completed',
          total: result.total,
          processed: result.total,
          results: result.results
        });
        setPhase('completed');
        if (refreshRecipes) {
          refreshRecipes();
        }
      } else {
        setError(result.error || '导入失败');
        setPhase('input');
      }
    } catch (err) {
      setError(err.message || '请求失败');
      setPhase('input');
    }
  };

  const successCount = importStatus?.results?.filter(r => r.success).length || 0;
  const failCount = importStatus?.results?.filter(r => !r.success).length || 0;

  const reset = () => {
    setDishNames('');
    setPhase('input');
    setImportStatus(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">批量导入菜谱</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 输入阶段 */}
          {phase === 'input' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  菜品名称（每行一个）
                </label>
                <textarea
                  value={dishNames}
                  onChange={(e) => setDishNames(e.target.value)}
                  placeholder="宫保鸡丁
鱼香肉丝
糖醋排骨
红烧肉"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  提示：每行输入一个菜品名称，系统将在后台自动生成完整菜谱
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={startImport}
                disabled={!dishNames.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                开始导入
              </button>

              <p className="text-xs text-gray-400">
                ⚡ 导入启动后，即使关闭页面也会继续在后台处理
              </p>
            </>
          )}

          {/* 处理中阶段 */}
          {phase === 'processing' && importStatus && (
            <>
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={24} className="animate-spin text-orange-500" />
                    <span className="text-lg font-medium text-gray-800">正在后台生成...</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {importStatus.processed} / {importStatus.total}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importStatus.processed / importStatus.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    可以关闭页面，稍后回来查看结果
                  </p>
                </div>

                {importStatus.results.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {importStatus.results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          result.success ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <XCircle size={16} className="text-red-500" />
                        )}
                        <div className="flex-1">
                          <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                            {result.name}
                          </span>
                          {result.success && result.data && (
                            <span className="text-xs text-gray-500 ml-2">
                              - {result.data.type}
                            </span>
                          )}
                        </div>
                        {!result.success && (
                          <span className="text-xs text-red-500">
                            {result.error || '生成失败'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 完成阶段 */}
          {phase === 'completed' && importStatus && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">导入完成</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle size={16} />
                      {successCount} 成功
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle size={16} />
                      {failCount} 失败
                    </span>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importStatus.results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        result.success ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <div className="flex-1">
                        <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                          {result.name}
                        </span>
                        {result.success && result.data && (
                          <span className="text-xs text-gray-500 ml-2">
                            - {result.data.type}
                          </span>
                        )}
                      </div>
                      {!result.success && (
                        <span className="text-xs text-red-500">
                          {result.error || '生成失败'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    关闭
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all"
                  >
                    继续导入
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BatchImport;
