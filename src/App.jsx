import { useState, useEffect } from 'react';
import WeekMenu from './components/WeekMenu';
import RecipeDetail from './components/RecipeDetail';
import ShoppingList from './components/ShoppingList';
import RecipeList from './components/RecipeList';
import PeopleConfig from './components/PeopleConfig';
import BatchImport from './components/BatchImport';
import { UtensilsCrossed, List, Plus, RefreshCw, BookOpen, Upload, Download, FileUp, Sparkles } from 'lucide-react';
import { initialRecipes, generateWeekMenu } from './data/recipes';
import { generateRecipeByAI } from './api/recipeApi';
import './index.css';

const API_URL = '/api/data';

const fetchData = async () => {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('获取数据失败', e);
    return null;
  }
};

const saveData = async (data) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error('保存数据失败', e);
  }
};

function App() {
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [blacklistedIds, setBlacklistedIds] = useState([]);
  const [config, setConfig] = useState({ adults: 2, children: 0 });
  const [weekMenu, setWeekMenu] = useState([]);
  const [selectedDayForShopping, setSelectedDayForShopping] = useState(null);

  useEffect(() => {
    const init = async () => {
      const data = await fetchData();
      if (data && data.recipes) {
        setRecipes(data.recipes);
        setBlacklistedIds(data.blacklistedIds || []);
        setConfig(data.config || { adults: 2, children: 0 });
        if (data.weekMenu && data.weekMenu.length > 0) {
          setWeekMenu(data.weekMenu);
        } else {
          const newMenu = generateWeekMenu(
            data.recipes.length > 0 ? data.recipes : initialRecipes,
            data.blacklistedIds || [],
            data.config || { adults: 2, children: 0 }
          );
          setWeekMenu(newMenu);
        }
      } else {
        setRecipes(initialRecipes);
        setBlacklistedIds([]);
        setConfig({ adults: 2, children: 0 });
        setWeekMenu(generateWeekMenu(initialRecipes, [], { adults: 2, children: 0 }));
      }
      setLoading(false);
    };
    init();
  }, []);

  const saveToBackend = async () => {
    await saveData({
      recipes,
      blacklistedIds,
      config,
      weekMenu
    });
  };

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [activeTab, setActiveTab] = useState('weekmenu');
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    type: '小荤',
    ingredients: [''],
    steps: [''],
    time: '',
    calories: 0,
    difficulty: '简单'
  });

  useEffect(() => {
    if (!loading) {
      saveToBackend();
    }
  }, [recipes, blacklistedIds, weekMenu, config]);

  const regenerateWeekMenu = async () => {
    console.log('点击重新生成菜谱！');
    console.log('当前菜谱:', recipes);
    console.log('黑名单:', blacklistedIds);
    console.log('配置:', config);
    
    // 强制重新生成（不使用缓存）
    const newWeekMenu = generateWeekMenu(recipes, blacklistedIds, config);
    console.log('新生成的周菜单:', newWeekMenu);
    
    setWeekMenu(newWeekMenu);
    setSelectedDayForShopping(null); // 清空选中的日期
    
    // 立即保存到后端
    try {
      await saveData({
        recipes,
        blacklistedIds,
        config,
        weekMenu: newWeekMenu
      });
      console.log('保存成功！');
    } catch (err) {
      console.error('保存周菜单失败:', err);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateMeal = (dayId, mealType, newRecipe) => {
    setWeekMenu(prev => prev.map(day => {
      if (day.id === dayId) {
        return { ...day, [mealType]: newRecipe };
      }
      return day;
    }));
  };

  const blacklistRecipe = (eOrId, maybeId) => {
    const recipeId = typeof eOrId === 'number' ? eOrId : maybeId;
    if (!blacklistedIds.includes(recipeId)) {
      setBlacklistedIds(prev => [...prev, recipeId]);
      const filteredRecipes = recipes.filter(r => r.id !== recipeId);
      setWeekMenu(generateWeekMenu(filteredRecipes, [...blacklistedIds, recipeId], config));
    }
  };

  const whitelistRecipe = (recipeId) => {
    setBlacklistedIds(prev => prev.filter(id => id !== recipeId));
  };

  const clearAllRecipes = () => {
    if (window.confirm('确定要清除所有菜谱吗？此操作无法撤销！')) {
      setRecipes([]);
      setBlacklistedIds([]);
      setWeekMenu([]);
    }
  };

  const generateRecipeWithAI = async () => {
    if (!newRecipe.name.trim()) {
      alert('请先输入菜谱名称！');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const result = await generateRecipeByAI(newRecipe.name.trim());
      if (result.success && result.data) {
        setNewRecipe({
          name: result.data.name || newRecipe.name,
          type: result.data.type || '小荤',
          ingredients: result.data.ingredients || [''],
          steps: result.data.steps || [''],
          time: result.data.time || '',
          calories: result.data.calories || 0,
          difficulty: result.data.difficulty || '简单'
        });
      } else {
        alert('生成失败：' + (result.error || '未知错误'));
      }
    } catch (error) {
      alert('生成失败：' + error.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addRecipe = () => {
    if (newRecipe.name && newRecipe.type) {
      const id = Math.max(...recipes.map(r => r.id), 0) + 1;
      const recipe = { ...newRecipe, id: parseInt(id) };
      setRecipes(recipes => [...recipes, recipe]);
      setNewRecipe({
        name: '',
        type: '小荤',
        ingredients: [''],
        steps: [''],
        time: '',
        calories: 0,
        difficulty: '简单'
      });
      setShowAddRecipe(false);
    }
  };

  const deleteRecipe = (recipeId) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    // 同时从黑名单里也移除
    setBlacklistedIds(prev => prev.filter(id => id !== recipeId));
  };

  const refreshRecipes = async () => {
    try {
      const data = await fetchData();
      if (data) {
        setRecipes(data.recipes);
        setBlacklistedIds(data.blacklistedIds || []);
        setConfig(data.config || { adults: 2, children: 0 });
        if (data.weekMenu && data.weekMenu.length > 0) {
          setWeekMenu(data.weekMenu);
        }
      }
    } catch (err) {
      console.error('刷新数据失败:', err);
    }
  };

  const handleBatchImportSuccess = (importedRecipes) => {
    setRecipes(prev => [...prev, ...importedRecipes]);
  };

  const updateNewRecipeField = (field, value) => {
    setNewRecipe(prev => ({ ...prev, [field]: value }));
  };

  const updateNewRecipeArray = (field, index, value) => {
    setNewRecipe(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addEmptyField = (field) => {
    setNewRecipe(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeField = (field, index) => {
    setNewRecipe(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleCloseDetail = () => {
    setSelectedRecipe(null);
  };

  const exportData = () => {
    const data = {
      recipes,
      blacklistedIds,
      config,
      exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-menu-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (data.recipes) setRecipes(data.recipes);
        if (data.blacklistedIds) setBlacklistedIds(data.blacklistedIds);
        if (data.config) setConfig(data.config);
        
        if (data.recipes) {
          setWeekMenu(generateWeekMenu(
            data.recipes, 
            data.blacklistedIds || [], 
            data.config || config
          ));
        }
        
        setShowImport(false);
        setImportFile(null);
        alert('导入成功！');
      } catch (error) {
        alert('导入失败：无效的文件格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">每周菜谱生成器 v1.1</h1>
              <p className="mt-1 text-orange-100">智能生成适合全家的每周菜谱</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                <Download size={18} />
                导出数据
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
              >
                <FileUp size={18} />
                导入数据
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {loading && (
          <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载数据...</p>
            </div>
          </div>
        )}

        <nav className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('weekmenu')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'weekmenu' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-orange-100'
            }`}
          >
            <UtensilsCrossed size={18} />
            周菜谱
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'recipes' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-orange-100'
            }`}
          >
            <BookOpen size={18} />
            菜谱管理
          </button>
          <button
            onClick={() => setActiveTab('shoppinglist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'shoppinglist' 
                ? 'bg-orange-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-orange-100'
            }`}
          >
            <List size={18} />
            购物清单
          </button>
        </nav>

        {activeTab === 'weekmenu' && (
          <>
            <PeopleConfig
              adults={config.adults}
              children={config.children}
              onAdultsChange={(value) => handleConfigChange('adults', value)}
              onChildrenChange={(value) => handleConfigChange('children', value)}
            />
            <button
              onClick={regenerateWeekMenu}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all mb-6"
            >
              <RefreshCw size={18} />
              重新生成菜谱
            </button>
            <WeekMenu 
              weekMenu={weekMenu}
              onRecipeClick={setSelectedRecipe}
              onBlacklist={blacklistRecipe}
              onDayClick={(day) => {
                setSelectedDayForShopping(day);
                setActiveTab('shoppinglist');
              }}
            />
          </>
        )}

        {activeTab === 'shoppinglist' && (
          <>
            {selectedDayForShopping && (
              <button
                onClick={() => setSelectedDayForShopping(null)}
                className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                ← 返回本周购物清单
              </button>
            )}
            <ShoppingList 
              weekMenu={weekMenu}
              selectedDay={selectedDayForShopping}
            />
          </>
        )}

        {activeTab === 'recipes' && (
          <>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setShowAddRecipe(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
              >
                <Plus size={18} />
                添加菜谱
              </button>
              <button
                onClick={() => setShowBatchImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              >
                <Upload size={18} />
                批量导入
              </button>
              {recipes.length > 0 && (
                <button
                  onClick={clearAllRecipes}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all ml-auto"
                >
                  <span>🗑️</span>
                  清除所有
                </button>
              )}
            </div>
            <RecipeList 
              recipes={recipes}
              blacklistedIds={blacklistedIds}
              onRecipeClick={setSelectedRecipe}
              blacklist={blacklistRecipe}
              whitelist={whitelistRecipe}
              onDelete={deleteRecipe}
            />
          </>
        )}

        {showAddRecipe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">添加新菜谱</h3>
                <button onClick={() => setShowAddRecipe(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <span className="text-gray-500">&times;</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜谱名称</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRecipe.name}
                      onChange={(e) => updateNewRecipeField('name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="输入菜谱名称"
                    />
                    <button
                      onClick={generateRecipeWithAI}
                      disabled={isGeneratingAI || !newRecipe.name.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAI ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Sparkles size={18} />
                      )}
                      {isGeneratingAI ? '生成中...' : 'AI 生成'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">菜式类型</label>
                  <select
                    value={newRecipe.type}
                    onChange={(e) => updateNewRecipeField('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="荤菜">荤菜</option>
                    <option value="小荤">小荤</option>
                    <option value="蔬菜">蔬菜</option>
                    <option value="汤">汤</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">食材清单</label>
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateNewRecipeArray('ingredients', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={`食材 ${index + 1}`}
                      />
                      <button
                        onClick={() => removeField('ingredients', index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addEmptyField('ingredients')} className="text-green-600 text-sm hover:text-green-700">
                    + 添加食材
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">烹饪步骤</label>
                  {newRecipe.steps.map((step, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <textarea
                        value={step}
                        onChange={(e) => updateNewRecipeArray('steps', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder={`步骤 ${index + 1}`}
                        rows={2}
                      />
                      <button
                        onClick={() => removeField('steps', index)}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addEmptyField('steps')} className="text-green-600 text-sm hover:text-green-700">
                    + 添加步骤
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">烹饪时间</label>
                    <input
                      type="text"
                      value={newRecipe.time}
                      onChange={(e) => updateNewRecipeField('time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="如：30分钟"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">热量 (kcal)</label>
                    <input
                      type="number"
                      value={newRecipe.calories}
                      onChange={(e) => updateNewRecipeField('calories', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="如：300"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                    <select
                      value={newRecipe.difficulty}
                      onChange={(e) => updateNewRecipeField('difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="简单">简单</option>
                      <option value="中等">中等</option>
                      <option value="困难">困难</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddRecipe(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    取消
                  </button>
                  <button
                    onClick={addRecipe}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBatchImport && (
          <BatchImport 
            onClose={() => setShowBatchImport(false)}
            refreshRecipes={refreshRecipes}
          />
        )}

        {selectedRecipe && (
          <RecipeDetail 
            recipe={selectedRecipe} 
            onClose={handleCloseDetail}
            onBlacklist={() => blacklistRecipe(selectedRecipe.id)}
            isBlacklisted={blacklistedIds.includes(selectedRecipe.id)}
          />
        )}

        {showImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">导入数据</h3>
                <button onClick={() => setShowImport(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <span className="text-gray-500">&times;</span>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">选择备份文件</label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() => setShowImport(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
