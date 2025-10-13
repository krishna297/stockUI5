import { X, TrendingUp, ArrowUpDown } from 'lucide-react';
import { PickedStock } from '../types';
import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

interface StocksPickedProps {
  pickedStocks: PickedStock[];
  onRemoveStock: (stockId: string) => void;
  onPriorityUpdate?: () => void;
}

type SortBy = 'date' | 'priority';

export function StocksPicked({ pickedStocks, onRemoveStock, onPriorityUpdate }: StocksPickedProps) {
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const handlePriorityChange = async (stockId: string, newPriority: 'high' | 'moderate' | 'low') => {
    const { error } = await supabase
      .from('picked_stocks')
      .update({ priority: newPriority })
      .eq('id', stockId);

    if (error) {
      console.error('Error updating priority:', error);
    }
  };

  const sortedStocks = useMemo(() => {
    const stocks = [...pickedStocks];

    if (sortBy === 'priority') {
      const priorityOrder = { high: 1, moderate: 2, low: 3 };
      return stocks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
      return stocks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [pickedStocks, sortBy]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-3 flex-1">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Stocks Picked</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {pickedStocks.length} {pickedStocks.length === 1 ? 'stock' : 'stocks'}
            </span>
          </div>
          {pickedStocks.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-slate-700">
                Sort by:
              </label>
              <button
                onClick={() => setSortBy('date')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'date'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('priority')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  sortBy === 'priority'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Priority
              </button>
            </div>
          )}
        </div>

        {pickedStocks.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No stocks picked yet</p>
            <p className="text-slate-400 text-sm mt-2">
              Pick stocks from the Stock Data view to track them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-slate-50 rounded-lg p-4 hover:shadow-md transition-shadow border border-slate-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {stock.ticker_name}
                    </h3>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        stock.signal_type.includes('Sell')
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {stock.signal_type}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveStock(stock.id)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from picked stocks"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Priority</span>
                    <select
                      value={stock.priority}
                      onChange={(e) => handlePriorityChange(stock.id, e.target.value as 'high' | 'moderate' | 'low')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(stock.priority)}`}
                    >
                      <option value="high">High</option>
                      <option value="moderate">Moderate</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Price</span>
                    <span className="text-lg font-semibold text-slate-800">
                      ${stock.stock_price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Date</span>
                    <span className="text-sm text-slate-700">{stock.date}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500">
                      {stock.source_file || 'No source'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
