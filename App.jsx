import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Home, ClipboardCheck, Calendar, TrendingUp, Users,
  Flame, Target, Award, Activity, Moon, Footprints,
  Beef, Wine, Dumbbell, ChevronRight, Download,
  Plus, Sparkles, Trophy, Zap
} from 'lucide-react';

// ============================================================
// KONSTANTER & PROGRAM
// ============================================================

const RULES = {
  kcal: 2400,
  proteinMin: 180,
  proteinMax: 190,
  steps: 12500,
  sleepMin: 7,
  alcoholPerWeek: 2,
};

const PROGRAM = [
  {
    weeks: [1, 2],
    phase: 'Hormonal reset',
    title: 'Hormonal reset & snabb midjereducering',
    goal: 'Tömma glykogen, minska insulin och vätska runt buken.',
    expected: '-2 till -5 cm midja',
    checklist: [
      'Ät inom 10–12 h-fönster',
      '3 huvudmål, inga kalorier efter middag',
      'Dra ner på ultraprocessat och salta snacks',
      'Tung styrka 4–6 reps',
      'Extra 1000–2000 steg om möjligt',
    ],
    avoid: ['Småätande på kvällen', 'Flytande kalorier'],
    accent: '#84cc16',
  },
  {
    weeks: [3, 4],
    phase: 'Fettförbränning',
    title: 'Stabil fettförbränning',
    goal: 'Etablera fettförlust som primär energikälla.',
    expected: '-1,5 till -2 cm midja',
    checklist: [
      'Protein först i varje måltid',
      'Kolhydrater runt träning eller lunch, inte sent',
      'Promenad 10–20 min efter middag',
      'Koffein före träning valfritt',
      '1 fasted promenad/vecka 30–45 min',
    ],
    avoid: [],
    accent: '#65a30d',
  },
  {
    weeks: [5, 6],
    phase: 'Bukfett & stress',
    title: 'Bukfettsfokus & stresskontroll',
    goal: 'Hålla kortisol nere.',
    expected: '-1,5 till -2 cm midja',
    checklist: [
      'Prioritera sömn före extra träning',
      '5–10 min nedvarvning dagligen',
      'Styrka kvar, men inte till failure',
      'En något högre kolhydratdag/vecka',
    ],
    avoid: ['För många HIIT-pass'],
    accent: '#4d7c0f',
  },
  {
    weeks: [7, 8],
    phase: 'Platåhantering',
    title: 'Platåhantering & precision',
    goal: 'Hindra anpassning och fortsätta tappa bukfett.',
    expected: '-1 till -1,5 cm midja',
    checklist: [
      'Kontrollera portionsstorlekar',
      'Lägg till 1500 steg/dag',
      'Högre proteinandel, ev +15–20 g/dag',
      'Håll natrium stabilt',
    ],
    adjust: '-100 kcal eller +2000 steg, men inte båda',
    avoid: [],
    accent: '#3f6212',
  },
  {
    weeks: [9, 10],
    phase: 'Sista reserven',
    title: 'Sista stora bukfett-reserven',
    goal: 'Nå under 100–102 cm midja.',
    expected: 'Märkbar finish',
    checklist: [
      'Tighta ätfönster 9–10 h',
      'Mycket volymmat: grönsaker och magert protein',
      'Behåll tunga baslyft',
      'Alkohol helst noll',
    ],
    avoid: [],
    accent: '#365314',
  },
  {
    weeks: [11, 12],
    phase: 'Konsolidering',
    title: 'Konsolidering',
    goal: 'Låsa in fettförlusten och undvika rebound.',
    expected: '-0,5 till -1 cm midja, hårdare profil',
    checklist: [
      'Små kaloricyklingar +/- 200 kcal dag till dag',
      'Fortsätt steg och rörlighet',
      'Extra fokus på återhämtning',
      'Mät midja 2–3 gånger/vecka på morgonen',
    ],
    avoid: [],
    accent: '#1a2e05',
  },
];

const FOCUS_TIPS = [
  'Drick 2 glas vatten innan första målet.',
  'Protein först — alltid.',
  'En 10-min promenad efter lunch.',
  'Lägg telefonen 30 min innan läggdags.',
  'Mät midjan på morgonen, samma ställe.',
  'Tung styrka idag — ladda med ett bra mål innan.',
  'Säg nej till en sak du brukar säga ja till.',
  'Ät i 25 minuter, inte 8.',
  'Räkna proteinet i frukosten innan du äter.',
  'Bestäm tiden du går och lägger dig — nu.',
  'En extra runda kvarteret räcker långt.',
  'Inget snacks efter middag idag.',
];

// ============================================================
// HJÄLPFUNKTIONER
// ============================================================

const getPhase = (week) => PROGRAM.find(p => p.weeks.includes(week)) || PROGRAM[0];

const todayKey = () => new Date().toISOString().slice(0, 10);

const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
};

const statusColor = (value, target, type = 'min') => {
  if (value == null || value === '') return 'neutral';
  const v = Number(value);
  if (type === 'min') {
    if (v >= target) return 'good';
    if (v >= target * 0.85) return 'warn';
    return 'bad';
  }
  if (type === 'max') {
    if (v <= target) return 'good';
    if (v <= target * 1.1) return 'warn';
    return 'bad';
  }
  if (type === 'range') {
    const [lo, hi] = target;
    if (v >= lo && v <= hi) return 'good';
    if (v >= lo * 0.9 && v <= hi * 1.1) return 'warn';
    return 'bad';
  }
};

const isDayApproved = (entry) => {
  if (!entry) return false;
  const checks = [
    Number(entry.steps) >= RULES.steps * 0.9,
    Number(entry.protein) >= RULES.proteinMin * 0.9,
    Number(entry.kcal) > 0 && Number(entry.kcal) <= RULES.kcal * 1.1,
    Number(entry.sleep) >= RULES.sleepMin,
    !entry.alcohol,
  ];
  return checks.filter(Boolean).length >= 4;
};

const computeStreak = (entries) => {
  if (!entries || entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let cursor = new Date(todayKey());
  for (const e of sorted) {
    const eDate = new Date(e.date);
    const diff = Math.round((cursor - eDate) / 86400000);
    if (diff > 1) break;
    if (isDayApproved(e)) {
      streak++;
      cursor = eDate;
    } else {
      break;
    }
  }
  return streak;
};

// ============================================================
// SEED-DATA (exempel så appen ser levande ut)
// ============================================================

const generateSeed = (startWaist, weight, name) => {
  const entries = [];
  const start = new Date();
  start.setDate(start.getDate() - 18);

  for (let i = 0; i < 18; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    const waistDrop = i * 0.18 + (Math.random() - 0.5) * 0.3;
    const weightDrop = i * 0.12 + (Math.random() - 0.5) * 0.4;

    entries.push({
      date: dateStr,
      weight: +(weight - weightDrop).toFixed(1),
      waist: +(startWaist - waistDrop).toFixed(1),
      kcal: Math.round(2300 + Math.random() * 250),
      protein: Math.round(170 + Math.random() * 25),
      steps: Math.round(11000 + Math.random() * 4000),
      sleep: +(6.5 + Math.random() * 1.5).toFixed(1),
      workout: Math.random() > 0.55,
      alcohol: i === 5 || i === 12,
      mood: Math.ceil(2 + Math.random() * 3),
      note: i === 0 ? 'Startdag — kör vi!' : (i === 7 ? 'Bra känsla i kroppen idag.' : ''),
    });
  }
  return {
    name,
    startDate: start.toISOString().slice(0, 10),
    startWaist,
    startWeight: weight,
    entries,
  };
};

const DEFAULT_DATA = {
  me: generateSeed(108, 94, 'Jag'),
  buddy: generateSeed(112, 101, 'Kompis'),
  activeProfile: 'me',
};

// ============================================================
// STORAGE
// ============================================================

const STORAGE_KEY = '12v_sommar_v1';

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DATA;
  }
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

// ============================================================
// SMÅKOMPONENTER
// ============================================================

const StatusDot = ({ status }) => {
  const colors = {
    good: 'bg-lime-500',
    warn: 'bg-amber-400',
    bad: 'bg-rose-500',
    neutral: 'bg-stone-300',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
};

const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-stone-200/80 ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const Stat = ({ label, value, unit, status, hint }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5">
      {status && <StatusDot status={status} />}
      <span className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-display font-semibold text-stone-900 leading-none">{value}</span>
      {unit && <span className="text-xs text-stone-500 font-medium">{unit}</span>}
    </div>
    {hint && <span className="text-[11px] text-stone-500">{hint}</span>}
  </div>
);

// ============================================================
// VYER
// ============================================================

const Dashboard = ({ profile, week, setView }) => {
  const phase = getPhase(week);
  const todayEntry = profile.entries.find(e => e.date === todayKey());
  const latest = profile.entries[profile.entries.length - 1];
  const waistChange = latest ? (latest.waist - profile.startWaist).toFixed(1) : 0;
  const streak = computeStreak(profile.entries);
  const progress = (week / 12) * 100;

  const focusTip = FOCUS_TIPS[new Date().getDate() % FOCUS_TIPS.length];

  const motivation = useMemo(() => {
    if (streak >= 7) return { text: `${streak} dagar i rad. Det här är inte tur längre.`, icon: Trophy };
    if (streak >= 3) return { text: `${streak}-dagars streak. Håll i.`, icon: Flame };
    if (waistChange <= -3) return { text: `${Math.abs(waistChange)} cm borta från midjan. Synligt.`, icon: Sparkles };
    if (latest && latest.steps >= RULES.steps) return { text: 'Steg är klara — den enklaste vinsten på dagen.', icon: Zap };
    return { text: 'En dag i taget. Bara nästa rätt val.', icon: Target };
  }, [streak, waistChange, latest]);

  const MotivIcon = motivation.icon;

  // Veckosammanfattning
  const weekSummary = useMemo(() => {
    const last7 = profile.entries.slice(-7);
    if (last7.length === 0) return null;
    return {
      avgKcal: Math.round(last7.reduce((s, e) => s + (Number(e.kcal) || 0), 0) / last7.length),
      avgProtein: Math.round(last7.reduce((s, e) => s + (Number(e.protein) || 0), 0) / last7.length),
      avgSteps: Math.round(last7.reduce((s, e) => s + (Number(e.steps) || 0), 0) / last7.length),
      avgSleep: +(last7.reduce((s, e) => s + (Number(e.sleep) || 0), 0) / last7.length).toFixed(1),
      workouts: last7.filter(e => e.workout).length,
      alcDays: last7.filter(e => e.alcohol).length,
      approvedDays: last7.filter(e => isDayApproved(e)).length,
    };
  }, [profile.entries]);

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="flex items-end justify-between mb-1">
          <span className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold">Vecka {week} av 12</span>
          <span className="text-[11px] text-stone-500 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-lime-500 to-lime-600 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Fas-kort — hero */}
      <div className="px-4">
        <Card className="overflow-hidden">
          <div
            className="p-5 text-white relative"
            style={{ background: `linear-gradient(135deg, ${phase.accent} 0%, #1a2e05 130%)` }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-1.5 font-semibold">
                Fas {PROGRAM.indexOf(phase) + 1} / 6
              </div>
              <h2 className="font-display text-2xl font-semibold leading-tight mb-2">{phase.title}</h2>
              <p className="text-sm opacity-90 leading-snug">{phase.goal}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur rounded-full text-[11px] font-medium">
                <Target className="w-3 h-3" />
                {phase.expected}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Motivation */}
      <div className="px-4">
        <Card className="p-4 flex items-center gap-3 bg-lime-50 border-lime-200">
          <div className="w-9 h-9 rounded-full bg-lime-500 flex items-center justify-center text-white shrink-0">
            <MotivIcon className="w-4 h-4" />
          </div>
          <p className="text-sm text-stone-800 font-medium leading-snug">{motivation.text}</p>
        </Card>
      </div>

      {/* Nyckeltal */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <Stat
            label="Midja nu"
            value={latest?.waist || '—'}
            unit="cm"
            hint={`Start: ${profile.startWaist} cm`}
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Förändring"
            value={waistChange > 0 ? `+${waistChange}` : waistChange}
            unit="cm"
            status={waistChange < 0 ? 'good' : waistChange == 0 ? 'neutral' : 'warn'}
            hint="från start"
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Streak"
            value={streak}
            unit={streak === 1 ? 'dag' : 'dagar'}
            status={streak >= 3 ? 'good' : streak >= 1 ? 'warn' : 'neutral'}
            hint="godkända rutiner i rad"
          />
        </Card>
        <Card className="p-4">
          <Stat
            label="Vikt"
            value={latest?.weight || '—'}
            unit="kg"
            hint={`Start: ${profile.startWeight} kg`}
          />
        </Card>
      </div>

      {/* Dagens fokus */}
      <div className="px-4">
        <Card className="p-4 bg-stone-900 text-stone-50 border-stone-900">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-lime-400" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-stone-400 font-semibold">Dagens fokus</span>
          </div>
          <p className="font-display text-lg leading-snug font-medium">{focusTip}</p>
        </Card>
      </div>

      {/* Dagens checklista */}
      <div className="px-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-semibold text-stone-900">Dagens checklista</h3>
            <button
              onClick={() => setView('checkin')}
              className="text-[11px] font-semibold text-lime-700 flex items-center gap-0.5"
            >
              Logga <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {phase.checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                <div className="w-1 h-1 rounded-full bg-lime-600 mt-2 shrink-0" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
          {phase.avoid && phase.avoid.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-100">
              <div className="text-[10px] uppercase tracking-[0.12em] text-rose-600 font-semibold mb-1.5">Undvik</div>
              {phase.avoid.map((item, i) => (
                <div key={i} className="text-sm text-stone-600 leading-snug">— {item}</div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Idag status */}
      {todayEntry && (
        <div className="px-4">
          <Card className="p-4">
            <h3 className="font-display text-base font-semibold text-stone-900 mb-3">Idag</h3>
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Kcal" value={todayEntry.kcal || '—'} status={todayEntry.kcal ? statusColor(todayEntry.kcal, [RULES.kcal - 200, RULES.kcal + 100], 'range') : 'neutral'} />
              <Stat label="Protein" value={todayEntry.protein || '—'} status={todayEntry.protein ? statusColor(todayEntry.protein, RULES.proteinMin) : 'neutral'} />
              <Stat label="Steg" value={todayEntry.steps ? `${(todayEntry.steps/1000).toFixed(1)}k` : '—'} status={todayEntry.steps ? statusColor(todayEntry.steps, RULES.steps) : 'neutral'} />
              <Stat label="Sömn" value={todayEntry.sleep || '—'} status={todayEntry.sleep ? statusColor(todayEntry.sleep, RULES.sleepMin) : 'neutral'} />
            </div>
          </Card>
        </div>
      )}

      {/* Veckosammanfattning */}
      {weekSummary && (
        <div className="px-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base font-semibold text-stone-900">Senaste 7 dagar</h3>
              <span className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
                {weekSummary.approvedDays}/7 godkända
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex items-center gap-2">
                <StatusDot status={statusColor(weekSummary.avgKcal, [RULES.kcal - 200, RULES.kcal + 100], 'range')} />
                <span className="text-stone-600">Snitt kcal</span>
                <span className="ml-auto font-semibold text-stone-900">{weekSummary.avgKcal}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={statusColor(weekSummary.avgProtein, RULES.proteinMin)} />
                <span className="text-stone-600">Snitt protein</span>
                <span className="ml-auto font-semibold text-stone-900">{weekSummary.avgProtein}g</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={statusColor(weekSummary.avgSteps, RULES.steps)} />
                <span className="text-stone-600">Snitt steg</span>
                <span className="ml-auto font-semibold text-stone-900">{(weekSummary.avgSteps/1000).toFixed(1)}k</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={statusColor(weekSummary.avgSleep, RULES.sleepMin)} />
                <span className="text-stone-600">Snitt sömn</span>
                <span className="ml-auto font-semibold text-stone-900">{weekSummary.avgSleep}h</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={weekSummary.workouts >= 2 ? 'good' : 'warn'} />
                <span className="text-stone-600">Pass</span>
                <span className="ml-auto font-semibold text-stone-900">{weekSummary.workouts}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={weekSummary.alcDays === 0 ? 'good' : weekSummary.alcDays <= 2 ? 'warn' : 'bad'} />
                <span className="text-stone-600">Alkohol</span>
                <span className="ml-auto font-semibold text-stone-900">{weekSummary.alcDays}d</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------

const InputRow = ({ icon: Icon, label, value, onChange, unit, type = 'number', placeholder }) => (
  <div className="flex items-center gap-3 py-3.5 border-b border-stone-100 last:border-b-0">
    <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-sm text-stone-700 font-medium flex-1">{label}</span>
    <div className="flex items-baseline gap-1">
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '—'}
        className="w-20 text-right text-lg font-display font-semibold text-stone-900 bg-transparent outline-none focus:text-lime-700 placeholder:text-stone-300 placeholder:font-normal"
      />
      {unit && <span className="text-xs text-stone-500 font-medium w-8">{unit}</span>}
    </div>
  </div>
);

const CheckIn = ({ profile, onSave }) => {
  const existing = profile.entries.find(e => e.date === todayKey());
  const [form, setForm] = useState(existing || {
    date: todayKey(),
    weight: '',
    waist: '',
    kcal: '',
    protein: '',
    steps: '',
    sleep: '',
    workout: false,
    alcohol: false,
    mood: 3,
    note: '',
  });
  const [saved, setSaved] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1">Daglig check-in</div>
        <h1 className="font-display text-3xl font-semibold text-stone-900">{formatDate(todayKey())}</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Mätningar */}
        <Card className="px-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold pt-3 pb-1">Mätningar (morgon)</div>
          <InputRow icon={Activity} label="Vikt" value={form.weight} onChange={(v) => update('weight', v)} unit="kg" placeholder="0.0" />
          <InputRow icon={Target} label="Midjemått" value={form.waist} onChange={(v) => update('waist', v)} unit="cm" placeholder="0.0" />
        </Card>

        {/* Mat & rörelse */}
        <Card className="px-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold pt-3 pb-1">Mat & rörelse</div>
          <InputRow icon={Flame} label="Kalorier" value={form.kcal} onChange={(v) => update('kcal', v)} unit="kcal" placeholder="2400" />
          <InputRow icon={Beef} label="Protein" value={form.protein} onChange={(v) => update('protein', v)} unit="g" placeholder="180" />
          <InputRow icon={Footprints} label="Steg" value={form.steps} onChange={(v) => update('steps', v)} unit="st" placeholder="12500" />
          <InputRow icon={Moon} label="Sömn" value={form.sleep} onChange={(v) => update('sleep', v)} unit="h" placeholder="7.5" />
        </Card>

        {/* Toggles */}
        <Card className="p-4 space-y-3">
          <ToggleRow
            icon={Dumbbell}
            label="Styrketräningspass idag"
            active={form.workout}
            onToggle={() => update('workout', !form.workout)}
            color="lime"
          />
          <ToggleRow
            icon={Wine}
            label="Alkohol idag"
            active={form.alcohol}
            onToggle={() => update('alcohol', !form.alcohol)}
            color="rose"
          />
        </Card>

        {/* Humör */}
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-3">Humör & energi</div>
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => update('mood', n)}
                className={`flex-1 aspect-square rounded-xl font-display text-xl font-semibold transition-all ${
                  form.mood === n
                    ? 'bg-stone-900 text-lime-400 scale-105'
                    : 'bg-stone-100 text-stone-400'
                }`}
              >
                {['😩', '😕', '😐', '🙂', '🔥'][n - 1]}
              </button>
            ))}
          </div>
        </Card>

        {/* Kommentar */}
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-2">Kommentar</div>
          <textarea
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="Hur kändes dagen?"
            className="w-full text-sm text-stone-800 bg-transparent outline-none resize-none min-h-[60px] placeholder:text-stone-400"
          />
        </Card>

        <button
          onClick={save}
          className={`w-full py-4 rounded-2xl font-display text-base font-semibold transition-all active:scale-[0.98] ${
            saved ? 'bg-lime-600 text-white' : 'bg-stone-900 text-lime-400'
          }`}
        >
          {saved ? '✓ Sparat' : 'Spara check-in'}
        </button>
      </div>
    </div>
  );
};

const ToggleRow = ({ icon: Icon, label, active, onToggle, color }) => (
  <div className="flex items-center gap-3">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
      active
        ? color === 'lime' ? 'bg-lime-500 text-white' : 'bg-rose-500 text-white'
        : 'bg-stone-100 text-stone-500'
    }`}>
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-sm text-stone-700 font-medium flex-1">{label}</span>
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
        active ? (color === 'lime' ? 'bg-lime-500' : 'bg-rose-500') : 'bg-stone-200'
      }`}
    >
      <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

// ----------------------------------------------------------------

const WeekProgram = ({ currentWeek }) => {
  const [openPhase, setOpenPhase] = useState(PROGRAM.indexOf(getPhase(currentWeek)));

  return (
    <div className="pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1">12 veckor</div>
        <h1 className="font-display text-3xl font-semibold text-stone-900">Programmet</h1>
        <p className="text-sm text-stone-600 mt-1">-9 till -12 cm midja. Sex faser.</p>
      </div>

      <div className="px-4 space-y-2.5">
        {PROGRAM.map((phase, idx) => {
          const isOpen = openPhase === idx;
          const isCurrent = phase.weeks.includes(currentWeek);
          const isPast = currentWeek > Math.max(...phase.weeks);

          return (
            <Card
              key={idx}
              className={`overflow-hidden transition-all ${isCurrent ? 'ring-2 ring-lime-500 ring-offset-2 ring-offset-stone-50' : ''}`}
            >
              <button
                onClick={() => setOpenPhase(isOpen ? -1 : idx)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-white shrink-0 text-sm"
                  style={{ background: phase.accent }}
                >
                  v{phase.weeks.join('–')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">
                      Fas {idx + 1}
                    </div>
                    {isCurrent && <span className="text-[10px] uppercase tracking-[0.12em] text-lime-700 font-bold">Pågår</span>}
                    {isPast && <span className="text-[10px] uppercase tracking-[0.12em] text-stone-400 font-bold">Klar</span>}
                  </div>
                  <div className="font-display text-base font-semibold text-stone-900 leading-tight truncate">
                    {phase.title}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-stone-100">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">Mål</div>
                    <p className="text-sm text-stone-700 leading-snug">{phase.goal}</p>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1.5">Checklista</div>
                    <div className="space-y-1.5">
                      {phase.checklist.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
                          <div className="w-1 h-1 rounded-full bg-lime-600 mt-2 shrink-0" />
                          <span className="leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {phase.avoid && phase.avoid.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-rose-600 font-semibold mb-1.5">Undvik</div>
                      {phase.avoid.map((item, i) => (
                        <div key={i} className="text-sm text-stone-600 leading-snug">— {item}</div>
                      ))}
                    </div>
                  )}

                  {phase.adjust && (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-amber-700 font-semibold mb-1">Justering</div>
                      <p className="text-sm text-stone-700 leading-snug">{phase.adjust}</p>
                    </div>
                  )}

                  <div className="pt-2 mt-2 border-t border-stone-100">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">Förväntat</div>
                    <p className="text-sm font-display font-semibold text-stone-900">{phase.expected}</p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="px-4 mt-5">
        <Card className="p-4 bg-stone-900 text-stone-50 border-stone-900">
          <div className="text-[10px] uppercase tracking-[0.18em] text-lime-400 font-semibold mb-2">Total realistisk effekt</div>
          <div className="space-y-1.5 text-sm">
            <div>— 9 till 12 cm midja</div>
            <div>— Tydligt mindre buk</div>
            <div>— Lägre visceralt fett</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------

const Progress = ({ profile, onExport }) => {
  const data = profile.entries.map(e => ({
    date: e.date.slice(5),
    weight: Number(e.weight) || null,
    waist: Number(e.waist) || null,
    steps: Number(e.steps) || 0,
    sleep: Number(e.sleep) || 0,
    kcal: Number(e.kcal) || 0,
    protein: Number(e.protein) || 0,
  }));

  const latest = profile.entries[profile.entries.length - 1];
  const waistChange = latest ? (latest.waist - profile.startWaist).toFixed(1) : 0;
  const weightChange = latest ? (latest.weight - profile.startWeight).toFixed(1) : 0;

  return (
    <div className="pb-24">
      <div className="px-5 pt-6 pb-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1">Progress</div>
          <h1 className="font-display text-3xl font-semibold text-stone-900">Kurvan</h1>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-lime-400 rounded-xl text-xs font-semibold"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      </div>

      {/* Sammanfattning */}
      <div className="px-4 mb-3 grid grid-cols-2 gap-3">
        <Card className="p-4 bg-lime-50 border-lime-200">
          <div className="text-[10px] uppercase tracking-[0.12em] text-lime-800 font-semibold mb-1">Total midja</div>
          <div className="font-display text-3xl font-semibold text-stone-900">
            {waistChange > 0 ? `+${waistChange}` : waistChange} <span className="text-base text-stone-600">cm</span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-1">Total vikt</div>
          <div className="font-display text-3xl font-semibold text-stone-900">
            {weightChange > 0 ? `+${weightChange}` : weightChange} <span className="text-base text-stone-600">kg</span>
          </div>
        </Card>
      </div>

      <ChartCard title="Midjemått" unit="cm">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1c1917', border: 'none', borderRadius: 8, fontSize: 12, color: '#fafaf9' }} />
            <Line type="monotone" dataKey="waist" stroke="#65a30d" strokeWidth={2.5} dot={{ r: 2, fill: '#65a30d' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Vikt" unit="kg">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1c1917', border: 'none', borderRadius: 8, fontSize: 12, color: '#fafaf9' }} />
            <Line type="monotone" dataKey="weight" stroke="#1c1917" strokeWidth={2.5} dot={{ r: 2, fill: '#1c1917' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Steg/dag" unit="st">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1c1917', border: 'none', borderRadius: 8, fontSize: 12, color: '#fafaf9' }} />
            <ReferenceLine y={RULES.steps} stroke="#84cc16" strokeDasharray="3 3" />
            <Bar dataKey="steps" fill="#84cc16" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Sömn" unit="h">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1c1917', border: 'none', borderRadius: 8, fontSize: 12, color: '#fafaf9' }} />
            <ReferenceLine y={RULES.sleepMin} stroke="#84cc16" strokeDasharray="3 3" />
            <Bar dataKey="sleep" fill="#a3a3a3" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Kalorier & protein" unit="">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="kcal" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="protein" orientation="right" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1c1917', border: 'none', borderRadius: 8, fontSize: 12, color: '#fafaf9' }} />
            <ReferenceLine yAxisId="kcal" y={RULES.kcal} stroke="#a3a3a3" strokeDasharray="3 3" />
            <Line yAxisId="kcal" type="monotone" dataKey="kcal" stroke="#1c1917" strokeWidth={2} dot={false} name="Kcal" />
            <Line yAxisId="protein" type="monotone" dataKey="protein" stroke="#84cc16" strokeWidth={2} dot={false} name="Protein (g)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

const ChartCard = ({ title, unit, children }) => (
  <div className="px-4 mb-3">
    <Card className="p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-base font-semibold text-stone-900">{title}</h3>
        {unit && <span className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold">{unit}</span>}
      </div>
      {children}
    </Card>
  </div>
);

// ----------------------------------------------------------------

const BuddyView = ({ data, setData }) => {
  const me = data.me;
  const buddy = data.buddy;

  const computeStats = (p) => {
    const latest = p.entries[p.entries.length - 1];
    const last7 = p.entries.slice(-7);
    return {
      waistChange: latest ? +(latest.waist - p.startWaist).toFixed(1) : 0,
      weightChange: latest ? +(latest.weight - p.startWeight).toFixed(1) : 0,
      streak: computeStreak(p.entries),
      weekCheckins: last7.length,
      approvedDays: last7.filter(isDayApproved).length,
    };
  };

  const meStats = computeStats(me);
  const buddyStats = computeStats(buddy);

  const leader = meStats.waistChange < buddyStats.waistChange ? 'me' : meStats.waistChange > buddyStats.waistChange ? 'buddy' : 'tie';

  const renameProfile = (key) => {
    const newName = prompt('Nytt namn:', data[key].name);
    if (newName && newName.trim()) {
      setData({ ...data, [key]: { ...data[key], name: newName.trim() } });
    }
  };

  const switchActive = (key) => setData({ ...data, activeProfile: key });

  const Compare = ({ label, meVal, buddyVal, unit, lowerIsBetter = false }) => {
    const meBetter = lowerIsBetter ? meVal < buddyVal : meVal > buddyVal;
    return (
      <div className="py-3 border-b border-stone-100 last:border-b-0">
        <div className="text-[10px] uppercase tracking-[0.12em] text-stone-500 font-semibold mb-2">{label}</div>
        <div className="flex items-center gap-3">
          <div className={`flex-1 px-3 py-2.5 rounded-xl ${meBetter ? 'bg-lime-100 text-lime-900' : 'bg-stone-100 text-stone-700'}`}>
            <div className="text-[10px] font-semibold opacity-70 mb-0.5">{me.name}</div>
            <div className="font-display text-xl font-semibold">{meVal}{unit}</div>
          </div>
          <div className="text-stone-300 text-xs font-bold">VS</div>
          <div className={`flex-1 px-3 py-2.5 rounded-xl text-right ${!meBetter && meVal !== buddyVal ? 'bg-lime-100 text-lime-900' : 'bg-stone-100 text-stone-700'}`}>
            <div className="text-[10px] font-semibold opacity-70 mb-0.5">{buddy.name}</div>
            <div className="font-display text-xl font-semibold">{buddyVal}{unit}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-24">
      <div className="px-5 pt-6 pb-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1">Två kompisar</div>
        <h1 className="font-display text-3xl font-semibold text-stone-900">Duellen</h1>
      </div>

      {/* Aktiv profil-switcher */}
      <div className="px-4 mb-3">
        <Card className="p-1.5 flex">
          {['me', 'buddy'].map(key => (
            <button
              key={key}
              onClick={() => switchActive(key)}
              onDoubleClick={() => renameProfile(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-display font-semibold transition-all ${
                data.activeProfile === key ? 'bg-stone-900 text-lime-400' : 'text-stone-600'
              }`}
            >
              {data[key].name}
            </button>
          ))}
        </Card>
        <p className="text-[11px] text-stone-500 text-center mt-2">Dubbelklicka för att byta namn</p>
      </div>

      {/* Ledare */}
      {leader !== 'tie' && (
        <div className="px-4 mb-3">
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-amber-800 font-semibold">Leder just nu</div>
              <div className="font-display text-lg font-semibold text-stone-900">
                {leader === 'me' ? me.name : buddy.name}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Jämförelse */}
      <div className="px-4">
        <Card className="px-4">
          <Compare
            label="Midjeminskning"
            meVal={meStats.waistChange > 0 ? `+${meStats.waistChange}` : meStats.waistChange}
            buddyVal={buddyStats.waistChange > 0 ? `+${buddyStats.waistChange}` : buddyStats.waistChange}
            unit=" cm"
            lowerIsBetter
          />
          <Compare
            label="Viktförändring"
            meVal={meStats.weightChange > 0 ? `+${meStats.weightChange}` : meStats.weightChange}
            buddyVal={buddyStats.weightChange > 0 ? `+${buddyStats.weightChange}` : buddyStats.weightChange}
            unit=" kg"
            lowerIsBetter
          />
          <Compare
            label="Streak"
            meVal={meStats.streak}
            buddyVal={buddyStats.streak}
            unit=" dgr"
          />
          <Compare
            label="Godkända dagar (7d)"
            meVal={`${meStats.approvedDays}/7`}
            buddyVal={`${buddyStats.approvedDays}/7`}
            unit=""
          />
        </Card>
      </div>

      <div className="px-4 mt-3">
        <Card className="p-4 bg-stone-900 text-stone-50 border-stone-900">
          <Award className="w-5 h-5 text-lime-400 mb-2" />
          <p className="text-sm leading-snug">
            Två är hårdare än en. Den som halkar efter idag jagar imorgon.
          </p>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// HUVUDAPP
// ============================================================

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState('dashboard');

  useEffect(() => { saveData(data); }, [data]);

  const profile = data[data.activeProfile];

  const week = Math.min(12, Math.max(1, Math.floor(daysBetween(profile.startDate, todayKey()) / 7) + 1));

  const saveEntry = (entry) => {
    const others = profile.entries.filter(e => e.date !== entry.date);
    const newEntries = [...others, entry].sort((a, b) => a.date.localeCompare(b.date));
    setData({
      ...data,
      [data.activeProfile]: { ...profile, entries: newEntries }
    });
  };

  const exportCSV = () => {
    const headers = ['date', 'weight', 'waist', 'kcal', 'protein', 'steps', 'sleep', 'workout', 'alcohol', 'mood', 'note'];
    const rows = profile.entries.map(e =>
      headers.map(h => {
        const v = e[h];
        if (typeof v === 'string' && v.includes(',')) return `"${v.replace(/"/g, '""')}"`;
        return v ?? '';
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `12v-sommar-${profile.name}-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const views = {
    dashboard: <Dashboard profile={profile} week={week} setView={setView} />,
    checkin: <CheckIn profile={profile} onSave={saveEntry} />,
    program: <WeekProgram currentWeek={week} />,
    progress: <Progress profile={profile} onExport={exportCSV} />,
    buddy: <BuddyView data={data} setData={setData} />,
  };

  const navItems = [
    { key: 'dashboard', icon: Home, label: 'Hem' },
    { key: 'checkin', icon: ClipboardCheck, label: 'Logga' },
    { key: 'program', icon: Calendar, label: 'Program' },
    { key: 'progress', icon: TrendingUp, label: 'Progress' },
    { key: 'buddy', icon: Users, label: 'Duell' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-body antialiased">
      <style>{`
        .font-display { font-family: 'Bricolage Grotesque', system-ui, sans-serif; letter-spacing: -0.02em; }
        .font-body { font-family: 'Inter Tight', system-ui, sans-serif; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Toppband med appnamn — bara på dashboard */}
      {view === 'dashboard' && (
        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
              <span className="text-lime-400 font-display font-bold text-xs">12</span>
            </div>
            <span className="font-display font-semibold text-stone-900 text-sm tracking-tight">
              12 veckor till sommaren
            </span>
          </div>
          <button
            onClick={() => {
              const which = data.activeProfile === 'me' ? 'me' : 'buddy';
              setData(d => ({ ...d, activeProfile: d.activeProfile === 'me' ? 'buddy' : 'me' }));
            }}
            className="text-[11px] font-semibold text-stone-600 bg-white px-2.5 py-1.5 rounded-full border border-stone-200"
          >
            {profile.name}
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {views[view]}
      </div>

      {/* Bottennav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-stone-200 pb-safe">
        <div className="max-w-md mx-auto flex">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-colors ${
                  active ? 'text-stone-900' : 'text-stone-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-stone-900 text-lime-400' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-semibold tracking-tight ${active ? 'text-stone-900' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
