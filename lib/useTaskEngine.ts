'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Task, TaskStatus, DECOMPOSITION_SCHEMA, EXECUTION_SCHEMA } from './types';

const MODEL_NAME = "gemini-3-flash-preview";

export function useTaskEngine() {
  const [tasks, setTasks] = useState<Record<string, Task>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<{msg: string, time: string}[]>([]);
  
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (!aiRef.current && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    }
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const createTask = useCallback((goal: string, parentId: string | null = null, depth: number = 0): Task => {
    const id = Math.random().toString(36).substring(2, 9);
    return {
      id,
      parentId,
      goal,
      status: TaskStatus.PENDING,
      subtasks: [],
      depth,
      isAtomic: false
    };
  }, []);

  const startEngine = async (initialGoal: string) => {
    const rootTask = createTask(initialGoal);
    setTasks({ [rootTask.id]: rootTask });
    setIsProcessing(true);
    addLog(`Engine initialized with goal: ${initialGoal}`);
  };

  const processTask = useCallback(async (taskId: string) => {
    const task = tasks[taskId];
    if (!task || task.status !== TaskStatus.PENDING) return;

    const ai = aiRef.current;
    if (!ai) return;

    // Update status to Decomposing or Executing
    setTasks(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], status: task.isAtomic ? TaskStatus.EXECUTING : TaskStatus.DECOMPOSING }
    }));

    try {
      if (task.isAtomic) {
        addLog(`Executing atomic task: ${task.goal}`);
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Execute the following atomic task and provide a definitive result: ${task.goal}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: EXECUTION_SCHEMA as any
          }
        });
        
        const data = JSON.parse(response.text || "{}");
        setTasks(prev => ({
          ...prev,
          [taskId]: { ...prev[taskId], status: TaskStatus.COMPLETED, result: data.result }
        }));
        addLog(`Completed: ${task.goal.substring(0, 30)}...`);
      } else {
        addLog(`Decomposing task: ${task.goal}`);
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: `Decompose the following complex goal into a list of sub-tasks. 
          Goal: ${task.goal}
          
          Context: This is part of a larger system. If the task is already simple, mark it as atomic.
          Otherwise, break it down into 2-4 logical sub-tasks.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: DECOMPOSITION_SCHEMA as any
          }
        });

        const data = JSON.parse(response.text || "{}");
        const subtasksData = data.subtasks || [];
        
        const newSubtasks: Task[] = subtasksData.map((st: any) => ({
          ...createTask(st.goal, taskId, task.depth + 1),
          isAtomic: st.isAtomic
        }));

        setTasks(prev => {
          const updatedTasks = { ...prev };
          updatedTasks[taskId] = { 
            ...updatedTasks[taskId], 
            status: TaskStatus.COMPLETED, 
            subtasks: newSubtasks.map(t => t.id) 
          };
          newSubtasks.forEach(t => {
            updatedTasks[t.id] = t;
          });
          return updatedTasks;
        });
        addLog(`Fractured task into ${newSubtasks.length} sub-tasks.`);
      }
    } catch (error) {
      console.error(error);
      setTasks(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], status: TaskStatus.FAILED }
      }));
      addLog(`Error processing task: ${taskId}`);
    }
  }, [tasks, createTask]);

  // Worker Loop
  useEffect(() => {
    if (!isProcessing) return;

    const pendingTask = Object.values(tasks).find(t => t.status === TaskStatus.PENDING);
    if (pendingTask) {
      const timer = setTimeout(() => processTask(pendingTask.id), 500);
      return () => clearTimeout(timer);
    } else {
      // Check if all tasks are completed
      const allDone = Object.values(tasks).every(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.FAILED);
      if (allDone && Object.keys(tasks).length > 0) {
        // setIsProcessing(false);
        // addLog("All tasks in current queue processed.");
      }
    }
  }, [tasks, isProcessing, processTask]);

  return { tasks, isProcessing, startEngine, logs };
}
