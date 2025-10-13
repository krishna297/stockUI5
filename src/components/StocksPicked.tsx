import { X, TrendingUp } from 'lucide-react';
import { PickedStock } from '../types';

interface StocksPickedProps {
  pickedStocks: PickedStock[];
  onRemoveStock: (stockId: string) => void;
}

export function StocksPicked({ pickedStocks, onRemoveStock }: StocksPickedProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">Stocks Picked</h2>
          <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {pickedStocks.length} {pickedStocks.length === 1 ? 'stock' : 'stocks'}
          </span>
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
            {pickedStocks.map((stock) => (
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
                    <span className="text-sm text-slate-600">Price</span>
                    <span className="text-lg font-semibold text-slate-800">
                      ${stock.stock_price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Date</span>
                    <span className="text-sm text-slate-700">{stock.date}</span>
                  </div>
                  {stock.source_file && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-xs text-slate-500">{stock.source_file}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
