'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  GitBranch, 
  Play, 
  RefreshCw, 
  ChevronRight,
  Database,
  Layers
} from 'lucide-react';
import { useTaskEngine } from '@/lib/useTaskEngine';
import { TaskTree } from '@/lib/TaskTree';
import { TaskStatus } from '@/lib/types';

export default function AutopoieticEngine() {
  const [inputGoal, setInputGoal] = useState('');
  const { tasks, isProcessing, startEngine, logs } = useTaskEngine();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGoal.trim() || isProcessing) return;
    startEngine(inputGoal);
    setInputGoal('');
  };

  const taskList = Object.values(tasks).sort((a, b) => b.depth - a.depth);
  const activeTasks = taskList.filter(t => t.status === TaskStatus.DECOMPOSING || t.status === TaskStatus.EXECUTING);
  const completedCount = taskList.filter(t => t.status === TaskStatus.COMPLETED).length;

  return (
    <main className="min-h-screen flex flex-col bg-[#E4E3E0] text-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tighter leading-none">Autopoietic Engine</h1>
            <p className="text-[10px] font-mono opacity-50 uppercase">v1.0.4-alpha // distributed task decomposition</p>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] font-mono opacity-50 uppercase">System Status</p>
            <p className="text-xs font-bold uppercase flex items-center gap-2 justify-end">
              {isProcessing ? (
                <>
                  <span className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse" />
                  Operational
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-[#141414] rounded-full" />
                  Standby
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono opacity-50 uppercase">Tasks Processed</p>
            <p className="text-xs font-bold font-mono">{completedCount} / {taskList.length}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Panel: Controls & Logs */}
        <div className="col-span-12 lg:col-span-4 border-r border-[#141414] flex flex-col">
          {/* Input Area */}
          <div className="p-6 border-b border-[#141414]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="col-header">Primary Objective</label>
                <textarea
                  value={inputGoal}
                  onChange={(e) => setInputGoal(e.target.value)}
                  placeholder="Enter a complex goal to decompose..."
                  className="w-full bg-transparent border border-[#141414] p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] min-h-[100px] resize-none"
                  disabled={isProcessing}
                />
              </div>
              <button
                type="submit"
                disabled={isProcessing || !inputGoal.trim()}
                className="w-full bg-[#141414] text-[#E4E3E0] py-3 uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-opacity-90 disabled:opacity-50 transition-all"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Initialize Sequence
              </button>
            </form>
          </div>

          {/* Active Workers */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-[#141414] text-[#E4E3E0] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Active Threads</span>
              </div>
              <span className="text-[10px] font-mono">{activeTasks.length} Running</span>
            </div>
            <div className="flex-1 overflow-y-auto terminal-scroll">
              <AnimatePresence initial={false}>
                {activeTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 border-b border-[#141414] bg-white/50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-mono bg-[#141414] text-[#E4E3E0] px-1 uppercase">
                        {task.status}
                      </span>
                      <span className="text-[9px] font-mono opacity-50">ID: {task.id}</span>
                    </div>
                    <p className="text-xs font-medium leading-tight">{task.goal}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeTasks.length === 0 && (
                <div className="h-full flex items-center justify-center opacity-20 flex-col gap-2">
                  <Database className="w-8 h-8" />
                  <p className="text-[10px] font-mono uppercase">No active threads</p>
                </div>
              )}
            </div>
          </div>

          {/* System Logs */}
          <div className="h-48 border-t border-[#141414] flex flex-col overflow-hidden bg-[#141414] text-[#E4E3E0]">
            <div className="p-2 border-b border-white/10 flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase">Kernel Output</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1 terminal-scroll">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="opacity-30">[{log.time}]</span>
                  <span className={log.msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Visualization & Results */}
        <div className="col-span-12 lg:col-span-8 flex flex-col bg-white">
          {/* Visualization */}
          <div className="flex-1 border-b border-[#141414] relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <div className="bg-[#141414] text-[#E4E3E0] p-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Fractal Topology</span>
              </div>
            </div>
            <TaskTree tasks={tasks} />
          </div>

          {/* Results Grid */}
          <div className="h-1/3 flex flex-col overflow-hidden bg-[#E4E3E0]">
            <div className="p-3 border-b border-[#141414] flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">Computational Invariants (Results)</span>
            </div>
            <div className="flex-1 overflow-y-auto terminal-scroll">
              <div className="grid grid-cols-1">
                <div className="data-row bg-[#141414]/5">
                  <span className="col-header">ID</span>
                  <span className="col-header">Goal / Result</span>
                  <span className="col-header">Status</span>
                </div>
                {taskList.filter(t => t.result || t.status === TaskStatus.COMPLETED).map((task) => (
                  <div key={task.id} className="data-row group">
                    <span className="data-value text-[10px]">{task.id}</span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{task.goal}</p>
                      {task.result && (
                        <p className="text-[10px] font-mono mt-1 opacity-70 line-clamp-2 italic">
                          {task.result}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[9px] font-mono uppercase opacity-50">{task.status}</span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
