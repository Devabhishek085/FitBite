import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Sun, Plus, RotateCcw, Trash2, Edit2,
  Minus, FileText, Activity, Zap, Info, X, Loader2, Search
} from 'lucide-react';
import Background3D from './Background3D';

/* ─── Framer Motion Variants ─────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };
const cardHover = { whileHover: { y: -5, scale: 1.01, transition: { duration: 0.2 } } };

/* ─── Glow Wrapper ───────────────────────────────────────── */
function GlowCard({ children, className = '', color = 'accent1' }) {
  const glowColor = color === 'accent1' ? 'from-emerald-500/40 to-blue-500/40' : 'from-blue-500/40 to-purple-500/40';
  return (
    <div className="relative group">
      <div className={`absolute -inset-px bg-gradient-to-r ${glowColor} rounded-3xl blur opacity-0 group-hover:opacity-60 transition-all duration-500 pointer-events-none`} />
      <div className={`relative glass-card rounded-3xl ${className}`}>{children}</div>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fitbite_theme') || 'dark');

  const [foods, setFoods] = useState(() => {
    const saved = localStorage.getItem('fitbite_foods');
    return saved ? JSON.parse(saved) : [];
  });

  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem('fitbite_goal')) || 2000);

  const [completedDays, setCompletedDays] = useState(() => {
    const saved = localStorage.getItem('fitbite_completed');
    return saved ? JSON.parse(saved) : [];
  });

  const [inputFood, setInputFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [editingId, setEditingId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isFetchingAPI, setIsFetchingAPI] = useState(false);

  /* ─── Theme ─────────────────────────────────────────────── */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('fitbite_theme', theme);
  }, [theme]);

  /* ─── Persist ────────────────────────────────────────────── */
  useEffect(() => {
    localStorage.setItem('fitbite_foods', JSON.stringify(foods));
    localStorage.setItem('fitbite_goal', goal.toString());
  }, [foods, goal]);

  /* ─── Totals ─────────────────────────────────────────────── */
  const totalCals    = foods.reduce((s, f) => s + f.calories * f.quantity, 0);
  const totalProtein = foods.reduce((s, f) => s + f.protein  * f.quantity, 0);
  const totalCarbs   = foods.reduce((s, f) => s + f.carbs    * f.quantity, 0);
  const totalFat     = foods.reduce((s, f) => s + f.fat      * f.quantity, 0);
  const totalMacros  = totalProtein + totalCarbs + totalFat;
  const progressPercent = Math.min((totalCals / goal) * 100, 100) || 0;
  const remainingCals   = Math.max(0, goal - totalCals);

  /* ─── Streak ─────────────────────────────────────────────── */
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (totalCals >= goal && goal > 0) {
      if (!completedDays.includes(today)) {
        const next = [...completedDays, today];
        setCompletedDays(next);
        localStorage.setItem('fitbite_completed', JSON.stringify(next));
      }
    } else {
      if (completedDays.includes(today)) {
        const next = completedDays.filter(d => d !== today);
        setCompletedDays(next);
        localStorage.setItem('fitbite_completed', JSON.stringify(next));
      }
    }
  }, [totalCals, goal]);

  const calculateStreak = () => {
    let count = 0;
    let cur = new Date();
    const todayStr = cur.toISOString().split('T')[0];
    const ystrdStr = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; })();
    if (!completedDays.includes(todayStr)) {
      if (!completedDays.includes(ystrdStr)) return 0;
      cur.setDate(cur.getDate() - 1);
    }
    while (true) {
      const s = cur.toISOString().split('T')[0];
      if (completedDays.includes(s)) { count++; cur.setDate(cur.getDate() - 1); }
      else break;
    }
    return count;
  };
  const streak = calculateStreak();

  /* ─── Toast ──────────────────────────────────────────────── */
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };

  /* ─── USDA Auto-fill ─────────────────────────────────────── */
  const fetchNutrition = async () => {
    if (!inputFood.name.trim()) { showToast('Enter a food name first', 'error'); return; }
    setIsFetchingAPI(true);
    try {
      const key = import.meta.env.VITE_USDA_API_KEY;
      const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputFood.name, pageSize: 1 }),
      });
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (!data.foods?.length) { showToast('Food not found', 'error'); return; }
      const n = data.foods[0].foodNutrients;
      let cal=0, pro=0, car=0, fat=0;
      n.forEach(x => {
        if (x.nutrientName === 'Energy')                        cal = x.value;
        if (x.nutrientName === 'Protein')                       pro = x.value;
        if (x.nutrientName === 'Carbohydrate, by difference')   car = x.value;
        if (x.nutrientName === 'Total lipid (fat)')             fat = x.value;
      });
      setInputFood(p => ({ ...p, calories: Math.round(cal), protein: Math.round(pro), carbs: Math.round(car), fat: Math.round(fat) }));
      showToast('Nutrition loaded ✓');
    } catch { showToast('Error fetching data', 'error'); }
    finally { setIsFetchingAPI(false); }
  };

  /* ─── CRUD ───────────────────────────────────────────────── */
  const handleAddFood = (e) => {
    e.preventDefault();
    if (!inputFood.name || !inputFood.calories) return;
    const food = {
      id: editingId || Date.now(),
      name: inputFood.name,
      calories: parseFloat(inputFood.calories) || 0,
      protein:  parseFloat(inputFood.protein)  || 0,
      carbs:    parseFloat(inputFood.carbs)    || 0,
      fat:      parseFloat(inputFood.fat)      || 0,
      quantity: 1,
    };
    if (editingId) {
      setFoods(fs => fs.map(f => f.id === editingId ? { ...food, quantity: f.quantity } : f));
      showToast('Food updated!');
      setEditingId(null);
    } else {
      setFoods(fs => [food, ...fs]);
      showToast('Food added!');
    }
    setInputFood({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  const handleDelete = (id) => { setFoods(fs => fs.filter(f => f.id !== id)); showToast('Removed', 'error'); };
  const handleEdit   = (f)  => { setInputFood({ name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat }); setEditingId(f.id); };
  const updateQty    = (id, d) => setFoods(fs => fs.map(f => f.id === id ? { ...f, quantity: Math.max(1, f.quantity + d) } : f));

  /* ─── Input shared class ─────────────────────────────────── */
  const inputCls = 'bg-white/60 dark:bg-black/25 border border-slate-200 dark:border-white/8 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent1/50 focus:border-accent1 dark:focus:border-accent1 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 w-full text-slate-900 dark:text-white';

  /* ══════════════════════════════════════════════════════════ */
  return (
    <div className="w-full min-h-screen text-slate-800 dark:text-white pb-24 relative overflow-x-hidden transition-colors duration-500">

      {/* ── 3D Background ── */}
      <Background3D theme={theme} />

      {/* ── Toast Stack ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`glass-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border ${t.type === 'error' ? 'border-red-500/40' : 'border-accent1/40'}`}
            >
              {t.type === 'error'
                ? <X className="w-4 h-4 text-red-500 shrink-0"/>
                : <Zap className="w-4 h-4 text-accent1 shrink-0"/>}
              <span className="text-sm font-semibold">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* ── Header ── */}
        <motion.header variants={fadeUp} initial="hidden" animate="show"
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="font-heading text-4xl lg:text-5xl font-extrabold tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent1 to-accent2 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                <Activity className="w-5 h-5 text-white"/>
              </span>
              FitBite
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">Track your nutrition smartly</p>
          </div>
          <motion.button whileHover={{ scale: 1.12, rotate: 15 }} whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center shadow-lg"
          >
            {theme === 'dark'
              ? <Sun className="w-5 h-5 text-yellow-400"/>
              : <Moon className="w-5 h-5 text-accent2"/>}
          </motion.button>
        </motion.header>

        {/* ── Main Grid ── */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >

          {/* ── LEFT: Input + Food Cards ── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* Input Card with Glow */}
            <motion.div variants={fadeUp}>
              <GlowCard className="p-6 md:p-8">
                <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                  <FileText className="w-5 h-5 text-accent2"/>
                  {editingId ? 'Edit Food' : 'Add Food Item'}
                </h2>

                <form onSubmit={handleAddFood} className="flex flex-col gap-5">
                  {/* Row 1: Food name + AutoFill | Calories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Food Name</label>
                      <div className="flex gap-2">
                        <input required type="text" placeholder="e.g. Avocado Toast"
                          value={inputFood.name} onChange={e => setInputFood({ ...inputFood, name: e.target.value })}
                          className={`${inputCls} flex-1 w-0`}
                        />
                        <motion.button type="button" onClick={fetchNutrition} disabled={isFetchingAPI}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          className="shrink-0 px-4 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-slate-700 dark:text-white hover:text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {isFetchingAPI ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
                          <span className="hidden sm:inline">Auto Fill</span>
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Calories</label>
                      <input required type="number" placeholder="kcal"
                        value={inputFood.calories} onChange={e => setInputFood({ ...inputFood, calories: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Row 2: Macros */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: 'protein', label: 'Protein (g)', accent: 'focus:ring-red-400/50 focus:border-red-400' },
                      { key: 'carbs',   label: 'Carbs (g)',   accent: 'focus:ring-yellow-400/50 focus:border-yellow-400' },
                      { key: 'fat',     label: 'Fat (g)',     accent: 'focus:ring-green-400/50 focus:border-green-400' },
                    ].map(({ key, label, accent }) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</label>
                        <input type="number" placeholder="0"
                          value={inputFood[key]} onChange={e => setInputFood({ ...inputFood, [key]: e.target.value })}
                          className={`${inputCls} ${accent}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Row 3: Buttons */}
                  <div className="flex gap-3 mt-1">
                    <motion.button type="submit"
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(16,185,129,0.5)' }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 bg-gradient-to-r from-accent1 to-accent2 rounded-xl py-3.5 font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                      <Plus className="w-5 h-5"/> {editingId ? 'Update Food' : 'Add Food'}
                    </motion.button>
                    <motion.button type="button"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setInputFood({ name: '', calories: '', protein: '', carbs: '', fat: '' }); setEditingId(null); }}
                      className="px-5 rounded-xl border-2 border-red-400/60 text-red-500 flex items-center justify-center font-bold hover:bg-red-500/10 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5"/>
                    </motion.button>
                  </div>
                </form>
              </GlowCard>
            </motion.div>

            {/* Food Cards */}
            <motion.section variants={fadeUp}>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Logged Foods</h2>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-white/10 px-3 py-1 rounded-full">{foods.length} items</span>
                </div>
                {foods.length > 0 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setFoods([]); showToast('All foods cleared!'); }}
                    className="text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4"/> Reset Day
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {foods.length === 0 ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="col-span-full py-14 flex flex-col items-center gap-3 text-slate-400 dark:text-slate-600 glass-card rounded-3xl"
                    >
                      <Info className="w-10 h-10 opacity-40"/>
                      <p className="font-medium">Your log is empty — add a food to begin!</p>
                    </motion.div>
                  ) : foods.map(food => (
                    <motion.div key={food.id} layout
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      {...cardHover}
                      className="glass-card rounded-2xl p-5 flex flex-col gap-4 group relative overflow-hidden cursor-default"
                    >
                      {/* hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-accent1/5 to-accent2/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"/>

                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{food.name}</h3>
                          <p className="text-accent1 font-extrabold text-lg">{food.calories * food.quantity} <span className="text-xs text-slate-400 font-medium">kcal</span></p>
                        </div>
                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleEdit(food)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-accent2 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                          ><Edit2 className="w-4 h-4"/></motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} onClick={() => handleDelete(food.id)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors"
                          ><Trash2 className="w-4 h-4"/></motion.button>
                        </div>
                      </div>

                      {/* Macros pill */}
                      <div className="flex justify-between text-xs font-semibold bg-slate-100 dark:bg-black/20 rounded-xl px-3 py-2">
                        <span className="text-red-500">P {food.protein * food.quantity}g</span>
                        <span className="text-yellow-500">C {food.carbs * food.quantity}g</span>
                        <span className="text-green-500">F {food.fat * food.quantity}g</span>
                      </div>

                      {/* Qty */}
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">QTY</span>
                        <div className="flex items-center gap-3 bg-slate-200 dark:bg-white/10 rounded-full px-1 py-1">
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => updateQty(food.id, -1)}
                            className="w-7 h-7 rounded-full bg-white dark:bg-black/50 flex items-center justify-center shadow-sm"
                          ><Minus className="w-3 h-3"/></motion.button>
                          <span className="w-5 text-center font-bold text-sm">{food.quantity}</span>
                          <motion.button whileHover={{ scale: 1.15 }} onClick={() => updateQty(food.id, 1)}
                            className="w-7 h-7 rounded-full bg-white dark:bg-black/50 flex items-center justify-center shadow-sm"
                          ><Plus className="w-3 h-3"/></motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Goal + Streak */}
            <motion.div variants={fadeUp}>
              <GlowCard className="p-6" color="accent2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">Goal Setting</h3>
                  <motion.div animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}} transition={{ repeat: Infinity, duration: 1.8 }}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${streak > 0 ? 'bg-orange-500/20 text-orange-500' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}
                  >
                    🔥 Streak: {streak} days
                  </motion.div>
                </div>
                {streak > 0 && (
                  <p className="text-xs text-orange-400 font-semibold italic mb-4">"You're on fire! Don't break the streak!"</p>
                )}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Aim</span>
                  <input type="number" value={goal} onChange={e => setGoal(Number(e.target.value))}
                    className="bg-transparent w-full outline-none text-right font-bold text-slate-900 dark:text-white focus:text-accent1 transition-colors"
                  />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">kcal</span>
                </div>
              </GlowCard>
            </motion.div>

            {/* Calorie Ring */}
            <motion.div variants={fadeUp}>
              <GlowCard className="p-8 flex flex-col items-center">
                <h3 className="font-heading font-bold text-lg self-start mb-4 text-slate-900 dark:text-white">Summary</h3>

                {/* Outer glow pulse when near goal */}
                <div className="relative">
                  {progressPercent > 80 && (
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-accent1" style={{ animationDuration: '2s' }}/>
                  )}
                  <div className="relative w-[200px] h-[200px] flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="100" cy="100" r="85" fill="none" className="stroke-slate-200 dark:stroke-white/5" strokeWidth="18"/>
                      <circle cx="100" cy="100" r="85" fill="none"
                        stroke="url(#ringGrad)" strokeWidth="18" strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{
                          strokeDasharray:  2 * Math.PI * 85,
                          strokeDashoffset: 2 * Math.PI * 85 * (1 - progressPercent / 100),
                        }}
                      />
                      <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981"/>
                          <stop offset="100%" stopColor="#3b82f6"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center text-center">
                      <motion.span key={totalCals} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-heading font-extrabold text-slate-900 dark:text-white leading-none"
                      >{totalCals}</motion.span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">/ {goal} kcal</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-5 px-5 py-2 rounded-full font-bold text-sm ${
                  remainingCals > 0
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white'
                    : 'bg-red-500/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                }`}>
                  {remainingCals > 0 ? `${remainingCals} kcal remaining` : '🚨 Goal exceeded!'}
                </div>
              </GlowCard>
            </motion.div>

            {/* Smart Plate */}
            <motion.div variants={fadeUp}>
              <GlowCard className="p-6 flex flex-col items-center">
                <h3 className="font-heading font-bold text-lg self-start mb-6 text-slate-900 dark:text-white">Smart Plate</h3>

                {/* Plate */}
                <div className="relative flex items-center justify-center">
                  {/* outer shadow glow */}
                  {totalMacros > 0 && (
                    <div className="absolute w-44 h-44 rounded-full blur-xl opacity-30"
                      style={{ background: 'conic-gradient(#eab308, #ef4444, #22c55e, #eab308)' }}
                    />
                  )}
                  <div
                    className={`relative w-40 h-40 rounded-full border-[5px] border-white dark:border-slate-800 shadow-xl transition-all duration-700 flex items-center justify-center ${totalMacros === 0 ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
                    style={totalMacros > 0 ? {
                      background: `conic-gradient(
                        #eab308 0% ${(totalCarbs / totalMacros) * 100}%,
                        #ef4444 ${(totalCarbs / totalMacros) * 100}% ${((totalCarbs + totalProtein) / totalMacros) * 100}%,
                        #22c55e ${((totalCarbs + totalProtein) / totalMacros) * 100}% 100%
                      )`,
                    } : {}}
                  >
                    <div className="w-[4.5rem] h-[4.5rem] bg-slate-50 dark:bg-[#0b0f19] rounded-full absolute shadow-inner"/>
                    {totalMacros === 0 && <span className="absolute text-slate-400 text-xs font-bold">Empty</span>}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex justify-between w-full mt-7 px-2">
                  {[
                    { label: 'Carbs', val: totalCarbs, dot: 'bg-yellow-400' },
                    { label: 'Protein', val: totalProtein, dot: 'bg-red-400' },
                    { label: 'Fat', val: totalFat, dot: 'bg-green-400' },
                  ].map(({ label, val, dot }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${dot}`}/>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
                      <motion.span key={val} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="font-extrabold text-slate-800 dark:text-white text-sm"
                      >{val}g</motion.span>
                      {totalMacros > 0 && (
                        <span className="text-[10px] text-slate-400">{Math.round((val / totalMacros) * 100)}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
