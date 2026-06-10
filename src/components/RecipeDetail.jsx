import { X, Clock, ChefHat, Flame, List, AlertCircle } from 'lucide-react';

function RecipeDetail({ recipe, onClose, onBlacklist, isBlacklisted }) {
  if (!recipe) return null;

  const getTypeLabel = (type) => {
    switch (type) {
      case 'breakfast':
        return '早餐';
      case 'lunch':
        return '午餐';
      case 'dinner':
        return '晚餐';
      default:
        return '其他';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-orange-400 to-amber-500 rounded-t-xl flex items-center justify-center">
            <div className="text-6xl">🍳</div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{recipe.name}</h2>
              <span className="inline-block mt-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                {getTypeLabel(recipe.type)}
              </span>
            </div>
            <button
              onClick={onBlacklist}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                isBlacklisted
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <AlertCircle size={16} />
              {isBlacklisted ? '取消拉黑' : '拉黑'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Clock size={24} className="mx-auto text-orange-500 mb-1" />
              <div className="text-sm text-gray-500">时间</div>
              <div className="font-medium text-gray-800">{recipe.time}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <ChefHat size={24} className="mx-auto text-orange-500 mb-1" />
              <div className="text-sm text-gray-500">难度</div>
              <div className="font-medium text-gray-800">{recipe.difficulty}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Flame size={24} className="mx-auto text-orange-500 mb-1" />
              <div className="text-sm text-gray-500">热量</div>
              <div className="font-medium text-gray-800">{recipe.calories} kcal</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <List size={20} className="text-orange-500" />
              食材清单
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ChefHat size={20} className="text-orange-500" />
              烹饪步骤
            </h3>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;
