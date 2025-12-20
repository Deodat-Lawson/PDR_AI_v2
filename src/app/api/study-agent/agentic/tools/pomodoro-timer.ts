/**
 * Pomodoro Timer Tool
 * Start, pause, resume, and manage Pomodoro study sessions
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { PomodoroSession, PomodoroSettings, PomodoroPhase, PomodoroInput } from "../types";

// In-memory pomodoro store (in production, this would be in the database)
const pomodoroStore = new Map<string, PomodoroSession>();

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

const PomodoroSchema = z.object({
  action: z
    .enum(["start", "pause", "resume", "stop", "skip", "status", "configure"])
    .describe("The Pomodoro action to perform"),
  userId: z.string().describe("The user ID"),
  sessionId: z.string().optional().describe("Session ID to associate with the Pomodoro"),
  phase: z.enum(["work", "short_break", "long_break"]).optional().describe("The timer to start, pause, resume, stop, skip, or status"),
  settings: z
    .object({
      workDuration: z.number().min(1).max(60).optional(),
      shortBreakDuration: z.number().min(1).max(30).optional(),
      longBreakDuration: z.number().min(1).max(60).optional(),
      sessionsBeforeLongBreak: z.number().min(1).max(10).optional(),
      autoStartBreaks: z.boolean().optional(),
      autoStartWork: z.boolean().optional(),
    })
    .optional()
    .describe("Pomodoro settings for configure action"),
});

/**
 * Get phase duration in minutes
 */
function getPhaseDuration(phase: PomodoroPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case "work":
      return settings.workDuration;
    case "short_break":
      return settings.shortBreakDuration;
    case "long_break":
      return settings.longBreakDuration;
    default:
      return 0;
  }
}

/**
 * Get next phase after current one
 */
function getNextPhase(session: PomodoroSession): PomodoroPhase {
  if (session.phase === "work") {
    const pomodorosCompleted = session.completedPomodoros + 1;
    if (pomodorosCompleted % session.settings.sessionsBeforeLongBreak === 0) {
      return "long_break";
    }
    return "short_break";
  }
  return "work";
}

/**
 * Format remaining time nicely
 */
function formatTimeRemaining(endsAt: Date): string {
  const now = new Date();
  const remainingMs = endsAt.getTime() - now.getTime();
  
  if (remainingMs <= 0) return "0:00";
  
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Manage Pomodoro timer
 */
export async function managePomodoro(
  input: PomodoroInput & { userId: string }
): Promise<{
  success: boolean;
  session?: PomodoroSession;
  message: string;
  phase?: PomodoroPhase;
  timeRemaining?: string;
  encouragement?: string;
}> {
  const now = new Date();

  // Get or create session for user
  let session = pomodoroStore.get(input.userId);

  switch (input.action) {
    case "start": {
      // Create new session or restart
      const settings = session?.settings ?? DEFAULT_SETTINGS;
      const phase: PomodoroPhase = input.phase ?? "work";
      const duration = getPhaseDuration(phase, settings);
      const endsAt = new Date(now.getTime() + duration * 60000);

      session = {
        id: uuidv4(),
        userId: input.userId,
        phase,
        isRunning: true,
        isPaused: false,
        startedAt: now,
        endsAt,
        completedPomodoros: session?.completedPomodoros ?? 0,
        totalWorkMinutes: session?.totalWorkMinutes ?? 0,
        currentTaskId: input.taskId,
        settings,
      };

      pomodoroStore.set(input.userId, session);
      console.log(`🍅 [Pomodoro] Started ${duration} minute work session`);

      return {
        success: true,
        session,
        message: `Started a ${duration} minute Pomodoro work session!`,
        timeRemaining: `${duration}:00`,
        encouragement: "Let's focus! You've got this~ 💪",
      };
    }

    case "pause": {
      if (!session || !session.isRunning) {
        return { success: false, message: "No active Pomodoro session to pause" };
      }

      session.isPaused = true;
      session.isRunning = false;
      session.pausedAt = now;
      pomodoroStore.set(input.userId, session);

      const remaining = session.endsAt ? formatTimeRemaining(session.endsAt) : "unknown";
      console.log(`⏸️ [Pomodoro] Paused with ${remaining} remaining`);

      return {
        success: true,
        session,
        message: `Paused your Pomodoro timer with ${remaining} remaining`,
        timeRemaining: remaining,
        encouragement: "Take a quick breather, then let's get back to it~",
      };
    }

    case "resume": {
      if (!session || !session.isPaused) {
        return { success: false, message: "No paused Pomodoro session to resume" };
      }

      // Calculate remaining time and set new end time
      if (session.pausedAt && session.endsAt) {
        const remainingMs = session.endsAt.getTime() - session.pausedAt.getTime();
        session.endsAt = new Date(now.getTime() + remainingMs);
      }

      session.isPaused = false;
      session.isRunning = true;
      session.pausedAt = undefined;
      pomodoroStore.set(input.userId, session);

      const remaining = session.endsAt ? formatTimeRemaining(session.endsAt) : "unknown";
      console.log(`▶️ [Pomodoro] Resumed with ${remaining} remaining`);

      return {
        success: true,
        session,
        message: `Resumed your Pomodoro timer! ${remaining} remaining`,
        timeRemaining: remaining,
        encouragement: "Welcome back! Let's finish strong~ 🎯",
      };
    }

    case "stop": {
      if (!session) {
        return { success: false, message: "No Pomodoro session to stop" };
      }

      // Calculate work time if we were in a work session
      if (session.phase === "work" && session.startedAt) {
        const workedMs = now.getTime() - session.startedAt.getTime();
        const workedMinutes = Math.floor(workedMs / 60000);
        session.totalWorkMinutes += workedMinutes;
      }

      const completedPomodoros = session.completedPomodoros;
      const totalMinutes = session.totalWorkMinutes;

      session.isRunning = false;
      session.isPaused = false;
      session.phase = "idle";
      session.startedAt = undefined;
      session.endsAt = undefined;
      pomodoroStore.set(input.userId, session);

      console.log(`🛑 [Pomodoro] Stopped. Total: ${completedPomodoros} pomodoros, ${totalMinutes} min`);

      return {
        success: true,
        session,
        message: `Stopped Pomodoro timer. You completed ${completedPomodoros} pomodoros and worked for ${totalMinutes} minutes total!`,
        encouragement:
          completedPomodoros > 0
            ? "Great work today! Every pomodoro counts~ 🍅"
            : "No worries! Ready when you are~",
      };
    }

    case "skip": {
      if (!session || !session.isRunning) {
        return { success: false, message: "No active Pomodoro session to skip" };
      }

      // Complete current phase
      if (session.phase === "work") {
        session.completedPomodoros += 1;
        const duration = session.settings.workDuration;
        session.totalWorkMinutes += duration;
      }

      // Move to next phase
      const nextPhase = getNextPhase(session);
      const nextDuration = getPhaseDuration(nextPhase, session.settings);

      session.phase = nextPhase;
      session.startedAt = now;
      session.endsAt = new Date(now.getTime() + nextDuration * 60000);
      pomodoroStore.set(input.userId, session);

      const phaseLabel =
        nextPhase === "work"
          ? "work session"
          : nextPhase === "short_break"
          ? "short break"
          : "long break";

      console.log(`⏭️ [Pomodoro] Skipped to ${phaseLabel}`);

      return {
        success: true,
        session,
        message: `Skipped to ${phaseLabel}! ${nextDuration} minutes starting now`,
        timeRemaining: `${nextDuration}:00`,
        encouragement:
          nextPhase === "work"
            ? "Time to focus again! Let's do this~ 🚀"
            : "Enjoy your break! You've earned it~ ☕",
      };
    }

    case "status": {
      if (!session) {
        return {
          success: true,
          message: "No active Pomodoro session. Say 'start pomodoro' to begin!",
          encouragement: "Ready to boost your productivity? Let's start a Pomodoro! 🍅",
        };
      }

      const status = session.isRunning
        ? "running"
        : session.isPaused
        ? "paused"
        : "idle";
      const remaining = session.endsAt ? formatTimeRemaining(session.endsAt) : null;
      const phaseLabel =
        session.phase === "work"
          ? "work session"
          : session.phase === "short_break"
          ? "short break"
          : session.phase === "long_break"
          ? "long break"
          : "idle";

      let message = `Pomodoro status: ${status}\n`;
      message += `Current phase: ${phaseLabel}\n`;
      if (remaining && session.isRunning) {
        message += `Time remaining: ${remaining}\n`;
      }
      message += `Completed pomodoros today: ${session.completedPomodoros}\n`;
      message += `Total focus time: ${session.totalWorkMinutes} minutes`;

      return {
        success: true,
        session,
        message,
        timeRemaining: remaining ?? undefined,
        encouragement:
          session.isRunning && session.phase === "work"
            ? "Keep going! You're doing great~ 💪"
            : session.phase.includes("break")
            ? "Enjoy your break! You've earned it~"
            : undefined,
      };
    }

    case "configure": {
      if (!input.settings) {
        return { success: false, message: "Settings are required for configure action" };
      }

      const currentSettings = session?.settings ?? DEFAULT_SETTINGS;
      const newSettings: PomodoroSettings = {
        ...currentSettings,
        ...input.settings,
      };

      if (session) {
        session.settings = newSettings;
        pomodoroStore.set(input.userId, session);
      } else {
        // Create a new idle session with these settings
        session = {
          id: uuidv4(),
          userId: input.userId,
          phase: "idle",
          isRunning: false,
          isPaused: false,
          completedPomodoros: 0,
          totalWorkMinutes: 0,
          settings: newSettings,
        };
        pomodoroStore.set(input.userId, session);
      }

      console.log(`⚙️ [Pomodoro] Updated settings:`, newSettings);

      return {
        success: true,
        session,
        message: `Updated Pomodoro settings: ${newSettings.workDuration} min work, ${newSettings.shortBreakDuration} min short break, ${newSettings.longBreakDuration} min long break`,
      };
    }

    default:
      return { success: false, message: "Unknown action" };
  }
}

/**
 * Pomodoro Timer Tool for LangChain
 */
export const pomodoroTool = tool(
  async (input): Promise<string> => {
    try {
      const result = await managePomodoro({
        action: input.action,
        userId: input.userId,
        settings: input.settings,
      });

      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  {
    name: "pomodoro_timer",
    description: `Control the Pomodoro timer for focused study sessions.
    Use this when the user wants to:
    - Start a Pomodoro (focus session)
    - Pause or resume the timer
    - Stop the current session
    - Skip to the next phase (break or work)
    - Check timer status
    - Configure timer settings (work duration, break duration)

Examples: "Start a pomodoro", "Pause the timer", "How much time left?", "Set pomodoro to 30 minutes", "Skip this break"`,
    schema: PomodoroSchema,
  }
);

