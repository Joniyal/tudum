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
      <div className="bg-black border-4 border-white text-white px-6 py-4 flex items-center gap-4 shadow-lg" style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}>
        {/* Selection Info */}
        <div className="flex items-center gap-2 border-r-2 border-white pr-4">
          <div className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-black text-lg">
            {selectedCount}
          </div>
          <span className="font-black uppercase tracking-wide">SELECTED</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Select All/None */}
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            className="px-3 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition text-sm flex items-center gap-2"
            title={selectedCount === totalCount ? "Deselect All" : "Select All"}
          >
            {selectedCount === totalCount ? "✕ CLEAR" : "✓ ALL"}
          </button>

          {/* Mark Complete */}
          <button
            onClick={onComplete}
            className="px-3 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition text-sm flex items-center gap-2"
            title="Mark all selected as complete"
          >
            ✓ COMPLETE
          </button>

          {/* Create Collection */}
          <button
            onClick={onCreateCollection}
            className="px-3 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition text-sm flex items-center gap-2"
            title="Create collection from selected"
          >
            📁 GROUP
          </button>

          {/* Add to Collection */}
          {collections.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                className="px-3 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition text-sm flex items-center gap-2"
                title="Add to existing collection"
              >
                ➕ ADD TO
              </button>
              {showCollectionMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-black border-2 border-white py-0 min-w-[200px] max-h-[300px] overflow-y-auto">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        onAddToCollection();
                        setShowCollectionMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-white hover:text-black text-white font-bold uppercase text-sm flex items-center gap-2 border-b border-white last:border-b-0"
                    >
                      <div
                        className="w-3 h-3 border border-white"
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
            className="px-3 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition text-sm flex items-center gap-2"
            title="Archive selected habits"
          >
            📦 ARCHIVE
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-black border-2 border-white text-white font-black uppercase hover:bg-white hover:text-black transition text-sm flex items-center gap-2"
            title="Delete selected habits permanently"
          >
            🗑️ DELETE
          </button>
        </div>
      </div>
    </div>
  );
}
