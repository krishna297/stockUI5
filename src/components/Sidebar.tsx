import { Folder, FileJson, ChevronRight, ChevronDown, Home, Star, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Directory } from '../types';

interface SidebarProps {
  directories: Directory[];
  onFileSelect: (directory: string, file: string) => void;
  onAllDataSelect: () => void;
  selectedFile: { directory: string; file: string } | null;
  isOpen: boolean;
  onClose: () => void;
  currentView: 'data' | 'picked' | 'suggestions';
  onViewChange: (view: 'data' | 'picked' | 'suggestions') => void;
}

export function Sidebar({ directories, onFileSelect, onAllDataSelect, selectedFile, isOpen, onClose, currentView, onViewChange }: SidebarProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const visibleDirectories = directories.filter((dir) => dir.name !== 'master');

  const toggleDirectory = (dirPath: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }
    setExpandedDirs(newExpanded);
  };

  const renderDirectory = (directory: Directory, depth: number = 0): JSX.Element => {
    const isExpanded = expandedDirs.has(directory.path);
    const hasContent = directory.files.length > 0 || directory.subdirectories.length > 0;

    return (
      <div key={directory.path} className="mb-1">
        <button
          onClick={() => toggleDirectory(directory.path)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-700 transition-colors text-left"
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {hasContent && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )
          )}
          <Folder className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{directory.name}</span>
          <span className="ml-auto text-xs text-slate-400">
            {directory.files.length}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-1">
            {directory.files.length > 0 && (
              <div className="space-y-1" style={{ paddingLeft: `${depth * 12 + 24}px` }}>
                {directory.files.map((file) => {
                  const isSelected =
                    selectedFile?.directory === directory.path &&
                    selectedFile?.file === file;

                  return (
                    <button
                      key={file}
                      onClick={() => {
                        onFileSelect(directory.path, file);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-slate-700'
                      }`}
                    >
                      <FileJson className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{file}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {directory.subdirectories.map((subdir) => renderDirectory(subdir, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-800 text-slate-100 h-screen overflow-y-auto flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Data Explorer
        </h2>
      </div>

      <nav className="flex-1 p-2">
        <div className="space-y-1 mb-3">
          <button
            onClick={() => {
              onViewChange('data');
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              currentView === 'data'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700'
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Stock Data</span>
          </button>
          <button
            onClick={() => {
              onViewChange('picked');
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              currentView === 'picked'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700'
            }`}
          >
            <Star className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Stocks Picked</span>
          </button>
          <button
            onClick={() => {
              onViewChange('suggestions');
              onClose();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-colors ${
              currentView === 'suggestions'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Suggestions</span>
          </button>
        </div>

        {currentView === 'data' && (
          <>
            <div className="border-t border-slate-700 mb-3"></div>
            <button
              onClick={() => {
                onAllDataSelect();
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded mb-3 transition-colors ${
                selectedFile === null
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-slate-700'
              }`}
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">All Data</span>
            </button>
          </>
        )}
        {currentView === 'data' && visibleDirectories.map((directory) => renderDirectory(directory))}

        {currentView === 'data' && visibleDirectories.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-8">
            No directories found
          </div>
        )}
      </nav>
    </div>
  );
}
