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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="retro-panel px-6 py-4 flex items-center gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-2 border-r-2 border-[color:var(--border)] pr-4">
          <div className="retro-badge w-8 h-8 text-base">
            {selectedCount}
          </div>
          <span className="retro-subheading text-xs">Selected</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Select All/None */}
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="retro-button-outline px-3 py-2 text-xs flex items-center gap-2"
            title={selectedCount === totalCount ? "Deselect All" : "Select All"}
          >
            {selectedCount === totalCount ? "✕ Clear" : "✓ All"}
          </button>

          {/* Mark Complete */}
          <button
            onClick={onComplete}
            className="retro-button-outline px-3 py-2 text-xs flex items-center gap-2"
            title="Mark all selected as complete"
          >
            ✓ Complete
          </button>

          {/* Create Collection */}
          <button
            onClick={onCreateCollection}
            className="retro-button-outline px-3 py-2 text-xs flex items-center gap-2"
            title="Create collection from selected"
          >
            📁 Group
          </button>

          {/* Add to Collection */}
          {collections.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                className="retro-button-outline px-3 py-2 text-xs flex items-center gap-2"
                title="Add to existing collection"
              >
                ➕ Add To
              </button>
              {showCollectionMenu && (
                <div className="absolute bottom-full mb-2 left-0 retro-panel py-0 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        onAddToCollection();
                        setShowCollectionMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[color:var(--text)] hover:text-[color:var(--background)] font-bold uppercase text-xs flex items-center gap-2 border-b border-[color:var(--border)] last:border-b-0"
                    >
                      <div
                        className="w-3 h-3 border border-[color:var(--border)] opacity-30"
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
            className="retro-button-outline px-3 py-2 text-xs flex items-center gap-2"
            title="Archive selected habits"
          >
            📦 Archive
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="retro-button px-3 py-2 text-xs flex items-center gap-2"
            title="Delete selected habits permanently"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
