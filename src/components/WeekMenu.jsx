import { useState } from 'react';
import { ChefHat, Clock, Sun, Moon, ChevronDown, X, Trash2 } from 'lucide-react';

function WeekMenu({ weekMenu, onRecipeClick, onBlacklist, onDayClick }) {
  const [expandedDay, setExpandedDay] = useState('all');

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

  return (
    <div className="space-y-6">
      {weekMenu.map((day) => (
        <div 
          key={day.id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => onDayClick && onDayClick(day)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                {day.name.slice(-1)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{day.name}</h3>
                <p className="text-sm text-gray-500">
                  晚餐{day.dinner?.length}道菜 · 点击查看购物清单
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedDay(expandedDay === day.id ? null : day.id);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  (expandedDay === day.id || expandedDay === 'all') ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </div>

          {(expandedDay === day.id || expandedDay === 'all') && (
            <div className="px-4 pb-4 space-y-4">
              {/* 晚餐 */}
              {day.dinner && day.dinner.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-700">
                      <Moon size={16} />
                    </div>
                    <span className="font-medium text-gray-700">晚餐</span>
                  </div>
                  <div className="grid gap-2">
                    {day.dinner.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getTypeColor(item.recipe.type)}`}>
                          {item.recipe.type}
                        </div>
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => onRecipeClick(item.recipe)}
                        >
                          <div className="font-medium text-gray-800">{item.recipe.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock size={14} />
                            {item.recipe.time}
                          </div>
                        </div>
                        <button
                          onClick={(e) => onBlacklist(e, item.recipe.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="拉黑此菜品"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default WeekMenu;
