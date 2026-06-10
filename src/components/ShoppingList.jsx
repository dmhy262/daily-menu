import { useState, useEffect } from 'react';
import { ShoppingCart, Check, Plus, Minus, Trash2 } from 'lucide-react';

function ShoppingList({ weekMenu, selectedDay }) {
  const [items, setItems] = useState(() => {
    const allIngredients = [];
    
    // 决定要处理哪些天
    const daysToProcess = selectedDay ? [selectedDay] : weekMenu;
    
    daysToProcess.forEach(day => {
      const mealItems = day.dinner;
      if (Array.isArray(mealItems)) {
        // 只计算晚餐
        mealItems.forEach(item => {
          if (item.recipe && item.recipe.ingredients) {
            item.recipe.ingredients.forEach(ingredient => {
              const [name, quantity] = ingredient.split(/(\d+.?\d*)/).filter(Boolean);
              const cleanName = name ? name.trim() : ingredient.trim();
              const existingItem = allIngredients.find(item => item.name === cleanName);
              if (existingItem) {
                existingItem.quantity = (parseFloat(existingItem.quantity) || 0) + (parseFloat(quantity) || 1);
              } else {
                allIngredients.push({
                  id: Date.now() + Math.random(),
                  name: cleanName,
                  quantity: parseFloat(quantity) || 1,
                  unit: cleanName ? ingredient.replace(cleanName, '').replace(quantity || '', '').trim() || '个' : '个',
                  purchased: false
                });
              }
            });
          }
        });
      }
    });
    return allIngredients;
  });

  // 当选择的天数变化时，重新生成购物清单
  useEffect(() => {
    const allIngredients = [];
    
    const daysToProcess = selectedDay ? [selectedDay] : weekMenu;
    
    daysToProcess.forEach(day => {
      const mealItems = day.dinner;
      if (Array.isArray(mealItems)) {
        mealItems.forEach(item => {
          if (item.recipe && item.recipe.ingredients) {
            item.recipe.ingredients.forEach(ingredient => {
              const [name, quantity] = ingredient.split(/(\d+.?\d*)/).filter(Boolean);
              const cleanName = name ? name.trim() : ingredient.trim();
              const existingItem = allIngredients.find(item => item.name === cleanName);
              if (existingItem) {
                existingItem.quantity = (parseFloat(existingItem.quantity) || 0) + (parseFloat(quantity) || 1);
              } else {
                allIngredients.push({
                  id: Date.now() + Math.random(),
                  name: cleanName,
                  quantity: parseFloat(quantity) || 1,
                  unit: cleanName ? ingredient.replace(cleanName, '').replace(quantity || '', '').trim() || '个' : '个',
                  purchased: false
                });
              }
            });
          }
        });
      }
    });
    
    setItems(allIngredients);
  }, [weekMenu, selectedDay]);

  const togglePurchased = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, purchased: !item.purchased } : item
    ));
  };

  const updateQuantity = (id, delta) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0.5, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const purchasedCount = items.filter(item => item.purchased).length;
  const totalCount = items.length;

  const categoryItems = {
    '蔬菜': items.filter(item => 
      ['番茄', '青菜', '黄瓜', '胡萝卜', '土豆', '西兰花', '青椒', '木耳'].some(keyword => item.name.includes(keyword))
    ),
    '肉类': items.filter(item => 
      ['肉', '排骨', '牛腩', '鸡', '鱼', '虾', '火腿'].some(keyword => item.name.includes(keyword))
    ),
    '蛋类': items.filter(item => 
      item.name.includes('鸡蛋')
    ),
    '其他': items.filter(item => 
      !['番茄', '青菜', '黄瓜', '胡萝卜', '土豆', '西兰花', '青椒', '木耳', '肉', '排骨', '牛腩', '鸡', '鱼', '虾', '火腿', '鸡蛋'].some(keyword => item.name.includes(keyword))
    )
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} />
            <div>
              <h2 className="text-xl font-bold">
                {selectedDay ? `${selectedDay.name}购物清单` : '本周购物清单'}
              </h2>
              {selectedDay && (
                <p className="text-sm text-orange-100 mt-1">
                  {selectedDay.dinner?.length}道菜
                </p>
              )}
            </div>
          </div>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {purchasedCount}/{totalCount} 已购
          </span>
        </div>
      </div>

      <div className="p-4">
        {Object.entries(categoryItems).map(([category, categoryItemsList]) => (
          <div key={category} className="mb-4">
            {categoryItemsList.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 pb-1 border-b border-gray-100">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryItemsList.map(item => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        item.purchased ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <button
                        onClick={() => togglePurchased(item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          item.purchased 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        <Check size={14} />
                      </button>
                      <div className="flex-1">
                        <span className={`font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.id, -0.5)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-12 text-center text-gray-700">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 0.5)}
                          className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-6 h-6 text-gray-400 hover:text-red-500 flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShoppingList;
