"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Bell, Brain, Palette, Shield, Save, CheckCircle2,
  Loader2, ChevronRight, Zap, Clock,
  BookOpen, Target, Sliders, RefreshCw, Download, Trash2, Camera
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface ProfileSettings {
  name: string;
  email: string;
  studyGoal: string;
  dailyHours: number;
  learningPace: string;
}

interface NotificationSettings {
  studyReminders: boolean;
  deadlineAlerts: boolean;
  aiSuggestions: boolean;
  progressReports: boolean;
  weeklyDigest: boolean;
}

interface AISettings {
  difficultyLevel: string;
  focusSubjects: string[];
  studyStyle: string;
  enableAutoSchedule: boolean;
  enableAdaptiveLearning: boolean;
}

interface AppearanceSettings {
  theme: string;
  accentColor: string;
  fontSize: string;
  compactMode: boolean;
}

interface StatsData {
  totalStudySessions: number;
  knowledgeItems: number;
  plannerTasks: number;
  lastActive: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Reusable Toggle ────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${on ? 'bg-[#00f2fe]' : 'bg-white/10'}`}
      aria-checked={on}
      role="switch"
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${on ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Section Wrapper ────────────────────────────────────────────────────────

function Section({ icon: Icon, title, accent, children }: {
  icon: React.ElementType;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-6 transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Row Helpers ────────────────────────────────────────────────────────────

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'ai' | 'appearance' | 'account'>('profile');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isDirty = useRef(false);

  const [profile, setProfile] = useState<ProfileSettings>({
    name: '', email: '', studyGoal: '', dailyHours: 4, learningPace: 'Medium',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    studyReminders: true, deadlineAlerts: true, aiSuggestions: true,
    progressReports: false, weeklyDigest: true,
  });

  const [ai, setAI] = useState<AISettings>({
    difficultyLevel: 'Intermediate', focusSubjects: [], studyStyle: 'Mixed',
    enableAutoSchedule: true, enableAdaptiveLearning: true,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'dark', accentColor: '#00f2fe', fontSize: 'medium', compactMode: false,
  });

  const [stats, setStats] = useState<StatsData | null>(null);

  // ── Fetch Settings ─────────────────────────────────────────────────────

  const fetchSettings = useCallback(async (force = false) => {
    // CRITICAL: Don't overwrite user's unsaved edits
    if (isDirty.current && !force) return;
    try {
      const res = await fetch('/api/dashboard/settings');
      if (res.ok) {
        const data = await res.json();
        if (!isDirty.current) {
          setProfile(data.profile);
          setNotifications(data.notifications);
          setAI(data.ai);
          setAppearance(data.appearance);
        }
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchSettings]);

  // ── Instant Theme Engine ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof document !== 'undefined') {
       const root = document.documentElement;
       root.style.setProperty('--accent-color', appearance.accentColor);
       if (appearance.theme === 'light') {
         root.classList.add('light-mode');
       } else {
         root.classList.remove('light-mode');
       }
    }
  }, [appearance.theme, appearance.accentColor]);

  // ── Save Settings ──────────────────────────────────────────────────────

  const markDirty = () => { isDirty.current = true; };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/dashboard/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, notifications, ai, appearance }),
      });
      if (res.ok) {
        const data = await res.json();
        isDirty.current = false;
        setSaveStatus('saved');
        setLastSaved(new Date(data.timestamp).toLocaleTimeString());
        fetchSettings(true); // Force refresh from DB
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      console.error('Failed to save', e);
      setSaveStatus('error');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Settings', icon: Brain },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'account', label: 'Account', icon: Shield },
  ] as const;

  const accentColors = ['#00f2fe', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4 text-gray-400">
          <Loader2 className="w-10 h-10 text-[#00f2fe] animate-spin" />
          <p className="text-sm">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-outfit font-bold tracking-tight">Settings</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {lastSaved ? `Last saved at ${lastSaved}` : 'Manage your IntelliTwin preferences.'}
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg ${
            saveStatus === 'saved'
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : saveStatus === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white hover:scale-105 hover:shadow-[#00f2fe]/30'
          }`}
        >
          {saveStatus === 'saving' ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saveStatus === 'saved' ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Changes</>
          )}
        </button>
      </div>

      {/* Account Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Study Sessions', value: stats.totalStudySessions, icon: Clock, color: 'text-[#00f2fe]' },
            { label: 'Knowledge Items', value: stats.knowledgeItems, icon: BookOpen, color: 'text-purple-400' },
            { label: 'Planner Tasks', value: stats.plannerTasks, icon: Target, color: 'text-orange-400' },
            { label: 'Last Active', value: new Date(stats.lastActive).toLocaleDateString(), icon: Zap, color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">{s.label}</p>
                <p className="font-bold text-base">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="md:w-56 flex-shrink-0">
          <div className="glass-panel rounded-2xl p-2 space-y-1 sticky top-24">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">

          {/* ── Profile Tab ─────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <>
              <Section icon={User} title="Personal Information" accent="bg-[#00f2fe]/10 text-[#00f2fe]">
                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00f2fe] to-[#4facfe] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <button onClick={() => alert("Image upload functionality coming soon!")} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{profile.name}</p>
                    <p className="text-sm text-gray-400">{profile.email}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#00f2fe]/10 text-[#00f2fe] mt-1 inline-block">
                      IntelliTwin Pro
                    </span>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'name', type: 'text' },
                    { label: 'Email Address', key: 'email', type: 'email' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">{f.label}</label>
                      <input
                        type={f.type}
                        value={profile[f.key as keyof ProfileSettings] as string}
                        onChange={(e) => { markDirty(); setProfile((p) => ({ ...p, [f.key]: e.target.value })); }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Study Goal</label>
                  <input
                    type="text"
                    value={profile.studyGoal}
                    onChange={(e) => { markDirty(); setProfile((p) => ({ ...p, studyGoal: e.target.value })); }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 transition-all"
                    placeholder="e.g. Master Computer Science fundamentals"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Daily Study Hours</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={1} max={12} value={profile.dailyHours}
                        onChange={(e) => { markDirty(); setProfile((p) => ({ ...p, dailyHours: +e.target.value })); }}
                        className="flex-1 accent-[#00f2fe]"
                      />
                      <span className="text-[#00f2fe] font-bold w-10 text-center">{profile.dailyHours}h</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 block mb-2">Learning Pace</label>
                    <select
                      value={profile.learningPace}
                      onChange={(e) => { markDirty(); setProfile((p) => ({ ...p, learningPace: e.target.value })); }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00f2fe]"
                    >
                      {['Slow', 'Medium', 'Fast'].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ── Notifications Tab ────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <Section icon={Bell} title="Notification Preferences" accent="bg-orange-500/10 text-orange-400">
              {[
                { key: 'studyReminders', label: 'Study Reminders', desc: 'Get notified when your study session is about to start.' },
                { key: 'deadlineAlerts', label: 'Deadline Alerts', desc: 'Receive alerts before assignment and exam deadlines.' },
                { key: 'aiSuggestions', label: 'AI Suggestions', desc: 'IntelliTwin sends smart study tips and plan adjustments.' },
                { key: 'progressReports', label: 'Progress Reports', desc: 'Daily summaries of your study activity.' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'A weekly overview of your performance and goals.' },
              ].map((item) => (
                <SettingRow key={item.key} label={item.label} desc={item.desc}>
                  <Toggle
                    on={notifications[item.key as keyof NotificationSettings]}
                    onChange={(v) => { markDirty(); setNotifications((n) => ({ ...n, [item.key]: v })); }}
                  />
                </SettingRow>
              ))}
            </Section>
          )}

          {/* ── AI Settings Tab ──────────────────────────────────────────── */}
          {activeTab === 'ai' && (
            <>
              <Section icon={Brain} title="AI Personalization" accent="bg-purple-500/10 text-purple-400">
                <SettingRow label="Difficulty Level" desc="How challenging should your study plan be?">
                  <select
                    value={ai.difficultyLevel}
                    onChange={(e) => { markDirty(); setAI((a) => ({ ...a, difficultyLevel: e.target.value })); }}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </SettingRow>

                <SettingRow label="Study Style" desc="Your preferred way of learning.">
                  <select
                    value={ai.studyStyle}
                    onChange={(e) => { markDirty(); setAI((a) => ({ ...a, studyStyle: e.target.value })); }}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    {['Visual', 'Reading', 'Practice', 'Mixed'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </SettingRow>

                <SettingRow label="Auto-Schedule" desc="Let AI automatically arrange your daily study plan.">
                  <Toggle on={ai.enableAutoSchedule} onChange={(v) => { markDirty(); setAI((a) => ({ ...a, enableAutoSchedule: v })); }} />
                </SettingRow>

                <SettingRow label="Adaptive Learning" desc="AI adjusts difficulty based on your performance.">
                  <Toggle on={ai.enableAdaptiveLearning} onChange={(v) => { markDirty(); setAI((a) => ({ ...a, enableAdaptiveLearning: v })); }} />
                </SettingRow>
              </Section>

              <Section icon={Sliders} title="Focus Subjects" accent="bg-purple-500/10 text-purple-400">
                <p className="text-xs text-gray-500">Select the subjects you want the AI to prioritize in your plan.</p>
                <div className="flex flex-wrap gap-2">
                  {['Data Structures', 'Algorithms', 'OS', 'DBMS', 'Networks', 'Math', 'Web Dev', 'Machine Learning'].map((sub) => {
                    const isSelected = ai.focusSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          markDirty();
                          setAI((a) => ({
                            ...a,
                            focusSubjects: isSelected
                              ? a.focusSubjects.filter((s) => s !== sub)
                              : [...a.focusSubjects, sub],
                          }));
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </Section>
            </>
          )}

          {/* ── Appearance Tab ───────────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <Section icon={Palette} title="Theme & Display" accent="bg-emerald-500/10 text-emerald-400">
              <SettingRow label="Accent Color" desc="Choose your dashboard highlight color.">
                <div className="flex gap-2">
                  {accentColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => { markDirty(); setAppearance((a) => ({ ...a, accentColor: c })); }}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-all ${appearance.accentColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'opacity-60 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Font Size" desc="Adjust dashboard text size for readability.">
                <select
                  value={appearance.fontSize}
                  onChange={(e) => { markDirty(); setAppearance((a) => ({ ...a, fontSize: e.target.value })); }}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                >
                  {['small', 'medium', 'large'].map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                </select>
              </SettingRow>

              <SettingRow label="Compact Mode" desc="Denser layout for more information on screen.">
                <Toggle on={appearance.compactMode} onChange={(v) => { markDirty(); setAppearance((a) => ({ ...a, compactMode: v })); }} />
              </SettingRow>

              {/* Preview */}
              <div className="mt-4 p-5 rounded-2xl border border-white/10 bg-black/20">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 mb-3">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: appearance.accentColor + '20', color: appearance.accentColor }}>
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: appearance.accentColor }}>IntelliTwin</p>
                    <p className="text-gray-500 text-xs">Your AI Digital Twin</p>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ── Account Tab ──────────────────────────────────────────────── */}
          {activeTab === 'account' && (
            <>
              <Section icon={Shield} title="Account Security" accent="bg-blue-500/10 text-blue-400">
                <SettingRow label="Change Password" desc="Update your account password.">
                  <button onClick={() => alert("A password reset link has been sent to your email.")} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all">
                    Update
                  </button>
                </SettingRow>
                <SettingRow label="Two-Factor Authentication" desc="Extra security for your account.">
                  <Toggle on={false} onChange={() => alert("Two-Factor Authentication requires app setup.")} />
                </SettingRow>
                <SettingRow label="Active Sessions" desc="Manage where you are logged in.">
                  <button onClick={() => alert("You are currently only logged in on this device.")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> View
                  </button>
                </SettingRow>
              </Section>

              <Section icon={Download} title="Data Management" accent="bg-emerald-500/10 text-emerald-400">
                <SettingRow label="Export My Data" desc="Download all your study data and preferences.">
                  <button 
                    onClick={() => alert("Data export started. You will receive an email link shortly.")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </SettingRow>
                <SettingRow label="Reset AI Model" desc="Clear your AI twin's learned preferences and start fresh.">
                  <button 
                    onClick={async () => {
                      if(confirm("Are you sure? This will reset your AI twin's learned behaviors.")) {
                         setAI({ difficultyLevel: 'Intermediate', focusSubjects: [], studyStyle: 'Mixed', enableAutoSchedule: true, enableAdaptiveLearning: true });
                         alert("AI Model Reset Complete.");
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-semibold hover:bg-orange-500/20 transition-all"
                   >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset
                  </button>
                </SettingRow>
                <SettingRow label="Delete Account" desc="Permanently remove your account and all data.">
                  <button 
                    onClick={() => alert("Account deletion requires verification. Check your email.")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </SettingRow>
              </Section>
            </>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        :root {
          --accent-primary: ${appearance.accentColor};
        }
        
        .light-mode {
          background-color: #f8fafc !important;
          color: #1e293b !important;
        }
        .light-mode .glass-card, .light-mode .glass-panel {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: rgba(0, 0, 0, 0.05) !important;
          color: #1e293b !important;
        }
        .light-mode h1, .light-mode h2, .light-mode h3, .light-mode h4, .light-mode .font-bold {
          color: #0f172a !important;
        }
      `}</style>
    </div>
  );
}
