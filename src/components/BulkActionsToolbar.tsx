"use client";

import { useState } from "react";

type BulkActionsToolbarProps = {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onCreateCollection: () => void;
  onAddToCollection: () => void;
  onComplete: () => void;
  collections: Array<{ id: string; name: string; color: string }>;
};

export default function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onArchive,
  onCreateCollection,
  onAddToCollection,
  onComplete,
  collections,
}: BulkActionsToolbarProps) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 backdrop-blur-lg border border-white/20">
        {/* Selection Info */}
        <div className="flex items-center gap-2 border-r border-white/30 pr-4">
          <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center font-bold">
            {selectedCount}
          </div>
          <span className="font-medium">selected</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Select All/None */}
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
            title={selectedCount === totalCount ? "Deselect All" : "Select All"}
          >
            {selectedCount === totalCount ? "✕ Clear" : "✓ All"}
          </button>

          {/* Mark Complete */}
          <button
            onClick={onComplete}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
            title="Mark all selected as complete"
          >
            ✓ Complete
          </button>

          {/* Create Collection */}
          <button
            onClick={onCreateCollection}
            className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
            title="Create collection from selected"
          >
            📁 Group
          </button>

          {/* Add to Collection */}
          {collections.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
                title="Add to existing collection"
              >
                ➕ Add to
              </button>
              {showCollectionMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        onAddToCollection();
                        setShowCollectionMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center gap-2"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: collection.color }}
                      />
                      {collection.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Archive */}
          <button
            onClick={onArchive}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
            title="Archive selected habits"
          >
            📦 Archive
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
            title="Delete selected habits permanently"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
