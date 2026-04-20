"use client"

export type GenerationTaskStatus =
  | "running"
  | "timed_out"
  | "completed"
  | "failed"
  | "cancelled"

export interface GenerationTask {
  id: string
  title: string
  progress: number
  status: GenerationTaskStatus
  startedAt: number
  completedAt?: number
  error?: string
  resultJobId?: string
}

type Listener = (tasks: GenerationTask[]) => void

const STORAGE_KEY = "generation_tasks_v1"
const EVENT_NAME = "generation-tasks-updated"
const tasks = new Map<string, GenerationTask>()
const listeners = new Set<Listener>()

function emit() {
  const list = Array.from(tasks.values()).sort((a, b) => b.startedAt - a.startedAt)
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent(EVENT_NAME))
  }
  listeners.forEach((l) => l(list))
}

function upsert(task: GenerationTask) {
  tasks.set(task.id, task)
  emit()
}

export function hydrateGenerationTasks() {
  if (typeof window === "undefined") return
  if (tasks.size > 0) return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as GenerationTask[]
    parsed.forEach((t) => tasks.set(t.id, t))
  } catch {
    // ignore malformed cache
  }
}

export function subscribeGenerationTasks(listener: Listener) {
  hydrateGenerationTasks()
  listeners.add(listener)
  listener(Array.from(tasks.values()).sort((a, b) => b.startedAt - a.startedAt))
  const handler = () => listener(Array.from(tasks.values()).sort((a, b) => b.startedAt - a.startedAt))
  if (typeof window !== "undefined") {
    window.addEventListener(EVENT_NAME, handler)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== "undefined") {
      window.removeEventListener(EVENT_NAME, handler)
    }
  }
}

export function startGenerationTask(title: string): string {
  hydrateGenerationTasks()
  const id = `gen_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`}`
  upsert({
    id,
    title,
    progress: 2,
    status: "running",
    startedAt: Date.now(),
  })
  return id
}

export function updateGenerationTask(id: string, updates: Partial<GenerationTask>) {
  const current = tasks.get(id)
  if (!current) return
  upsert({ ...current, ...updates })
}

export function failGenerationTask(id: string, error: string) {
  updateGenerationTask(id, { status: "failed", error, completedAt: Date.now(), progress: 100 })
}

export function completeGenerationTask(id: string, resultJobId: string) {
  updateGenerationTask(id, { status: "completed", completedAt: Date.now(), progress: 100, resultJobId })
}

export function cancelGenerationTask(id: string) {
  updateGenerationTask(id, { status: "cancelled", completedAt: Date.now(), progress: 100 })
}

