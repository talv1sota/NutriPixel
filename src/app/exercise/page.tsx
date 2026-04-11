"use client";

import { useEffect, useState, useCallback } from "react";
import Window from "@/components/Window";
import { todayStr } from "@/lib/helpers";

interface Exercise {
  id: number; name: string; caloriesBurned: number; duration: number; date: string;
}

// MET values for common exercises
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

// Calories = MET × weight(kg) × duration(hours)
function calcBurn(met: number, weightLbs: number, durationMin: number) {
  const kg = weightLbs * 0.453592;
  return Math.round(met * kg * (durationMin / 60));
}

export default function ExercisePage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [calories, setCalories] = useState("");
  const [date, setDate] = useState(todayStr());
  const [flash, setFlash] = useState("");
  const [userWeight, setUserWeight] = useState<number>(135);
  const [selectedMet, setSelectedMet] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/weight").then(r => r.json()).then((ws: { weight: number }[]) => {
      if (ws.length > 0) setUserWeight(ws[ws.length - 1].weight);
    });
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/exercise?date=${date}`);
    setExercises(await res.json());
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pickPreset = (preset: typeof presets[0]) => {
    setName(preset.name);
    setSelectedMet(preset.met);
    const dur = parseInt(duration) || 30;
    setCalories(String(calcBurn(preset.met, userWeight, dur)));
  };

  const handleDurationChange = (val: string) => {
    setDuration(val);
    if (selectedMet) {
      setCalories(String(calcBurn(selectedMet, userWeight, parseInt(val) || 30)));
    }
  };

  const handleLog = async () => {
    if (!name || !calories || !duration) return;
    await fetch("/api/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, caloriesBurned: parseFloat(calories),
        duration: parseInt(duration), date,
      }),
    });
    setFlash(`Logged ${name}!`);
    setName(""); setCalories(""); setDuration("30"); setSelectedMet(null);
    fetchData();
    setTimeout(() => setFlash(""), 2000);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/exercise?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const totalBurned = exercises.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Exercise ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: "#2d8a4e", padding: "10px" }}>
            ✦ {flash} ✦
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

      <Window title="📝 Log Exercise">
        <div className="space-y-3">
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Exercise Name</label>
            <input type="text" value={name} onChange={e => { setName(e.target.value); setSelectedMet(null); }}
              placeholder="e.g. Running" className="input" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Duration (min)</label>
              <input type="number" value={duration} onChange={e => handleDurationChange(e.target.value)}
                className="input" min="1" />
            </div>
            <div className="flex-1">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Calories Burned</label>
              <input type="number" value={calories} onChange={e => { setCalories(e.target.value); setSelectedMet(null); }}
                className="input" min="0" />
            </div>
          </div>
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
          </div>
          <button onClick={handleLog} className="btn-pink w-full py-3">
            ✧ Log Exercise ✧
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
