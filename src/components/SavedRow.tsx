"use client";

import { ReactNode } from "react";

interface SavedRowProps {
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onLog: () => void;
  onEdit: () => void;
  onDelete: () => void;
  primary: string;
  secondary?: string;
  editForm?: ReactNode;
}

// Shared row for the My Foods / My Exercises lists. Behavior:
// - Tap the row to select it (toggles off if it's already selected).
// - When selected, three action buttons appear: ✓ log, ✎ edit, × delete.
// - Editing replaces the entire row with the slot-provided edit form.
export default function SavedRow({
  selected, editing, onSelect, onLog, onEdit, onDelete,
  primary, secondary, editForm,
}: SavedRowProps) {
  if (editing && editForm) {
    return (
      <div className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
        {editForm}
      </div>
    );
  }
  return (
    <div
      className="list-row"
      onClick={onSelect}
      style={{
        cursor: "pointer",
        background: selected ? "#f5eeff" : "transparent",
        borderRadius: 6,
        paddingLeft: selected ? 8 : 0,
        paddingRight: selected ? 8 : 0,
        transition: "background 0.15s, padding 0.15s",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{primary}</div>
        {secondary && (
          <div className="text-[10px]" style={{ color: "#9b80b8" }}>{secondary}</div>
        )}
      </div>
      {selected && (
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onLog}
            className="delete-btn"
            title="Log"
            style={{ background: "#dff5e3", color: "#2d8a4e" }}
          >✓</button>
          <button
            onClick={onEdit}
            className="delete-btn"
            title="Edit"
            style={{ background: "#ede0f5", color: "#7c3aed" }}
          >✎</button>
          <button onClick={onDelete} className="delete-btn" title="Remove">×</button>
        </div>
      )}
    </div>
  );
}
