import { useState, useEffect } from 'react';
import { RefreshCw, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DataTable } from './components/DataTable';
import { ChatRoom } from './components/ChatRoom';
import { StocksPicked } from './components/StocksPicked';
import { Suggestions } from './components/Suggestions';
import { Directory, StockData, PickedStock } from './types';
import { loadSingleFile, loadMasterFiles } from './utils/fileLoader';
import { supabase } from './lib/supabase';

function findMasterDirectory(directories: Directory[]): Directory | null {
  for (const dir of directories) {
    if (dir.name === 'master') {
      return dir;
    }
    if (dir.subdirectories && dir.subdirectories.length > 0) {
      const found = findMasterDirectory(dir.subdirectories);
      if (found) return found;
    }
  }
  return null;
}

function App() {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [data, setData] = useState<StockData[]>([]);
  const [selectedFile, setSelectedFile] = useState<{
    directory: string;
    file: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSignalType, setSelectedSignalType] = useState('All');
  const [loadingDirectories, setLoadingDirectories] = useState(true);
  const [masterFiles, setMasterFiles] = useState<string[]>([]);
  const [masterPath, setMasterPath] = useState<string>('master');
  const [pickedStocks, setPickedStocks] = useState<PickedStock[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'data' | 'picked' | 'suggestions'>('data');

  const loadPickedStocks = async () => {
    const { data, error } = await supabase
      .from('picked_stocks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading picked stocks:', error);
      return;
    }

    setPickedStocks(data || []);
  };

  const loadDirectories = async () => {
    setLoadingDirectories(true);
    try {
      const response = await fetch('/api/files');
      const { directories: dirs } = await response.json();
      setDirectories(dirs);

      const master = findMasterDirectory(dirs);
      if (master && master.files.length > 0) {
        setMasterFiles(master.files);
        setMasterPath(master.path);
      } else {
        setMasterFiles([]);
        setMasterPath('master');
      }
    } catch (error) {
      console.error('Error loading directories:', error);
    } finally {
      setLoadingDirectories(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (selectedFile) {
        const fileData = await loadSingleFile(
          selectedFile.directory,
          selectedFile.file
        );
        setData(fileData);
      } else if (masterFiles.length > 0) {
        const fileData = await loadMasterFiles(masterFiles, masterPath);
        setData(fileData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectories();
    loadPickedStocks();

    const channel = supabase
      .channel('picked_stocks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'picked_stocks' }, () => {
        loadPickedStocks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!loadingDirectories) {
      loadData();
    }
  }, [selectedFile, masterFiles, loadingDirectories]);

  useEffect(() => {
    setSelectedSignalType('All');
  }, [selectedFile]);

  const handleFileSelect = (directory: string, file: string) => {
    if (
      selectedFile?.directory === directory &&
      selectedFile?.file === file
    ) {
      setSelectedFile(null);
    } else {
      setSelectedFile({ directory, file });
    }
  };

  const handleAllDataSelect = () => {
    setSelectedFile(null);
  };

  const handleTogglePick = async (stock: StockData) => {
    const existingPick = pickedStocks.find(
      (ps) =>
        ps.ticker_name === stock.tickerName &&
        ps.signal_type === stock.signalType &&
        ps.date === stock.date
    );

    if (existingPick) {
      const { error } = await supabase
        .from('picked_stocks')
        .delete()
        .eq('id', existingPick.id);

      if (error) {
        console.error('Error removing picked stock:', error);
      }
    } else {
      const { error } = await supabase.from('picked_stocks').insert([
        {
          ticker_name: stock.tickerName,
          signal_type: stock.signalType,
          stock_price: stock.stockPrice,
          date: stock.date,
          source_file: stock.sourceFile,
        },
      ]);

      if (error) {
        console.error('Error adding picked stock:', error);
      }
    }
  };

  const handleRemovePickedStock = async (stockId: string) => {
    const { error } = await supabase
      .from('picked_stocks')
      .delete()
      .eq('id', stockId);

    if (error) {
      console.error('Error removing picked stock:', error);
    }
  };

  const dataWithPickedStatus = data.map((stock) => ({
    ...stock,
    isPicked: pickedStocks.some(
      (ps) =>
        ps.ticker_name === stock.tickerName &&
        ps.signal_type === stock.signalType &&
        ps.date === stock.date
    ),
  }));

  const handleRefresh = async () => {
    await loadDirectories();
    loadData();
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        directories={directories}
        onFileSelect={handleFileSelect}
        onAllDataSelect={handleAllDataSelect}
        selectedFile={selectedFile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors mr-2"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {currentView === 'data' && 'Stock Data Viewer'}
                {currentView === 'picked' && 'Stocks Picked'}
                {currentView === 'suggestions' && 'Suggestions'}
              </h1>
              {currentView === 'data' && (
                selectedFile ? (
                  <p className="text-sm text-slate-600 mt-1">
                    Viewing: {selectedFile.directory}/{selectedFile.file}
                  </p>
                ) : masterFiles.length > 0 ? (
                  <p className="text-sm text-slate-600 mt-1">
                    Viewing: All Data ({masterFiles.length} {masterFiles.length === 1 ? 'file' : 'files'})
                  </p>
                ) : (
                  <p className="text-sm text-slate-600 mt-1">
                    No data available
                  </p>
                )
              )}
            </div>

            {currentView === 'data' && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {currentView === 'data' && (
            loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-slate-600">Loading data...</p>
                </div>
              </div>
            ) : (
              <DataTable
                data={dataWithPickedStatus}
                selectedSignalType={selectedSignalType}
                onSignalTypeChange={setSelectedSignalType}
                onTogglePick={handleTogglePick}
              />
            )
          )}
          {currentView === 'picked' && (
            <StocksPicked
              pickedStocks={pickedStocks}
              onRemoveStock={handleRemovePickedStock}
            />
          )}
          {currentView === 'suggestions' && (
            <Suggestions />
          )}
        </main>
      </div>
      <ChatRoom />
    </div>
  );
}

export default App;
