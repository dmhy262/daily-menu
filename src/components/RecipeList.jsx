import { Clock, ChefHat, Flame, AlertCircle, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

function RecipeList({ recipes, blacklistedIds, onRecipeClick, blacklist, whitelist, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || recipe.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const nonBlacklisted = filteredRecipes.filter(r => !blacklistedIds.includes(r.id));
  const blacklisted = filteredRecipes.filter(r => blacklistedIds.includes(r.id));

  const getTypeColor = (type) => {
    switch (type) {
      case '荤菜':
        return 'bg-red-100 text-red-700';
      case '小荤':
        return 'bg-orange-100 text-orange-700';
      case '蔬菜':
        return 'bg-green-100 text-green-700';
      case '汤':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderRecipeCard = (recipe, isBlacklisted) => (
    <div 
      key={recipe.id}
      className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
        isBlacklisted ? 'border-gray-200 opacity-60' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 mb-1 truncate">{recipe.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(recipe.type)}`}>
              {recipe.type}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={12} /> {recipe.time}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Flame size={12} /> {recipe.calories} kcal
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <ChefHat size={12} /> {recipe.difficulty}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => isBlacklisted ? whitelist(recipe.id) : blacklist(recipe.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
              isBlacklisted
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isBlacklisted ? (
              <>
                <RotateCcw size={14} />
                恢复
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                拉黑
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (window.confirm(`确定要删除菜谱"${recipe.name}"吗？`)) {
                onDelete(recipe.id);
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-all"
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </div>
      
      {!isBlacklisted && (
        <button
          onClick={() => onRecipeClick(recipe)}
          className="mt-3 w-full text-left text-sm text-orange-600 hover:text-orange-700 py-1 border-t border-gray-50 pt-3"
        >
          查看详情
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="搜索菜谱名称..."
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="all">全部</option>
          <option value="荤菜">荤菜</option>
          <option value="小荤">小荤</option>
          <option value="蔬菜">蔬菜</option>
          <option value="汤">汤</option>
        </select>
      </div>

      {nonBlacklisted.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">可用菜谱 ({nonBlacklisted.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonBlacklisted.map(recipe => renderRecipeCard(recipe, false))}
          </div>
        </div>
      )}

      {blacklisted.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">已拉黑 ({blacklisted.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blacklisted.map(recipe => renderRecipeCard(recipe, true))}
          </div>
        </div>
      )}

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ChefHat size={48} className="mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的菜谱</p>
        </div>
      )}
    </div>
  );
}

export default RecipeList;
