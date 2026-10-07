import { Type } from "@google/genai";

export enum TaskStatus {
  PENDING = "PENDING",
  DECOMPOSING = "DECOMPOSING",
  EXECUTING = "EXECUTING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface Task {
  id: string;
  parentId: string | null;
  goal: string;
  status: TaskStatus;
  subtasks: string[]; // IDs
  result?: string;
  depth: number;
  isAtomic: boolean;
}

export const DECOMPOSITION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subtasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          goal: { type: Type.STRING, description: "The specific sub-goal to achieve." },
          isAtomic: { type: Type.BOOLEAN, description: "Whether this task is simple enough to execute directly without further decomposition." }
        },
        required: ["goal", "isAtomic"]
      }
    }
  },
  required: ["subtasks"]
};

export const EXECUTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    result: { type: Type.STRING, description: "The final output or result of the task execution." },
    success: { type: Type.BOOLEAN }
  },
  required: ["result", "success"]
};
