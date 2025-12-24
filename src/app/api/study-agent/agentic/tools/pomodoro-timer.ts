/**
 * Pomodoro Timer Tool
 * Start, pause, resume, and manage Pomodoro study sessions
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { studyAgentPreferences, studyAgentPomodoroSettings } from "~/server/db/schema";
import { db } from "~/server/db";
import { resolveSessionForUser } from "~/server/study-agent/session";
import type { PomodoroSession, PomodoroSettings, PomodoroPhase, PomodoroInput } from "../types";

const DEFAULT_SETTINGS: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartWork: false,
};

type StoredPomodoroState = {
    phase: PomodoroPhase;
    isRunning: boolean;
    isPaused: boolean;
    startedAt?: string;
    pausedAt?: string;
    endsAt?: string;
    completedPomodoros: number;
    totalWorkMinutes: number;
    currentTaskId?: string;
};

const DEFAULT_STATE: StoredPomodoroState = {
    phase: "idle",
    isRunning: false,
    isPaused: false,
    completedPomodoros: 0,
    totalWorkMinutes: 0,
};

const PomodoroSchema = z.object({
    action: z
        .enum(["start", "pause", "resume", "stop", "skip", "status", "configure"])
        .describe("The Pomodoro action to perform"),
    userId: z.string().describe("The user ID"),
    sessionId: z.string().optional().describe("Session ID to associate with the Pomodoro"),
    phase: z
        .enum(["work", "short_break", "long_break"])
        .optional()
        .describe("The timer to start, pause, resume, stop, skip, or status"),
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
    input: PomodoroInput & { userId: string; sessionId?: string | number }
): Promise<{
    success: boolean;
    session?: PomodoroSession;
    message: string;
    phase?: PomodoroPhase;
    timeRemaining?: string;
    encouragement?: string;
}> {
    const parsedSessionId = input.sessionId ? Number(input.sessionId) : undefined;
    const now = new Date();
    const session = await resolveSessionForUser(
        input.userId,
        Number.isNaN(parsedSessionId) ? undefined : parsedSessionId
    );
    if (!session) {
        return {
            success: false,
            message: "Unable to find a study session for this user",
        };
    }

    const [settingsRow] = await db
        .select()
        .from(studyAgentPomodoroSettings)
        .where(
            and(
                eq(studyAgentPomodoroSettings.userId, input.userId),
                eq(studyAgentPomodoroSettings.sessionId, BigInt(session.id))
            )
        );

    const settings: PomodoroSettings = settingsRow
        ? {
              workDuration: settingsRow.focusMinutes,
              shortBreakDuration: settingsRow.shortBreakMinutes,
              longBreakDuration: settingsRow.longBreakMinutes,
              sessionsBeforeLongBreak: settingsRow.sessionsBeforeLongBreak,
              autoStartBreaks: settingsRow.autoStartBreaks,
              autoStartWork: settingsRow.autoStartPomodoros,
          }
        : DEFAULT_SETTINGS;

    const [preferencesRow] = await db
        .select()
        .from(studyAgentPreferences)
        .where(
            and(
                eq(studyAgentPreferences.userId, input.userId),
                eq(studyAgentPreferences.sessionId, BigInt(session.id))
            )
        );

    const storedState = (
        preferencesRow?.preferences as { pomodoroState?: StoredPomodoroState } | undefined
    )?.pomodoroState ?? { ...DEFAULT_STATE };

    const persistState = async (state: StoredPomodoroState) => {
        const preferences = {
            ...(preferencesRow?.preferences ?? {}),
            pomodoroState: state,
        };

        if (preferencesRow) {
            await db
                .update(studyAgentPreferences)
                .set({ preferences })
                .where(
                    and(
                        eq(studyAgentPreferences.userId, input.userId),
                        eq(studyAgentPreferences.sessionId, BigInt(session.id))
                    )
                );
        } else {
            await db.insert(studyAgentPreferences).values({
                userId: input.userId,
                sessionId: BigInt(session.id),
                preferences,
            });
        }
    };

    const persistSettings = async (newSettings: PomodoroSettings) => {
        const payload = {
            userId: input.userId,
            sessionId: session.id,
            focusMinutes: newSettings.workDuration,
            shortBreakMinutes: newSettings.shortBreakDuration,
            longBreakMinutes: newSettings.longBreakDuration,
            sessionsBeforeLongBreak: newSettings.sessionsBeforeLongBreak,
            autoStartBreaks: newSettings.autoStartBreaks,
            autoStartPomodoros: newSettings.autoStartWork,
        };

        if (settingsRow) {
            await db
                .update(studyAgentPomodoroSettings)
                .set({ ...payload, sessionId: BigInt(session.id) })
                .where(
                    and(
                        eq(studyAgentPomodoroSettings.userId, input.userId),
                        eq(studyAgentPomodoroSettings.sessionId, BigInt(session.id))
                    )
                );
        } else {
            await db.insert(studyAgentPomodoroSettings).values({ ...payload, sessionId: BigInt(session.id) });
        }
    };

    const sessionFromState = (state: StoredPomodoroState): PomodoroSession => ({
        id: `${session.id}`,
        userId: input.userId,
        phase: state.phase,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        startedAt: state.startedAt ? new Date(state.startedAt) : undefined,
        pausedAt: state.pausedAt ? new Date(state.pausedAt) : undefined,
        endsAt: state.endsAt ? new Date(state.endsAt) : undefined,
        completedPomodoros: state.completedPomodoros,
        totalWorkMinutes: state.totalWorkMinutes,
        currentTaskId: state.currentTaskId,
        settings,
    });

    switch (input.action) {
        case "start": {
            // Create new session or restart
            const phase: PomodoroPhase = input.phase ?? "work";
            const duration = getPhaseDuration(phase, settings);
            const endsAt = new Date(now.getTime() + duration * 60000);

            const newState: StoredPomodoroState = {
                phase,
                isRunning: true,
                isPaused: false,
                startedAt: now.toISOString(),
                endsAt: endsAt.toISOString(),
                completedPomodoros: storedState.completedPomodoros,
                totalWorkMinutes: storedState.totalWorkMinutes,
                currentTaskId: input.taskId,
                pausedAt: undefined,
            };

            await persistState(newState);
            await persistSettings(settings);
            console.log(`🍅 [Pomodoro] Started ${duration} minute work session`);

            return {
                success: true,
                session: sessionFromState(newState),
                message: `Started a ${duration} minute Pomodoro work session!`,
                timeRemaining: `${duration}:00`,
                encouragement: "Let's focus! You've got this~ 💪",
            };
        }

        case "pause": {
            if (!storedState.isRunning) {
                return { success: false, message: "No active Pomodoro session to pause" };
            }

            const remaining = storedState.endsAt
                ? formatTimeRemaining(new Date(storedState.endsAt))
                : "unknown";
            const updatedState: StoredPomodoroState = {
                ...storedState,
                isPaused: true,
                isRunning: false,
                pausedAt: now.toISOString(),
            };

            await persistState(updatedState);
            console.log(`⏸️ [Pomodoro] Paused with ${remaining} remaining`);

            return {
                success: true,
                session: sessionFromState(updatedState),
                message: `Paused your Pomodoro timer with ${remaining} remaining`,
                timeRemaining: remaining,
                encouragement: "Take a quick breather, then let's get back to it~",
            };
        }

        case "resume": {
            if (!storedState.isPaused) {
                return { success: false, message: "No paused Pomodoro session to resume" };
            }

            // Calculate remaining time and set new end time
            let newEnd: string | undefined;
            if (storedState.pausedAt && storedState.endsAt) {
                const remainingMs =
                    new Date(storedState.endsAt).getTime() -
                    new Date(storedState.pausedAt).getTime();
                newEnd = new Date(now.getTime() + remainingMs).toISOString();
            }

            const updatedState: StoredPomodoroState = {
                ...storedState,
                isPaused: false,
                isRunning: true,
                pausedAt: undefined,
                endsAt: newEnd ?? storedState.endsAt,
            };

            await persistState(updatedState);

            const remaining = updatedState.endsAt
                ? formatTimeRemaining(new Date(updatedState.endsAt))
                : "unknown";
            console.log(`▶️ [Pomodoro] Resumed with ${remaining} remaining`);

            return {
                success: true,
                session: sessionFromState(updatedState),
                message: `Resumed your Pomodoro timer! ${remaining} remaining`,
                timeRemaining: remaining,
                encouragement: "Welcome back! Let's finish strong~ 🎯",
            };
        }

        case "stop": {
            if (storedState.phase === "idle") {
                return { success: false, message: "No Pomodoro session to stop" };
            }

            // Calculate work time if we were in a work session
            let totalWorkMinutes = storedState.totalWorkMinutes;
            if (storedState.phase === "work" && storedState.startedAt) {
                const workedMs = now.getTime() - new Date(storedState.startedAt).getTime();
                const workedMinutes = Math.floor(workedMs / 60000);
                totalWorkMinutes += workedMinutes;
            }

            const completedPomodoros = storedState.completedPomodoros;
            const totalMinutes = totalWorkMinutes;

            const resetState: StoredPomodoroState = {
                phase: "idle",
                isRunning: false,
                isPaused: false,
                startedAt: undefined,
                endsAt: undefined,
                pausedAt: undefined,
                completedPomodoros,
                totalWorkMinutes,
                currentTaskId: storedState.currentTaskId,
            };

            await persistState(resetState);

            console.log(
                `🛑 [Pomodoro] Stopped. Total: ${completedPomodoros} pomodoros, ${totalMinutes} min`
            );

            return {
                success: true,
                session: sessionFromState(resetState),
                message: `Stopped Pomodoro timer. You completed ${completedPomodoros} pomodoros and worked for ${totalMinutes} minutes total!`,
                encouragement:
                    completedPomodoros > 0
                        ? "Great work today! Every pomodoro counts~ 🍅"
                        : "No worries! Ready when you are~",
            };
        }

        case "skip": {
            if (!storedState.isRunning) {
                return { success: false, message: "No active Pomodoro session to skip" };
            }

            // Complete current phase
            let completedPomodoros = storedState.completedPomodoros;
            let totalWorkMinutes = storedState.totalWorkMinutes;

            if (storedState.phase === "work") {
                completedPomodoros += 1;
                const duration = settings.workDuration;
                totalWorkMinutes += duration;
            }

            // Move to next phase
            const nextPhase = getNextPhase({
                ...sessionFromState(storedState),
                completedPomodoros,
                totalWorkMinutes,
            });
            const nextDuration = getPhaseDuration(nextPhase, settings);

            const nextState: StoredPomodoroState = {
                phase: nextPhase,
                startedAt: now.toISOString(),
                endsAt: new Date(now.getTime() + nextDuration * 60000).toISOString(),
                isRunning: true,
                isPaused: false,
                completedPomodoros,
                totalWorkMinutes,
                currentTaskId: storedState.currentTaskId,
            };

            await persistState(nextState);

            const phaseLabel =
                nextPhase === "work"
                    ? "work session"
                    : nextPhase === "short_break"
                      ? "short break"
                      : "long break";

            console.log(`⏭️ [Pomodoro] Skipped to ${phaseLabel}`);

            return {
                success: true,
                session: sessionFromState(nextState),
                message: `Skipped to ${phaseLabel}! ${nextDuration} minutes starting now`,
                timeRemaining: `${nextDuration}:00`,
                encouragement:
                    nextPhase === "work"
                        ? "Time to focus again! Let's do this~ 🚀"
                        : "Enjoy your break! You've earned it~ ☕",
            };
        }

        case "status": {
            if (storedState.phase === "idle" && !storedState.startedAt) {
                return {
                    success: true,
                    message: "No active Pomodoro session. Say 'start pomodoro' to begin!",
                    encouragement: "Ready to boost your productivity? Let's start a Pomodoro! 🍅",
                };
            }

            const status = storedState.isRunning
                ? "running"
                : storedState.isPaused
                  ? "paused"
                  : "idle";
            const remaining = storedState.endsAt
                ? formatTimeRemaining(new Date(storedState.endsAt))
                : null;
            const phaseLabel =
                storedState.phase === "work"
                    ? "work session"
                    : storedState.phase === "short_break"
                      ? "short break"
                      : storedState.phase === "long_break"
                        ? "long break"
                        : "idle";

            let message = `Pomodoro status: ${status}\n`;
            message += `Current phase: ${phaseLabel}\n`;
            if (remaining && storedState.isRunning) {
                message += `Time remaining: ${remaining}\n`;
            }
            message += `Completed pomodoros today: ${storedState.completedPomodoros}\n`;
            message += `Total focus time: ${storedState.totalWorkMinutes} minutes`;

            return {
                success: true,
                session: sessionFromState(storedState),
                message,
                timeRemaining: remaining ?? undefined,
                encouragement:
                    storedState.isRunning && storedState.phase === "work"
                        ? "Keep going! You're doing great~ 💪"
                        : storedState.phase.includes("break")
                          ? "Enjoy your break! You've earned it~"
                          : undefined,
            };
        }

        case "configure": {
            if (!input.settings) {
                return { success: false, message: "Settings are required for configure action" };
            }

            const currentSettings = settings;
            const newSettings: PomodoroSettings = {
                ...currentSettings,
                ...input.settings,
            };

            await persistSettings(newSettings);

            console.log(`⚙️ [Pomodoro] Updated settings:`, newSettings);

            return {
                success: true,
                session: sessionFromState(storedState),
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
                sessionId: input.sessionId,
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
