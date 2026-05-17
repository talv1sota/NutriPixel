"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface SavedItemModalProps {
  title: string;
  isEditing: boolean;
  saving?: boolean;
  onClose: () => void;
  onLog: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  view: ReactNode;
  editForm: ReactNode;
}

// Recipes-style modal used by My Foods / My Exercises. View mode shows the
// item details with a small inline "edit" button (mirrors recipes), and Log
// / Delete sit at the bottom. Edit mode swaps in the caller's form with
// Save / Cancel at the bottom.
export default function SavedItemModal({
  title, isEditing, saving,
  onClose, onLog, onEdit, onSave, onCancelEdit,
  view, editForm,
}: SavedItemModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(75, 40, 110, 0.55)",
        zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="window slidein"
        style={{
          maxWidth: 480, width: "100%",
          maxHeight: "calc(100vh - 48px)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div className="window-title" style={{ flexShrink: 0 }}>
          <span>{isEditing ? "📝" : "✦"} {title}</span>
          <button onClick={onClose} className="delete-btn" style={{ color: "white", fontSize: 18 }}>×</button>
        </div>
        <div className="window-body space-y-4" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {isEditing ? (
            <div className="space-y-3">
              {editForm}
              <div className="flex gap-2">
                <button onClick={onSave} disabled={saving} className="btn-pink flex-1 py-2">
                  {saving ? "saving..." : "✧ Save ✧"}
                </button>
                <button onClick={onCancelEdit} className="btn-blue py-2" style={{ padding: "0 16px" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-end gap-2">
                <button
                  onClick={onEdit}
                  className="btn-blue btn-sm"
                  style={{ fontSize: 9, padding: "3px 8px", flexShrink: 0 }}
                >edit</button>
              </div>
              {view}
              <button onClick={onLog} className="btn-pink w-full py-2">
                ✧ Log ✧
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
