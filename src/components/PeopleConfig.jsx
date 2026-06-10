import { Users, Baby } from 'lucide-react';

function PeopleConfig({ adults, children, onAdultsChange, onChildrenChange }) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Users className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">成人数量</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdultsChange(Math.max(1, adults - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="20"
              value={adults}
              onChange={(e) => onAdultsChange(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 text-center px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <button
              onClick={() => onAdultsChange(Math.min(20, adults + 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Baby className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">儿童数量</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChildrenChange(Math.max(0, children - 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              max="10"
              value={children}
              onChange={(e) => onChildrenChange(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 text-center px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
            <button
              onClick={() => onChildrenChange(Math.min(10, children + 1))}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="ml-auto text-right">
        <div className="text-sm text-gray-500">用餐总人数</div>
        <div className="text-2xl font-bold text-orange-500">{adults + children} 人</div>
      </div>
    </div>
  );
}

export default PeopleConfig;
