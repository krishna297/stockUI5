import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Star, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { StockData } from '../types';

interface DataTableProps {
  data: StockData[];
  selectedSignalType: string;
  onSignalTypeChange: (signalType: string) => void;
  onTogglePick: (stock: StockData) => void;
}

type SortField = keyof StockData;
type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, selectedSignalType, onSignalTypeChange, onTogglePick }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTicker, setSearchTicker] = useState('');
  const itemsPerPage = 20;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const uniqueSignalTypes = useMemo(() => {
    const types = new Set(data.map((item) => item.signalType));
    return ['All', ...Array.from(types).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    let filtered = data;

    if (selectedSignalType !== 'All') {
      filtered = filtered.filter((item) => item.signalType === selectedSignalType);
    }

    if (searchTicker.trim()) {
      filtered = filtered.filter((item) =>
        item.tickerName.toLowerCase().includes(searchTicker.toLowerCase())
      );
    }

    return filtered;
  }, [data, selectedSignalType, searchTicker]);

  const sortedData = useMemo(() => {
    let dataToSort = filteredData;

    if (sortField && sortDirection) {
      dataToSort = [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (sortField === 'stockPrice') {
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (sortField === 'date') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return dataToSort;
  }, [filteredData, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useMemo(() => {
    setCurrentPage(1);
  }, [selectedSignalType, sortField, sortDirection, searchTicker]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4" />;
    }
    return <ArrowDown className="w-4 h-4" />;
  };

  const columns: { field: SortField; label: string }[] = [
    { field: 'tickerName', label: 'Ticker Name' },
    { field: 'signalType', label: 'Signal Type' },
    { field: 'stockPrice', label: 'Stock Price' },
    { field: 'date', label: 'Date' },
  ];

  const handlePickStock = (row: StockData) => {
    onTogglePick(row);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="searchTicker" className="block text-sm font-medium text-slate-700 mb-2">
              Search Ticker
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="searchTicker"
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                placeholder="Search by ticker name..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div>
            <label htmlFor="signalType" className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Signal Type
            </label>
            <select
              id="signalType"
              value={selectedSignalType}
              onChange={(e) => onSignalTypeChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {uniqueSignalTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                Pick
              </th>
              {columns.map((column) => (
                <th
                  key={column.field}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  <button
                    onClick={() => handleSort(column.field)}
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors"
                  >
                    {column.label}
                    {getSortIcon(column.field)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handlePickStock(row)}
                    className={`p-1 rounded transition-colors ${
                      row.isPicked
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
                    title={row.isPicked ? 'Remove from picked stocks' : 'Add to picked stocks'}
                  >
                    <Star className={`w-5 h-5 ${row.isPicked ? 'fill-current' : ''}`} />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {row.tickerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      row.signalType.includes('Sell')
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {row.signalType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  ${row.stockPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {row.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedData.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No data available
          </div>
        )}
      </div>

      {sortedData.length > 0 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} {sortedData.length === 1 ? 'record' : 'records'}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
