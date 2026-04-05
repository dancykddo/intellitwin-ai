"use client";

import { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon, Clock, GripVertical, Plus, Sparkles,
  CheckCircle2, Loader2, AlertCircle, TrendingUp, Target, Zap, Brain, X,
  BookOpen, ListChecks, HelpCircle, BarChart3, FileText,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  time: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  category: 'Today' | 'Upcoming' | 'Completed' | string;
  completed: boolean;
}

interface Stats {
  dailyPercentage: number;
  weeklyCompletion: number;
  studyHours: number;
  totalTasks: number;
  completedTasks: number;
}

interface Notification {
  id: string;
  type: 'deadline' | 'recommendation' | 'reminder';
  message: string;
  timestamp: string;
}

type PlannerTab = 'summary' | 'modules' | 'studyplan' | 'qna' | 'tasks';

export default function StudyPlanner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [activeTab, setActiveTab] = useState<PlannerTab>('summary');

  // Q&A state
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [activeQA, setActiveQA] = useState<any | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const fetchPlannerData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/dashboard/planner/live');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setStats(data.stats);
        setSuggestions(data.suggestions);
        setNotifications(data.notifications);
        setLatestAnalysis(data.latestAnalysis);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('Failed to fetch planner data', error);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  useEffect(() => {
    fetchPlannerData();
    const interval = setInterval(fetchPlannerData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTaskComplete = async (taskId: string) => {
    const toggleTarget = tasks.find(t => t.id === taskId);
    if (!toggleTarget) return;
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, completed: !task.completed, category: !task.completed ? 'Completed' : 'Today' }
        : task
    ));
    try {
      await fetch('/api/dashboard/planner/save', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: !toggleTarget.completed, category: !toggleTarget.completed ? 'Completed' : 'Today' }),
      });
      fetchPlannerData();
    } catch (error) { console.error('Failed to update task', error); }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await fetch('/api/dashboard/planner/save', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });
      fetchPlannerData();
    } catch (error) { console.error('Failed to delete task', error); }
  };

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    const newTask = {
      id: 'ui-' + Date.now().toString(),
      title: newTaskTitle,
      time: '10:00 AM',
      duration: '1 hour',
      priority: 'Medium',
      category: 'Today',
      completed: false,
    };
    setNewTaskTitle('');
    setTasks(prev => [newTask, ...prev]);
    try {
      await fetch('/api/dashboard/planner/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      fetchPlannerData();
    } catch (error) { console.error('Failed to add task', error); }
    finally { setAddingTask(false); }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-white/10 text-gray-400';
    }
  };

  const TABS: { id: PlannerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'summary',   label: 'Summary',    icon: <FileText className="w-4 h-4" /> },
    { id: 'modules',   label: 'Modules',    icon: <BookOpen className="w-4 h-4" /> },
    { id: 'studyplan', label: 'Study Plan', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'qna',       label: 'Q & A',      icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'tasks',     label: 'Tasks',      icon: <ListChecks className="w-4 h-4" /> },
  ];

  const analysis = latestAnalysis?.analysis;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-outfit font-bold">AI Study Planner</h1>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <p className="text-gray-400">Dynamically generated from your uploaded document.</p>
            {lastUpdated && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                {isSyncing ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <Clock className="w-2.5 h-2.5"/>}
                Last Sync: {lastUpdated}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={fetchPlannerData}
          disabled={isSyncing}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8a2be2] to-[#bc78ec] text-white rounded-full text-sm font-bold shadow-lg hover:shadow-[#8a2be2]/20 hover:scale-105 transition-all disabled:opacity-50"
        >
          {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Refresh Plan
        </button>
      </div>

      {/* ─── Stats Cards ────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Daily Progress',    value: `${stats.dailyPercentage}%`,        icon: <Target className="w-5 h-5"/>,       color: 'text-[#00f2fe]',   bar: stats.dailyPercentage,   barColor: 'bg-[#00f2fe]' },
            { label: 'Weekly Completion', value: `${stats.weeklyCompletion}%`,       icon: <TrendingUp className="w-5 h-5"/>,   color: 'text-purple-400',  bar: stats.weeklyCompletion,  barColor: 'bg-purple-400' },
            { label: 'Study Hours',       value: `${stats.studyHours}h`,             icon: <Clock className="w-5 h-5"/>,        color: 'text-orange-400',  bar: null,                    barColor: '' },
            { label: 'Tasks Complete',    value: `${stats.completedTasks}/${stats.totalTasks}`, icon: <CheckCircle2 className="w-5 h-5"/>, color: 'text-emerald-400', bar: null, barColor: '' },
          ].map(({ label, value, icon, color, bar, barColor }) => (
            <div key={label} className="glass-card p-5 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-3">
                <span className={`p-2 bg-white/5 rounded-lg ${color}`}>{icon}</span>
                <span className="text-2xl font-bold">{value}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
              {bar !== null && (
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div className={`${barColor} h-full transition-all duration-1000`} style={{ width: `${bar}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── AI File Intelligence Panel ─────────────────────────────────── */}
      {latestAnalysis ? (
        <div className="glass-card rounded-3xl mb-10 border border-[#00f2fe]/20 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
          {/* Panel Header */}
          <div className="p-6 md:p-8 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#00f2fe]/20 to-[#00f2fe]/5 border border-[#00f2fe]/20 rounded-2xl text-[#00f2fe]">
                <Brain className="w-6 h-6 animate-pulse"/>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  File Intelligence
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] uppercase font-black tracking-widest border border-emerald-500/20">Active</span>
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Source: <span className="text-[#00f2fe] font-medium">{latestAnalysis.fileName}</span>
                  {analysis?.topics?.length && (
                    <span className="ml-2 text-gray-500">· {analysis.topics.length} topics · {analysis.estimatedTime}</span>
                  )}
                </p>
              </div>
            </div>
            {/* Tab Bar */}
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-2xl flex-wrap">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#8a2be2] to-[#bc78ec] text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Summary ──────────────────────────────────────────────── */}
          {activeTab === 'summary' && (
            <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#00f2fe] mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3"/> Executive Summary
                  </h3>
                  <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-sm text-gray-300 leading-relaxed">{analysis?.summary}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2">
                    <Target className="w-3 h-3"/> Key Topics Identified
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis?.topics?.map((topic: string) => (
                      <span key={topic} className="px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl text-xs font-bold text-purple-300">
                        {topic}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Difficulty</span>
                      <span className={`font-bold text-lg ${analysis?.difficulty === 'Advanced' ? 'text-orange-400' : 'text-emerald-400'}`}>{analysis?.difficulty}</span>
                    </div>
                    <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Est. Time</span>
                      <span className="font-bold text-lg text-white">{analysis?.estimatedTime}</span>
                    </div>
                    <div className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-1">Modules</span>
                      <span className="font-bold text-lg text-white">{analysis?.modules?.length ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Modules ──────────────────────────────────────────────── */}
          {activeTab === 'modules' && (
            <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysis?.modules?.map((mod: any) => (
                  <div key={mod.id} className={`p-5 rounded-3xl border transition-all relative group shadow-sm ${completedModules.includes(mod.id) ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/20 border-white/10 hover:border-[#00f2fe]/30'}`}>
                    {completedModules.includes(mod.id) && <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-emerald-500" />}
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase text-gray-500">
                      <span className="text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded-full">{mod.date}</span>
                      <Clock className="w-3 h-3"/> {mod.time}
                    </div>
                    <h4 className="font-bold text-base mb-3 leading-snug text-white">{mod.title}</h4>
                    <ul className="space-y-2 mb-5">
                      {mod.subtopics?.map((sub: string, j: number) => (
                        <li key={j} className="text-xs text-gray-400 flex items-start gap-2 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] mt-1.5 shrink-0" />
                          <span className="line-clamp-3">{sub}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => {
                        if (!completedModules.includes(mod.id)) {
                          setShowAnswers(false);
                          setActiveQA(mod);
                        }
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all ${completedModules.includes(mod.id) ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-gradient-to-r from-purple-600 to-[#bc78ec] hover:scale-105 text-white shadow-lg shadow-purple-500/20'}`}
                    >
                      {completedModules.includes(mod.id)
                        ? <><CheckCircle2 className="w-4 h-4"/> Completed</>
                        : <><HelpCircle className="w-4 h-4"/> Start Q&A Check</>}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3 text-xs text-gray-500">
                <BarChart3 className="w-4 h-4 text-[#00f2fe]"/>
                <span>{completedModules.length} of {analysis?.modules?.length ?? 0} modules completed</span>
                <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden ml-2">
                  <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${analysis?.modules?.length ? (completedModules.length / analysis.modules.length) * 100 : 0}%` }}/>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Study Plan ───────────────────────────────────────────── */}
          {activeTab === 'studyplan' && (
            <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {analysis?.studyPlan ? (
                <div className="space-y-6">
                  {analysis.studyPlan.map((day: any, i: number) => (
                    <div key={i} className="flex gap-6">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8a2be2] to-[#bc78ec] flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg">
                          {i + 1}
                        </div>
                        {i < analysis.studyPlan.length - 1 && <div className="w-px flex-1 bg-white/5 mt-2"/>}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-baseline gap-3 mb-3">
                          <h4 className="font-bold text-lg">{day.day}</h4>
                          <span className="text-xs text-[#00f2fe] font-bold bg-[#00f2fe]/10 px-2 py-0.5 rounded-full">{day.date}</span>
                        </div>
                        <div className="space-y-3">
                          {day.slots?.map((slot: any, j: number) => (
                            <div key={j} className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#00f2fe] shrink-0 w-36">
                                <Clock className="w-3 h-3"/> {slot.time}
                              </div>
                              <p className="text-sm text-gray-300 font-medium">{slot.activity}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 opacity-40">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3"/>
                  <p>Upload a file to generate a date-wise study plan.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Q&A ─────────────────────────────────────────────────── */}
          {activeTab === 'qna' && (
            <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {analysis?.qaSession?.length > 0 ? (
                <div className="space-y-5">
                  <p className="text-xs text-gray-500 uppercase font-black tracking-widest flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400"/>
                    {analysis.qaSession.length} Questions generated from file content
                  </p>
                  {analysis.qaSession.map((qa: any, i: number) => (
                    <QACard key={i} qa={qa} idx={i} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 opacity-40">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3"/>
                  <p>No Q&A available. Upload a text-rich PDF to generate questions.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Tasks ───────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="p-6 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Add Task */}
              <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Add a study task…"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#8a2be2]/60"
                />
                <button
                  type="submit"
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="bg-[#8a2be2] hover:bg-[#a64aff] text-white px-6 py-3 rounded-2xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {addingTask ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} Add
                </button>
              </form>

              <div className="space-y-8">
                {['Today', 'Upcoming', 'Completed'].map(category => {
                  const categoryTasks = tasks.filter(t => t.category === category);
                  if (category === 'Completed' && categoryTasks.length === 0) return null;
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          {category === 'Today'     && <Zap className="w-4 h-4 text-orange-400"/>}
                          {category === 'Upcoming'  && <CalendarIcon className="w-4 h-4 text-purple-400"/>}
                          {category === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400"/>}
                          {category === 'Today' ? 'Current Focus' : category}
                        </h3>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500">{categoryTasks.length} Tasks</span>
                      </div>
                      {categoryTasks.map((task, idx) => (
                        <div key={task.id} className="flex items-center gap-4 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
                          <button
                            onClick={() => handleTaskComplete(task.id)}
                            className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-full border-2 transition-all ${task.completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/10 text-gray-600 hover:border-white/30 hover:text-white'}`}
                          >
                            {task.completed ? <CheckCircle2 className="w-4 h-4"/> : <span className="text-xs font-bold">{idx + 1}</span>}
                          </button>
                          <div className={`flex-1 glass-card p-4 rounded-2xl border transition-all ${task.completed ? 'opacity-50 grayscale border-white/5' : 'hover:border-white/20'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-[9px] uppercase font-black rounded-full border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                <span className="text-[10px] text-gray-500 font-bold">{task.duration}</span>
                              </div>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all">
                                <X className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                            <h4 className={`font-bold mt-1 transition-all ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 mb-10 border border-white/5 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-3xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-[#00f2fe] opacity-70"/>
          </div>
          <h3 className="text-2xl font-bold mb-3">No Document Analyzed Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
            Upload a PDF in the <span className="text-[#00f2fe] font-medium">Upload Dashboard</span>.
            The AI engine will extract content, detect topics and headings, generate a module-wise
            study plan, and create Q&amp;A questions &mdash; all from your actual file.
          </p>
        </div>
      )}

      {/* ─── Sidebar Row (Suggestions + Alerts) ────────────────────────── */}
      {!latestAnalysis && (
        <div className="grid lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2">
            <div className="glass-card rounded-3xl p-6 border border-white/5">
              <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="What do you need to study today?"
                  className="flex-1 bg-transparent border-none text-lg text-white font-medium focus:outline-none placeholder:text-white/30"
                />
                <button type="submit" disabled={addingTask || !newTaskTitle.trim()} className="bg-[#8a2be2] hover:bg-[#a64aff] text-white px-6 py-2 rounded-full font-bold shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                  {addingTask ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-5 h-5"/>} Add Task
                </button>
              </form>
              {['Today', 'Upcoming', 'Completed'].map(category => {
                const categoryTasks = tasks.filter(t => t.category === category);
                if (categoryTasks.length === 0) return null;
                return (
                  <div key={category} className="mb-6">
                    <h2 className="text-sm font-bold flex items-center gap-2 mb-3 text-gray-400 uppercase tracking-widest">
                      {category === 'Today' && <Zap className="w-4 h-4 text-orange-400"/>}
                      {category === 'Upcoming' && <CalendarIcon className="w-4 h-4 text-purple-400"/>}
                      {category === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400"/>}
                      {category}
                    </h2>
                    <div className="space-y-3">
                      {categoryTasks.map((task, idx) => (
                        <div key={task.id} className="flex items-center gap-4 group">
                          <button onClick={() => handleTaskComplete(task.id)} className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-full border-2 transition-all ${task.completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/10 text-gray-600 hover:border-white/30'}`}>
                            {task.completed ? <CheckCircle2 className="w-4 h-4"/> : <span className="text-xs font-bold">{idx + 1}</span>}
                          </button>
                          <div className={`flex-1 glass-card p-4 rounded-2xl border transition-all ${task.completed ? 'opacity-50 grayscale border-white/5' : 'hover:border-white/20'}`}>
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-black rounded-full border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                              <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"><X className="w-3.5 h-3.5"/></button>
                            </div>
                            <h4 className={`font-bold mt-1 ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Sparkles className="w-5 h-5 text-purple-400"/> AI Smart Insights</h2>
              <div className="space-y-4">
                {suggestions.length === 0 && Array(2).fill(0).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse"/>)}
                {suggestions.map((sug, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/10">
                    <p className="text-sm text-purple-200 leading-relaxed font-medium">&quot;{sug}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-3xl">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><AlertCircle className="w-5 h-5 text-orange-400"/> Alerts</h2>
              {notifications.length === 0 && <p className="text-sm text-gray-500 text-center py-4 italic">No new alerts.</p>}
              {notifications.map((n, i) => (
                <div key={n.id} className="pl-4 border-l-2 border-white/5 hover:border-[#00f2fe]/50 transition-colors py-2">
                  <h5 className="text-[10px] font-black uppercase text-gray-500">{n.type} · {n.timestamp}</h5>
                  <p className="text-sm text-gray-300 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Q&A Modal ──────────────────────────────────────────────────── */}
      {activeQA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveQA(null)}/>
          <div className="glass-card w-full max-w-2xl flex flex-col rounded-[2.5rem] relative z-10 border border-[#00f2fe]/20 shadow-[0_0_50px_rgba(0,242,254,0.15)] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00f2fe]/10 border border-[#00f2fe]/20 rounded-2xl text-[#00f2fe]">
                  <Brain className="w-6 h-6 animate-pulse"/>
                </div>
                <div>
                  <h3 className="font-bold text-xl">Module Q&A Check</h3>
                  <p className="text-xs text-[#00f2fe] font-bold uppercase tracking-widest">{activeQA.title}</p>
                </div>
              </div>
              <button onClick={() => setActiveQA(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
              {analysis?.qaSession?.map((qa: any, i: number) => (
                <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#00f2fe]/20 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">{i + 1}</div>
                    <h4 className="font-semibold text-gray-200 mt-1 leading-relaxed text-sm">{qa.question}</h4>
                  </div>
                  {showAnswers ? (
                    <div className="pt-3 mt-2 border-t border-white/5 animate-in slide-in-from-top-2">
                      <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Answer</span>
                      <p className="text-gray-300 text-sm italic py-2 pl-4 border-l-2 border-emerald-500/30 bg-emerald-500/5 rounded-r-lg">{qa.answer}</p>
                    </div>
                  ) : (
                    <div className="pt-3 mt-2 border-t border-white/5 flex items-center gap-2">
                      {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse"/>)}
                      <span className="text-[10px] uppercase text-gray-600 ml-1 font-black tracking-widest">Awaiting recall</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4 items-center justify-between">
              {!showAnswers ? (
                <button onClick={() => setShowAnswers(true)} className="px-8 py-3 bg-white/10 hover:bg-white/20 font-bold rounded-full transition-all text-sm">
                  Reveal Answers
                </button>
              ) : (
                <button
                  onClick={() => { setCompletedModules(prev => [...prev, activeQA.id]); setActiveQA(null); setShowAnswers(false); }}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="w-5 h-5"/> Mark Module Complete
                </button>
              )}
              <p className="text-xs text-gray-500 hidden sm:block">Questions generated from uploaded file content.</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(330%); }
        }
      `}</style>
    </div>
  );
}

/** Inline Q&A card with reveal toggle */
function QACard({ qa, idx }: { qa: { question: string; answer: string; type: string }; idx: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-purple-500/20 transition-all group animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 60}ms` }}>
      <div className="flex items-start gap-3 mb-3">
        <span className="w-7 h-7 shrink-0 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">{idx + 1}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 border border-white/5 px-2 py-0.5 rounded-full">{qa.type}</span>
          </div>
          <h4 className="font-semibold text-gray-200 text-sm leading-relaxed">{qa.question}</h4>
        </div>
      </div>
      {revealed ? (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Answer</p>
          <p className="text-sm text-gray-300 italic leading-relaxed pl-4 border-l-2 border-emerald-500/30 bg-emerald-500/5 py-2 rounded-r-lg">{qa.answer}</p>
          <button onClick={() => setRevealed(false)} className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">Hide answer</button>
        </div>
      ) : (
        <button onClick={() => setRevealed(true)} className="text-xs text-[#00f2fe] hover:text-white font-bold transition-colors flex items-center gap-1">
          <HelpCircle className="w-3 h-3"/> Show Answer
        </button>
      )}
    </div>
  );
}
