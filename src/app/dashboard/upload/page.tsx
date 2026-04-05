"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  UploadCloud, File, Image as ImageIcon, FileText, CheckCircle2, X, Brain, 
  Search, Filter, Eye, MoreVertical, Trash2, Clock, HardDrive, FilePlus, 
  Loader2, AlertCircle, Calendar, Download, ExternalLink, Zap, Target, BookOpen, Layers
} from 'lucide-react';
import { getSupabasePublic } from '@/lib/supabase';

interface AnalysisData {
  summary: string;
  topics: string[];
  difficulty: string;
  estimatedTime: string;
  priority: string;
  tasks?: any[];
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  category: string;
  status: 'Completed' | 'Processing' | 'AI Analyzing' | 'Failed' | 'Uploading';
  progress?: number;
  analysis?: AnalysisData;
}

interface Stats {
  totalFiles: number;
  storageUsed: string;
  filesToday: number;
  recentUploads: number;
}

interface ActivityEvent {
  id: string;
  time: string;
  text: string;
  type: 'upload' | 'analyze' | 'task';
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("");
  
  // Real-time Action Feed
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([
    { id: '1', time: '10 mins ago', text: 'Started daily synchronization.', type: 'upload' }
  ]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // UI State
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  const fetchMetadata = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/dashboard/upload/live');
      if (res.ok) {
        const data = await res.json();
        // Parse the DB's JSON securely
        setFiles(prev => {
          const uploading = prev.filter(f => f.status === 'Uploading' || f.status === 'Processing' || f.status === 'AI Analyzing');
          const serverFiles = data.files.map((sf: any) => ({
             ...sf,
             analysis: sf.analysis_json ? (typeof sf.analysis_json === 'string' ? JSON.parse(sf.analysis_json) : sf.analysis_json) : undefined
          })).filter((sf: UploadedFile) => !uploading.find(uf => uf.name === sf.name));
          return [...uploading, ...serverFiles];
        });
        setStats(data.stats);
        setLastSync(data.lastUpdated);
      }
    } catch (error) {
      console.error("Failed to fetch upload metadata", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  useEffect(() => {
    fetchMetadata();

    // ── Supabase Realtime Subscription ──────────────────────────────────────
    const supabase = getSupabasePublic();
    const fileChannel = supabase
      .channel('upload_changes')
      .on('postgres_changes', { event: '*', table: 'files', schema: 'public' }, () => {
        fetchMetadata(); // Refresh the list when any file record changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(fileChannel);
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const simulateUpload = async (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Smart Categorization logic
    const ext = file.name.split('.').pop()?.toLowerCase();
    const category = 
      ['pdf', 'epub'].includes(ext!) ? 'Study Materials' :
      ['png', 'jpg', 'jpeg', 'gif'].includes(ext!) ? 'Images' :
      ['docx', 'doc', 'txt'].includes(ext!) ? 'Notes' :
      ['xlsx', 'csv'].includes(ext!) ? 'Assignments' : 'Schedules';

    const newFile: UploadedFile = {
      id,
      name: file.name,
      type: ext || 'file',
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      date: new Date().toLocaleString(),
      category, 
      status: 'Uploading',
      progress: 10
    };

    setFiles(prev => [newFile, ...prev]);
    setActivityFeed(prev => [{id: Date.now().toString(), time: 'Just now', type: 'upload', text: `Upload started: ${file.name}`} as ActivityEvent, ...prev].slice(0, 5));

    try {
      // 1. Upload to Firebase
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'Processing', progress: 50 } : f));

      // 2. Save Initial Metadata to DB
      await fetch('/api/dashboard/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newFile, url }),
      });

      // 3. AI Analysis Phase
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'AI Analyzing', progress: 80 } : f));
      
      const aiRes = await fetch('/api/planner/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: url, id })
      });
      
      if (!aiRes.ok) throw new Error("AI Analysis failed");
      const { analysis } = await aiRes.json();
      
      const completedFile: UploadedFile = { ...newFile, status: 'Completed', progress: 100, analysis };
      setFiles(prev => prev.map(f => f.id === id ? completedFile : f));
      
      setActivityFeed(prev => [
          {id: Date.now().toString() + 'a', time: 'Just now', type: 'analyze', text: `AI Extracted ${analysis.topics ? analysis.topics.length : 0} core topics from ${file.name}.`} as ActivityEvent,
          ...prev
      ].slice(0, 10));

      // 4. Auto Generate Planner Tasks from analysis
      if (analysis.modules) {
         for (const mod of analysis.modules) {
             await fetch('/api/dashboard/planner/save', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 id: "auto-" + Math.random().toString(36).substr(2, 9),
                 title: `Study: ${mod.title}`,
                 priority: 'Medium',
                 duration: '1 hour',
                 category: 'Today',
                 time: "Flexible"
               })
             });
         }
         setActivityFeed(prev => [
            {id: Date.now().toString() + 't', time: 'Just now', type: 'task', text: `Auto-generated ${analysis.modules.length} smart tasks for your Planner.`} as ActivityEvent,
            ...prev
         ].slice(0, 10));
      }
      
      fetchMetadata();
    } catch (err: any) {
      console.error("End-to-end upload flow failed", err);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'Failed', progress: 0 } : f));
    }
  };

  const handleDeleteFile = async (id: string) => {
    // Optimistic delete
    setFiles(prev => prev.filter(f => f.id !== id));
    
    try {
      await fetch('/api/dashboard/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchMetadata();
    } catch (error) {
      console.error("Failed to delete file", error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(simulateUpload);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "All" || f.type.toLowerCase() === filterType.toLowerCase();
      const matchesCategory = filterCategory === "All" || f.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [files, searchQuery, filterType, filterCategory]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-outfit font-bold tracking-tight">AI Knowledge Base</h1>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <p className="text-gray-400">Upload documents. Your Twin extracts topics and builds your planner.</p>
            {lastSync && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                {isSyncing ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <Clock className="w-2.5 h-2.5"/>}
                Sync: {lastSync}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => alert("Filters functionality coming soon.")} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
             <Filter className="w-4 h-4"/> Filters
           </button>
           <button onClick={() => alert("New Folder creation coming soon.")} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-white rounded-full text-sm font-bold shadow-lg hover:shadow-[#00f2fe]/20 hover:scale-105 transition-all">
             <FilePlus className="w-4 h-4" /> New Folder
           </button>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-5 border-l-4 border-l-[#00f2fe]">
            <div className="flex justify-between items-center mb-2 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Total Knowledge</span>
              <File className="w-4 h-4"/>
            </div>
            <h3 className="text-3xl font-bold">{stats.totalFiles} Files</h3>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-center mb-2 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Storage Used</span>
              <HardDrive className="w-4 h-4"/>
            </div>
            <h3 className="text-3xl font-bold">{stats.storageUsed}</h3>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-orange-500">
            <div className="flex justify-between items-center mb-2 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Today's Intake</span>
              <Zap className="w-4 h-4 text-orange-400"/>
            </div>
            <h3 className="text-3xl font-bold">{stats.filesToday} Files</h3>
          </div>
          <div className="glass-card p-5 border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-center mb-2 text-gray-400">
              <span className="text-[10px] uppercase font-black tracking-widest">Recent Activity</span>
              <Clock className="w-4 h-4"/>
            </div>
            <h3 className="text-3xl font-bold">+{stats.recentUploads} New</h3>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00f2fe] transition-colors" />
          <input 
            type="text" 
            placeholder="Search filenames, categories, AI topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 transition-all placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#00f2fe]"
          >
            <option value="All">All Categories</option>
            <option value="Notes">Notes</option>
            <option value="Assignments">Assignments</option>
            <option value="Schedules">Schedules</option>
            <option value="Study Materials">Study Materials</option>
          </select>
          <select 
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
             className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#00f2fe]"
          >
            <option value="All">All Formats</option>
            <option value="pdf">PDF Docs</option>
            <option value="image">Images</option>
            <option value="doc">Word Docs</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Dropzone & Feed Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`glass-panel border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center transition-all h-[350px] sticky top-24 ${dragActive ? 'border-[#00f2fe] bg-[#00f2fe]/5 scale-[1.02]' : 'border-white/10 hover:border-white/20'}`}
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
               <UploadCloud className={`w-10 h-10 transition-all ${dragActive ? 'text-[#00f2fe] -translate-y-2' : 'text-gray-500'}`} />
               {dragActive && <div className="absolute inset-0 rounded-full border-2 border-[#00f2fe] animate-ping opacity-40"></div>}
            </div>
            <h3 className="text-xl font-bold mb-3">Drop resources here</h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed max-w-[240px]">
              Drag & Drop PDFs, images, or notes. IntelliTwin will analyze them instantly.
            </p>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              id="fileInput" 
              onChange={(e) => {
                if(e.target.files) Array.from(e.target.files).forEach(simulateUpload);
              }}
            />
            <label 
              htmlFor="fileInput"
              className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-bold text-sm cursor-pointer flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4"/> Browse Files
            </label>
          </div>

          {/* Activity Feed */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
             <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-300">
               <Zap className="w-4 h-4 text-orange-400" />
               Live Activity Feed
             </h3>
             <div className="space-y-4">
                {activityFeed.map((event, i) => (
                   <div key={event.id} className="group relative pl-4 border-l-2 border-white/5 transition-colors py-1 animate-in slide-in-from-right-4 fade-in duration-500" style={{animationDelay: `${i * 100}ms`}}>
                      <div className="flex items-center gap-2">
                         {event.type === 'upload' && <UploadCloud className="w-3 h-3 text-gray-500" />}
                         {event.type === 'analyze' && <Brain className="w-3 h-3 text-[#00f2fe]" />}
                         {event.type === 'task' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                         <span className="text-[10px] text-gray-500 font-bold uppercase">{event.time}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 font-medium">{event.text}</p>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* File Manager List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
             <h2 className="text-xl font-bold">Active Files & Insights</h2>
             <span className="text-[10px] font-black tracking-widest text-gray-600 uppercase">Sorted by: Newest</span>
          </div>
          
          <div className="space-y-4">
            {filteredFiles.length === 0 && (
              <div className="glass-panel p-20 flex flex-col items-center justify-center text-center opacity-50">
                 <Search className="w-12 h-12 mb-4 text-gray-700"/>
                 <p className="font-bold">No files matched your filters.</p>
                 <p className="text-sm mt-1">Try resetting your search or adjusting filters.</p>
              </div>
            )}
            
            {filteredFiles.map((file) => (
              <div key={file.id} className="glass-card p-5 flex flex-col group transition-all duration-300 hover:border-[#00f2fe]/30 hover:shadow-[0_0_30px_rgba(0,242,254,0.05)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-5">
                    <div className={`p-4 rounded-2xl relative ${file.status === 'Failed' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-gray-300 group-hover:bg-[#00f2fe]/10 group-hover:text-[#00f2fe]'} transition-colors`}>
                       {file.type.includes('image') || file.type === 'png' || file.type === 'jpg' ? <ImageIcon /> : file.type === 'pdf' ? <FileText /> : <File />}
                       {(file.status === 'Uploading' || file.status === 'Processing' || file.status === 'AI Analyzing') && <div className="absolute inset-0 rounded-2xl border-2 border-[#00f2fe] animate-pulse"></div>}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg max-w-[300px] truncate group-hover:text-white transition-colors leading-tight">{file.name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-black tracking-widest text-gray-500 uppercase">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3"/> {file.size}</span>
                        <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {file.date}</span>
                        <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                        <span className="px-2 py-0.5 rounded border border-white/10 text-gray-300 capitalize">{file.category}</span>
                      </div>

                      {/* Display small tags if analysis exists */}
                      {file.analysis && file.analysis.topics && (
                         <div className="mt-3 flex flex-wrap gap-2">
                             {file.analysis.topics.slice(0, 3).map((t: string) => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-[#00f2fe]/10 text-[#00f2fe] text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">
                                   {t}
                                </span>
                             ))}
                             {file.analysis.topics.length > 3 && <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-[9px] uppercase font-bold tracking-wider hidden sm:inline-block">+{file.analysis.topics.length - 3}</span>}
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'Completed' && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => setPreviewFile(file)}
                          className="p-2.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-all flex items-center justify-center gap-1 group/btn" 
                          title="View Intelligence Insights"
                        >
                          <Brain className="w-5 h-5 group-hover/btn:animate-pulse" />
                        </button>
                        <button onClick={() => alert(`Downloading ${file.name}...`)} className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Download">
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all" 
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <div className="ml-2">
                       {file.status === 'Completed' ? <CheckCircle2 className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> :
                        file.status === 'Failed' ? <AlertCircle className="w-6 h-6 text-red-500" /> :
                        (file.status === 'Uploading' || file.status === 'Processing' || file.status === 'AI Analyzing') ? <Loader2 className="w-6 h-6 text-[#00f2fe] animate-spin" /> : null}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar for Uploading Status */}
                {(file.status === 'Uploading' || file.status === 'Processing' || file.status === 'AI Analyzing') && (
                  <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-1">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-[#00f2fe] tracking-widest uppercase flex items-center gap-1">{file.status}...</span>
                        <span className="text-[10px] font-black text-[#00f2fe]">{file.progress}%</span>
                     </div>
                     <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full shadow-[0_0_10px_currentColor] transition-all duration-300 ${file.status === 'AI Analyzing' ? 'bg-purple-500 text-purple-500' : 'bg-[#00f2fe] text-[#00f2fe]'}`} style={{width: `${file.progress}%`}}></div>
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intelligent Preview Insights Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in duration-300">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPreviewFile(null)}></div>
           <div className="glass-panel w-full max-w-5xl h-[85vh] flex flex-col md:flex-row rounded-[2.5rem] relative overflow-hidden z-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              
              {/* Left Panel: File Preview */}
              <div className="w-full md:w-5/12 bg-black/40 border-r border-white/5 p-6 flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-xl text-gray-400">
                           {previewFile.type === 'pdf' ? <FileText className="w-5 h-5"/> : <File className="w-5 h-5"/>}
                        </div>
                        <h3 className="font-bold text-lg leading-tight truncate max-w-[200px]">{previewFile.name}</h3>
                     </div>
                     <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-white/10 rounded-full md:hidden"><X className="w-5 h-5"/></button>
                 </div>
                 
                 <div className="flex-1 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-8 overflow-y-auto relative bg-gradient-to-b from-transparent to-black/20">
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent"></div>
                    <FileText className="w-20 h-20 text-gray-700 mx-auto mb-6 opacity-30"/>
                    <h4 className="text-xl font-bold italic opacity-40 mb-2">Source Document</h4>
                    <p className="text-gray-500 text-xs mb-8">Native rendering unavailable in Intelligence View. You can download the source file to view it natively.</p>
                    <button onClick={() => alert("Downloading full file...")} className="px-6 py-2.5 bg-white/10 rounded-full text-sm font-bold shadow-lg hover:bg-white/20 transition-all">Download Original</button>
                 </div>
              </div>

              {/* Right Panel: AI Insights & Logic */}
              <div className="w-full md:w-7/12 flex flex-col p-8 md:p-10 overflow-y-auto relative">
                <button onClick={() => setPreviewFile(null)} className="absolute top-8 right-8 p-3 hover:bg-white/10 hover:text-red-400 rounded-full transition-all hidden md:block z-20">
                   <X className="w-6 h-6"/>
                </button>
                 
                <div className="flex items-center gap-3 mb-6">
                   <Brain className="w-8 h-8 text-[#00f2fe]" />
                   <h2 className="text-3xl font-bold">File Intelligence</h2>
                </div>

                {previewFile.analysis ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                     
                     {/* Summary */}
                     <section>
                       <h3 className="text-xs font-black uppercase tracking-widest text-[#00f2fe] mb-3 flex items-center gap-2"><BookOpen className="w-3 h-3"/> Executive Summary</h3>
                       <p className="text-gray-300 text-sm leading-relaxed p-4 bg-white/5 rounded-2xl border border-white/5">
                         {previewFile.analysis.summary}
                       </p>
                     </section>
                     
                     {/* Topic Extraction */}
                     <section>
                       <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-3 flex items-center gap-2"><Layers className="w-3 h-3"/> Extracted Topics</h3>
                       <div className="flex flex-wrap gap-2">
                          {previewFile.analysis.topics.map((topic: string) => (
                            <span key={topic} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-bold shadow-inner">
                              {topic}
                            </span>
                          ))}
                       </div>
                     </section>
                     
                     {/* Metrics Grid */}
                     <section className="grid grid-cols-3 gap-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <span className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Difficulty</span>
                          <span className={`font-bold ${previewFile.analysis.difficulty === 'Advanced' ? 'text-orange-400' : 'text-emerald-400'}`}>{previewFile.analysis.difficulty}</span>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <span className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Est. Time</span>
                          <span className="font-bold text-white">{previewFile.analysis.estimatedTime}</span>
                       </div>
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                          <span className="block text-[10px] font-black tracking-widest text-gray-500 uppercase mb-2">Priority</span>
                          <span className="font-bold text-[#00f2fe]">{previewFile.analysis.priority}</span>
                       </div>
                     </section>
                     
                     {/* Generated Tasks */}
                     <section>
                       <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> Auto-Generated Planner Tasks</h3>
                       <div className="space-y-2">
                         {(!previewFile.analysis.tasks || previewFile.analysis.tasks.length === 0) && <p className="text-xs text-gray-500 italic">No specific action items detected.</p>}
                         {previewFile.analysis.tasks?.map((task: any, index: number) => (
                           <div key={index} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-xl">
                              <div className="flex items-center gap-3">
                                 <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">{index + 1}</div>
                                 <span className="text-sm font-semibold text-gray-200">{task.title}</span>
                              </div>
                              <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-black/40 rounded-md">Synced to Planner</span>
                           </div>
                         ))}
                       </div>
                     </section>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-20">
                     <AlertCircle className="w-12 h-12 mb-4 text-gray-500"/>
                     <p className="text-lg font-bold text-white mb-2">Analysis Unavailable</p>
                     <p className="text-sm text-gray-400 max-w-[300px]">This file was uploaded before the IntelliTwin analysis engine was integrated, or the processing failed.</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
