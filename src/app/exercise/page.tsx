"use client";

import { useEffect, useState, useCallback } from "react";
import Window from "@/components/Window";
import { todayStr } from "@/lib/helpers";

interface Exercise {
  id: number; name: string; caloriesBurned: number; duration: number; date: string;
}

interface SavedExercise {
  id: number;
  name: string;
  defaultDuration: number;
  defaultCalories: number;
  lastUsedDate: string | null;
}

const presets = [
  { name: "Walking (brisk)", met: 4.3 },
  { name: "Running (6 mph)", met: 9.8 },
  { name: "Cycling", met: 7.5 },
  { name: "Swimming", met: 8.0 },
  { name: "Weight Training", met: 5.0 },
  { name: "HIIT", met: 10.0 },
  { name: "Yoga", met: 3.0 },
  { name: "Jump Rope", met: 11.0 },
  { name: "Elliptical", met: 5.5 },
  { name: "Stair Climbing", met: 8.0 },
  { name: "Dancing", met: 5.5 },
  { name: "Pilates", met: 3.5 },
];

function calcBurn(met: number, weightLbs: number, durationMin: number) {
  const kg = weightLbs * 0.453592;
  return Math.round(met * kg * (durationMin / 60));
}

export default function ExercisePage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saved, setSaved] = useState<SavedExercise[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [calories, setCalories] = useState("");
  const [date, setDate] = useState(todayStr());
  const [flash, setFlash] = useState("");
  const [userWeight, setUserWeight] = useState<number>(135);
  const [selectedMet, setSelectedMet] = useState<number | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", duration: "", calories: "" });

  useEffect(() => {
    fetch("/api/weight").then(r => r.json()).then((ws: { weight: number }[]) => {
      if (ws.length > 0) setUserWeight(ws[ws.length - 1].weight);
    });
  }, []);

  const refreshSaved = useCallback(async () => {
    const list: SavedExercise[] = await fetch("/api/saved-exercise").then(r => r.json());
    setSaved(list);
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/exercise?date=${date}`);
    setExercises(await res.json());
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { refreshSaved(); }, [refreshSaved]);

  const showFlash = (msg: string, ms = 2000) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), ms);
  };

  const pickPreset = (preset: typeof presets[0]) => {
    setName(preset.name);
    setSelectedMet(preset.met);
    const dur = parseInt(duration) || 30;
    setCalories(String(calcBurn(preset.met, userWeight, dur)));
  };

  const pickSaved = (s: SavedExercise) => {
    setName(s.name);
    setDuration(String(s.defaultDuration));
    setCalories(String(Math.round(s.defaultCalories)));
    setSelectedMet(null);
  };

  const handleDurationChange = (val: string) => {
    setDuration(val);
    if (selectedMet) {
      setCalories(String(calcBurn(selectedMet, userWeight, parseInt(val) || 30)));
    }
  };

  const handleLog = async () => {
    if (!name || !calories || !duration) return;
    const res = await fetch("/api/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, caloriesBurned: parseFloat(calories),
        duration: parseInt(duration), date,
      }),
    });
    if (!res.ok) {
      showFlash(`✗ Could not log (${res.status})`, 6000);
      return;
    }
    showFlash(`Logged ${name}!`);
    setName(""); setCalories(""); setDuration("30"); setSelectedMet(null);
    fetchData();
    refreshSaved();
  };

  const handleSaveTemplate = async () => {
    if (!name) return;
    const res = await fetch("/api/saved-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        defaultDuration: parseInt(duration) || 30,
        defaultCalories: parseFloat(calories) || 0,
      }),
    });
    if (!res.ok) {
      showFlash(`✗ Could not save (${res.status})`, 6000);
      return;
    }
    showFlash(`Saved ${name} to your exercises`);
    refreshSaved();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/exercise?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const startEdit = (s: SavedExercise) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      duration: String(s.defaultDuration),
      calories: String(Math.round(s.defaultCalories)),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", duration: "", calories: "" });
  };

  const handleSaveEdit = async (id: number) => {
    if (!editForm.name.trim()) return;
    const res = await fetch(`/api/saved-exercise?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        defaultDuration: parseInt(editForm.duration) || 30,
        defaultCalories: parseFloat(editForm.calories) || 0,
      }),
    });
    if (!res.ok) {
      showFlash(`✗ Could not save (${res.status})`, 6000);
      return;
    }
    cancelEdit();
    refreshSaved();
    showFlash("Saved");
  };

  const handleDeleteSaved = async (s: SavedExercise) => {
    if (!confirm(`Remove "${s.name}" from your exercises? Past logs are unaffected.`)) return;
    const res = await fetch(`/api/saved-exercise?id=${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      showFlash(`✗ Could not remove (${res.status})`, 6000);
      return;
    }
    refreshSaved();
    showFlash(`Removed ${s.name}`);
  };

  const totalBurned = exercises.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Exercise ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: flash.startsWith("✗") ? "#e84d6a" : "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: flash.startsWith("✗") ? "#a8264a" : "#2d8a4e", padding: "10px" }}>
            {flash.startsWith("✗") ? flash : `✦ ${flash} ✦`}
          </div>
        </div>
      )}

      <div className="text-xs text-center" style={{ color: "#9b80b8" }}>
        Calorie burn calculated for <strong>{userWeight} lbs</strong> body weight
      </div>

      <Window title="🏃 Quick Pick">
        <div className="grid grid-cols-3 gap-2">
          {presets.map((p) => (
            <button key={p.name} onClick={() => pickPreset(p)}
              className={`btn-sm text-xs py-2 ${name === p.name ? "btn-pink" : "btn-blue"}`}
              style={{ fontSize: 11 }}>
              {p.name}
              <br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>
                ~{calcBurn(p.met, userWeight, parseInt(duration) || 30)} cal/{duration || 30}m
              </span>
            </button>
          ))}
        </div>
      </Window>

      {saved.length > 0 && (
        <Window title={`💾 My Exercises (${saved.length})`}>
          <div className="flex justify-end mb-2">
            <button onClick={() => setShowSaved(!showSaved)} className="btn-blue btn-sm text-xs">
              {showSaved ? "hide" : "show"}
            </button>
          </div>
          {showSaved && (
            <div className="space-y-1" style={{ maxHeight: 280, overflowY: "auto" }}>
              {saved.map(s => editingId === s.id ? (
                <div key={s.id} className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Name"
                    className="input"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editForm.duration}
                      onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                      placeholder="min"
                      className="input flex-1 min-w-0"
                    />
                    <input
                      type="number"
                      value={editForm.calories}
                      onChange={e => setEditForm(f => ({ ...f, calories: e.target.value }))}
                      placeholder="kcal"
                      className="input flex-1 min-w-0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(s.id)} className="btn-pink btn-sm flex-1">save</button>
                    <button onClick={cancelEdit} className="btn-blue btn-sm flex-1">cancel</button>
                  </div>
                </div>
              ) : (
                <div key={s.id} className="list-row">
                  <button
                    onClick={() => pickSaved(s)}
                    className="flex-1 min-w-0 text-left"
                    style={{ cursor: "pointer", border: "none", background: "transparent", padding: 0 }}
                  >
                    <div className="text-sm font-semibold truncate">{s.name}</div>
                    <div className="text-[10px]" style={{ color: "#9b80b8" }}>
                      {s.defaultDuration} min · {Math.round(s.defaultCalories)} kcal
                      {s.lastUsedDate && ` · last ${s.lastUsedDate}`}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(s)} className="delete-btn" title="Edit" style={{ background: "#ede0f5", color: "#7c3aed" }}>✎</button>
                    <button onClick={() => handleDeleteSaved(s)} className="delete-btn" title="Remove">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Window>
      )}

      <Window title="📝 Log Exercise">
        <div className="space-y-3">
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Exercise Name</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setSelectedMet(null); }}
              placeholder="e.g. Running" className="input" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Duration (min)</label>
              <input type="number" value={duration} onChange={e => handleDurationChange(e.target.value)}
                className="input" min="1" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Calories Burned</label>
              <input type="number" value={calories} onChange={e => { setCalories(e.target.value); setSelectedMet(null); }}
                className="input" min="0" />
            </div>
          </div>
          <div className="min-w-0">
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
          </div>
          <button onClick={handleLog} className="btn-pink w-full py-3">
            ✧ Log Exercise ✧
          </button>
          <button onClick={handleSaveTemplate} disabled={!name} className="btn-blue w-full">
            ✧ Save to My Exercises (no log) ✧
          </button>
        </div>
      </Window>

      {exercises.length > 0 && (
        <Window title={`🔥 Exercise Log — ${totalBurned} kcal burned`}>
          {exercises.map((ex) => (
            <div key={ex.id} className="list-row">
              <div>
                <span className="font-semibold">{ex.name}</span>
                <span className="badge ml-2">{ex.duration} min</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span style={{ color: "#e84d98" }}>-{ex.caloriesBurned} kcal</span>
                <button onClick={() => handleDelete(ex.id)} className="delete-btn">×</button>
              </div>
            </div>
          ))}
        </Window>
      )}
    </div>
  );
}
