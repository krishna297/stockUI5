import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Star, Search, X } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { StockData } from '../types';

interface DataTableProps {
  data: StockData[];
  selectedSignalType: string;
  onSignalTypeChange: (signalType: string) => void;
  onTogglePick: (stock: StockData) => void;
  isViewingMasterData: boolean;
  onRefresh?: () => void;
}

type SortField = keyof StockData;
type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, selectedSignalType, onSignalTypeChange, onTogglePick, isViewingMasterData, onRefresh }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
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

  const uniqueDates = useMemo(() => {
    const dates = new Set(data.map((item) => item.date));
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [data]);

  const priceMinMax = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0 };
    const prices = data.map((item) => parseFloat(item.stockPrice));
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [data]);

  useEffect(() => {
    setMinPrice(priceMinMax.min);
    setMaxPrice(priceMinMax.max);
    setPriceRange([priceMinMax.min, priceMinMax.max]);
  }, [priceMinMax]);

  useEffect(() => {
    setSelectedDates([]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };

    if (showDateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateDropdown]);

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

    if (selectedDates.length > 0) {
      filtered = filtered.filter((item) => selectedDates.includes(item.date));
    }

    if (priceRange[0] > minPrice || priceRange[1] < maxPrice) {
      filtered = filtered.filter((item) => {
        const price = parseFloat(item.stockPrice);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    return filtered;
  }, [data, selectedSignalType, searchTicker, selectedDates, priceRange, minPrice, maxPrice]);

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
  }, [selectedSignalType, sortField, sortDirection, searchTicker, selectedDates, priceRange]);

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

  const handleDateToggle = (date: string) => {
    setSelectedDates((prev) => {
      if (prev.includes(date)) {
        return prev.filter((d) => d !== date);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleClearDates = () => {
    setSelectedDates([]);
  };

  const handlePriceRangeChange = (index: number, value: number) => {
    const clampedValue = Math.max(minPrice, Math.min(value, maxPrice));
    const newRange: [number, number] = [...priceRange] as [number, number];

    if (index === 0) {
      if (clampedValue <= priceRange[1]) {
        newRange[0] = clampedValue;
        setPriceRange(newRange);
      }
    } else {
      if (clampedValue >= priceRange[0]) {
        newRange[1] = clampedValue;
        setPriceRange(newRange);
      }
    }
  };

  const handleResetPriceRange = () => {
    setPriceRange([minPrice, maxPrice]);
  };

  useEffect(() => {
    if (onRefresh) {
      setSortField(null);
      setSortDirection(null);
      setSearchTicker('');
      setSelectedDates([]);
      setPriceRange([minPrice, maxPrice]);
      setCurrentPage(1);
    }
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className={`grid grid-cols-1 gap-4 ${isViewingMasterData ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
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
          {isViewingMasterData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Date
              </label>
              <div className="relative" ref={dateDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left bg-white"
                >
                  {selectedDates.length === 0 ? (
                    <span className="text-slate-500">Select dates...</span>
                  ) : (
                    <span className="text-slate-900">{selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected</span>
                  )}
                </button>
                {selectedDates.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDates();
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors z-10"
                    title="Clear dates"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                {showDateDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {uniqueDates.map((date) => (
                      <label
                        key={date}
                        className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDates.includes(date)}
                          onChange={() => handleDateToggle(date)}
                          className="mr-3 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{date}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">
              Price Range: ${priceRange[0].toFixed(2)} - ${priceRange[1].toFixed(2)}
            </label>
            {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
              <button
                onClick={handleResetPriceRange}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => handlePriceRangeChange(0, parseFloat(e.target.value) || 0)}
                step="0.01"
                className="w-24 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Min"
              />
              <span className="text-slate-400">to</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => handlePriceRangeChange(1, parseFloat(e.target.value) || 0)}
                step="0.01"
                className="w-24 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Max"
              />
            </div>
            <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 w-10">${minPrice}</span>
            <div className="flex-1 relative h-8 flex items-center">
              <div className="absolute w-full h-2 bg-slate-200 rounded-full"></div>
              <div
                className="absolute h-2 bg-blue-500 rounded-full"
                style={{
                  left: `${((priceRange[0] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                  right: `${100 - ((priceRange[1] - minPrice) / (maxPrice - minPrice)) * 100}%`,
                }}
              ></div>
              <input
                type="range"
                value={priceRange[0]}
                onChange={(e) => handlePriceRangeChange(0, parseFloat(e.target.value))}
                min={minPrice}
                max={maxPrice}
                step="0.01"
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer z-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
              />
              <input
                type="range"
                value={priceRange[1]}
                onChange={(e) => handlePriceRangeChange(1, parseFloat(e.target.value))}
                min={minPrice}
                max={maxPrice}
                step="0.01"
                className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto cursor-pointer z-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-0"
              />
            </div>
            <span className="text-xs text-slate-600 w-10 text-right">${maxPrice}</span>
            </div>
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
