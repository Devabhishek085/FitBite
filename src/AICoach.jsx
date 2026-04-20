import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, ChevronDown } from 'lucide-react';

const QUICK = [
  { icon: '📊', label: 'Analyse my diet', msg: 'Analyse everything I have eaten today. Tell me what is good and what I should improve.' },
  { icon: '🍽️', label: 'Best next meal', msg: 'Based on what I have eaten today, what should I eat next to stay on track with my goal?' },
  { icon: '⚠️', label: 'What am I missing?', msg: 'What nutrients or food groups am I missing today? What should I add?' },
  { icon: '💪', label: 'More protein tips', msg: 'Give me easy high-protein Indian food ideas I can add right now to boost my protein intake.' },
  { icon: '🔥', label: 'Hit my goal today', msg: 'Help me plan the rest of my day so I hit my calorie and macro goals perfectly.' },
  { icon: '🧠', label: 'Explain my macros', msg: 'Explain what my current carb, protein and fat split means for my health and fitness.' },
];

const TYPING = ['Reading your food log…', 'Calculating macros…', 'Generating advice…', 'Preparing insights…'];

export default function AICoach({ foods, goal, totalCals, totalProtein, totalCarbs, totalFat, streak, theme, onAddFood, onSetGoal }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [typIdx, setTypIdx] = useState(0);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const typTimer = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);
  useEffect(() => { if (open) setTimeout(() => textareaRef.current?.focus(), 300); }, [open]);
  useEffect(() => {
    if (!busy) return;
    typTimer.current = setInterval(() => setTypIdx(i => (i + 1) % TYPING.length), 1800);
    return () => clearInterval(typTimer.current);
  }, [busy]);

  const buildPrompt = useCallback(() => {
    const remaining = goal - totalCals;
    const pct = goal > 0 ? Math.round((totalCals / goal) * 100) : 0;
    const totalMacros = totalProtein + totalCarbs + totalFat;
    const macroStr = totalMacros > 0
      ? `Protein ${Math.round((totalProtein / totalMacros) * 100)}% | Carbs ${Math.round((totalCarbs / totalMacros) * 100)}% | Fat ${Math.round((totalFat / totalMacros) * 100)}%`
      : 'No macros logged yet';
    const foodList = foods.length
      ? foods.map(f => `  • ${f.name} x${f.quantity}  ->  ${Math.round(f.calories * f.quantity)} kcal | P:${Math.round(f.protein * f.quantity)}g C:${Math.round(f.carbs * f.quantity)}g F:${Math.round(f.fat * f.quantity)}g`).join('\n')
      : '  (nothing logged yet today)';
    return `You are NutriCoach — the built-in AI nutrition coach for FitBite, a smart calorie tracking app. You have REAL-TIME access to the user's food log for today. Always base your advice on this actual data.

TODAY'S LIVE DATA:
Daily Calorie Goal: ${goal} kcal
Calories Consumed: ${totalCals} kcal (${pct}% of goal)
Calories Remaining: ${remaining > 0 ? `${remaining} kcal left` : `${Math.abs(remaining)} kcal OVER goal`}
Protein: ${Math.round(totalProtein)}g | Carbs: ${Math.round(totalCarbs)}g | Fat: ${Math.round(totalFat)}g
Streak: ${streak} days
Foods Logged Today:
${foodList}
Macro Split: ${macroStr}

RULES:
- Always reference the user's actual numbers — never give generic advice
- Suggest real Indian foods (roti, dal, paneer, rice, sabji etc.)
- Keep responses to 150-220 words max
- Use emojis naturally
- If user asks to ADD a food, put this on its own line at the END of your reply: ACTION:ADD_FOOD | name:"food name" | calories:number | protein:number | carbs:number | fat:number
- If user asks to change calorie goal, put this on its own line at the END: ACTION:SET_GOAL | calories:number
- End every reply with one clear next action`;
  }, [foods, goal, totalCals, totalProtein, totalCarbs, totalFat, streak]);

  const parseAndExecute = useCallback((text) => {
    const addMatch = text.match(/ACTION:ADD_FOOD\s*\|\s*name:"([^"]+)"\s*\|\s*calories:(\d+(?:\.\d+)?)\s*\|\s*protein:(\d+(?:\.\d+)?)\s*\|\s*carbs:(\d+(?:\.\d+)?)\s*\|\s*fat:(\d+(?:\.\d+)?)/i);
    const goalMatch = text.match(/ACTION:SET_GOAL\s*\|\s*calories:(\d+)/i);
    if (addMatch && onAddFood) onAddFood({ name: addMatch[1], calories: Math.round(parseFloat(addMatch[2])), protein: Math.round(parseFloat(addMatch[3])), carbs: Math.round(parseFloat(addMatch[4])), fat: Math.round(parseFloat(addMatch[5])), quantity: 1, id: Date.now() });
    if (goalMatch && onSetGoal) onSetGoal(parseInt(goalMatch[1]));
    return text.replace(/ACTION:ADD_FOOD[\s\S]*/gi, '').replace(/ACTION:SET_GOAL[\s\S]*/gi, '').trim();
  }, [onAddFood, onSetGoal]);

  const send = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || busy) return;
    setInput('');
    const userMsg = { role: 'user', content: userText, id: Date.now() };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setBusy(true);
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("Groq API key is missing");

      // Build discussion history for Groq
      const apiHistory = [
        { role: 'system', content: buildPrompt() },
        ...msgs.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        { role: 'user', content: userText }
      ];

      const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: apiHistory,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Groq API Error:", errorText);
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "I'm having trouble analyzing that right now. Please try again.";

      const clean = parseAndExecute(raw);
      setMsgs(prev => [...prev, { role: 'assistant', content: clean, id: Date.now() + 1 }]);
    } catch (err) {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Something went wrong!', id: Date.now() + 1 }]);
    } finally { setBusy(false); }
  }, [input, msgs, busy, totalCals, totalProtein, goal, streak, parseAndExecute]);

  const panel = { background: isDark ? 'rgba(11,15,25,0.96)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: isDark ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(99,102,241,0.2)', borderRadius: 20, boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.7)' : '0 24px 60px rgba(0,0,0,0.15)' };
  const bubbleAI = { background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.07)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(99,102,241,0.15)', borderRadius: '18px 18px 18px 4px' };
  const bubbleUser = { background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', borderRadius: '18px 18px 4px 18px' };
  const txt = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';

  return (
    <>
      <style>{`
        @keyframes aiGlow{0%,100%{box-shadow:0 0 20px rgba(139,92,246,0.45);}50%{box-shadow:0 0 40px rgba(139,92,246,0.85),0 0 60px rgba(59,130,246,0.3);}}
        @keyframes aiFadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
        @keyframes aiSlideIn{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:none;}}
        @keyframes aiBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}
        @keyframes aiSpin{to{transform:rotate(360deg);}}
        .ai-fadeup{animation:aiFadeUp 0.28s ease;}
        .ai-slidein{animation:aiSlideIn 0.32s ease;}
        .ai-qbtn:hover{background:rgba(139,92,246,0.18)!important;border-color:rgba(139,92,246,0.5)!important;transform:translateY(-1px);}
        .ai-send:hover:not(:disabled){filter:brightness(1.15);transform:scale(1.05);}
        .ai-send:disabled{opacity:0.35;cursor:not-allowed;}
        .ai-fab:hover{transform:scale(1.08)!important;}
        .ai-panel-scroll::-webkit-scrollbar{width:3px;}
        .ai-panel-scroll::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:2px;}
      `}</style>

      <AnimatePresence>
        {!open && (
          <motion.button className="ai-fab" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} onClick={() => setOpen(true)}
            style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 999, width: 62, height: 62, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', cursor: 'pointer', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'aiGlow 3s ease-in-out infinite', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}>
            🧠
            <span style={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, background: '#10b981', borderRadius: '50%', border: `2px solid ${isDark ? '#0b0f19' : '#f8fafc'}`, fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, width: 'min(420px, calc(100vw - 28px))', height: 'min(640px, calc(100vh - 36px))', display: 'flex', flexDirection: 'column', ...panel }}>

            <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 14px rgba(124,58,237,0.5)', flexShrink: 0 }}>🧠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: txt }}>NutriCoach AI</div>
                <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Knows your FitBite data · Powered by Gemini
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {msgs.length > 0 && <button onClick={() => setMsgs([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>}
                <button onClick={() => setOpen(false)} style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', border: 'none', color: muted, borderRadius: 8, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={15} /></button>
              </div>
            </div>

            <div style={{ padding: '9px 14px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`, display: 'flex', gap: 7, flexShrink: 0 }}>
              {[{ label: 'Eaten', val: `${Math.round(totalCals)} kcal`, color: '#a5b4fc' }, { label: 'Left', val: `${Math.max(0, Math.round(goal - totalCals))} kcal`, color: '#34d399' }, { label: 'Streak', val: `🔥 ${streak}d`, color: '#fb923c' }].map(({ label, val, color }) => (
                <div key={label} style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '5px 6px', textAlign: 'center', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
                  <div style={{ fontSize: 8, color: muted, marginBottom: 1 }}>{label}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
            </div>

            <div className="ai-panel-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div style={{ fontSize: 34, marginBottom: 8 }}>🥗</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: txt, marginBottom: 5 }}>Your Personal AI Nutrition Coach</div>
                  <div style={{ fontSize: 11, color: muted, lineHeight: 1.6, marginBottom: 16 }}>I can see your full FitBite food log.<br />Ask anything — I'll even add foods for you!</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {QUICK.map(q => (
                      <button key={q.label} className="ai-qbtn" onClick={() => send(q.msg)} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 10, padding: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: 15, marginBottom: 2 }}>{q.icon}</div>
                        <div style={{ fontSize: 9.5, color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600, lineHeight: 1.3 }}>{q.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map(m => (
                <div key={m.id} className={m.role === 'user' ? 'ai-fadeup' : 'ai-slidein'} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 7, alignItems: 'flex-end' }}>
                  {m.role === 'assistant' && <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🧠</div>}
                  <div style={{ maxWidth: '82%', ...(m.role === 'user' ? bubbleUser : bubbleAI), padding: '10px 13px', fontSize: 12.5, lineHeight: 1.7, color: m.role === 'user' ? '#fff' : txt, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  {m.role === 'user' && <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>👤</div>}
                </div>
              ))}
              {busy && (
                <div className="ai-slidein" style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🧠</div>
                  <div style={{ ...bubbleAI, padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 4 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'aiBounce 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />)}</div>
                    <div style={{ fontSize: 9.5, color: muted }}>{TYPING[typIdx]}</div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {msgs.length > 0 && (
              <div style={{ padding: '8px 14px 6px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', gap: 5, overflowX: 'auto', flexShrink: 0 }}>
                {QUICK.slice(0, 4).map(q => (
                  <button key={q.label} className="ai-qbtn" onClick={() => send(q.msg)} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 20, padding: '4px 10px', cursor: 'pointer', fontSize: 9.5, color: muted, whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>{q.icon} {q.label}</button>
                ))}
              </div>
            )}

            <div style={{ padding: '10px 14px 14px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask anything… or say 'add 2 rotis to my log'" rows={1}
                  style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, padding: '9px 13px', color: txt, fontSize: 12.5, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.6)'} onBlur={e => e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <button className="ai-send" onClick={() => send()} disabled={busy || !input.trim()} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', color: '#fff', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
                  {busy ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'aiSpin 0.7s linear infinite' }} /> : <Send size={15} />}
                </button>
              </div>
              <div style={{ fontSize: 9, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'center', marginTop: 6 }}>Gemini AI · Say "add [food]" to log instantly</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
