
import { relations, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { boolean, index, integer, jsonb, serial, text, timestamp, varchar, bigint } from "drizzle-orm/pg-core";

import { pgTable } from "./helpers";

export const studyAgentSessions = pgTable(
    "study_agent_sessions",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        name: text("name").notNull().default("Default Session"),
        mode: varchar("mode", { length: 32 }).notNull().default("teacher"), // "teacher" | "study-buddy"
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        sessionsUserIdx: index("study_agent_sessions_user_idx").on(table.userId),
    })
);

export const studyAgentProfile = pgTable(
    "study_agent_profile",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        sessionId: bigint("session_id", { mode: "bigint" })
            .notNull()
            .references(() => studyAgentSessions.id, { onDelete: "cascade" }),
        name: text("name"),
        grade: text("grade"),
        gender: text("gender"),
        fieldOfStudy: text("field_of_study"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        userIdx: index("study_agent_profile_user_idx").on(table.userId),
        sessionIdx: index("study_agent_profile_session_idx").on(table.sessionId),
    })
);

export const studyAgentPreferences = pgTable(
    "study_agent_preferences",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        sessionId: bigint("session_id", { mode: "bigint" })
            .notNull()
            .references(() => studyAgentSessions.id, { onDelete: "cascade" }),
        preferences: jsonb("preferences").notNull().default({}),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        preferencesUserIdx: index("study_agent_preferences_user_idx").on(table.userId),
        preferencesSessionIdx: index("study_agent_preferences_session_idx").on(
            table.sessionId
        ),
    })
);

export const studyAgentGoals = pgTable(
    "study_agent_goals",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        sessionId: bigint("session_id", { mode: "bigint" })
            .notNull()
            .references(() => studyAgentSessions.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        materials: text("materials").array().default([]),
        completed: boolean("completed").notNull().default(false),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        goalsUserIdx: index("study_agent_goals_user_idx").on(table.userId),
        goalsSessionIdx: index("study_agent_goals_session_idx").on(table.sessionId),
    })
);

export const studyAgentPomodoroSettings = pgTable(
    "study_agent_pomodoro_settings",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        sessionId: bigint("session_id", { mode: "bigint" })
            .notNull()
            .references(() => studyAgentSessions.id, { onDelete: "cascade" }),
        focusMinutes: integer("focus_minutes").notNull().default(25),
        shortBreakMinutes: integer("short_break_minutes").notNull().default(5),
        longBreakMinutes: integer("long_break_minutes").notNull().default(15),
        remainingTime: integer("remaining_time").notNull().default(0),
        sessionsBeforeLongBreak: integer("sessions_before_long_break")
            .notNull()
            .default(4),
        autoStartBreaks: boolean("auto_start_breaks").notNull().default(false),
        autoStartPomodoros: boolean("auto_start_pomodoros").notNull().default(false),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        pomodoroUserIdx: index("study_agent_pomodoro_settings_user_idx").on(
            table.userId
        ),
        pomodoroSessionIdx: index("study_agent_pomodoro_settings_session_idx").on(
            table.sessionId
        ),
    })
);

export const studyAgentNotes = pgTable(
    "study_agent_notes",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
        sessionId: bigint("session_id", { mode: "bigint" })
            .notNull()
            .references(() => studyAgentSessions.id, { onDelete: "cascade" }),
        title: text("title"),
        content: text("content"),
        tags: text("tags").array().default([]),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        notesUserIdx: index("study_agent_notes_user_idx").on(table.userId),
        notesSessionIdx: index("study_agent_notes_session_idx").on(table.sessionId),
    })
);

export const studyAgentMessages = pgTable(
    "study_agent_messages",
    {
        id: serial("id").primaryKey(),
        odlId: varchar("original_id", { length: 64 }), // store original frontend ID for dedup
        userId: varchar("user_id", { length: 256 }).notNull(),
        sessionId: bigint("session_id", { mode: "bigint" })
            .notNull()
            .references(() => studyAgentSessions.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 32 }).notNull(), // "user" | "teacher" | "buddy"
        content: text("content").notNull(),
        ttsContent: text("tts_content"), // text with emotion tags for TTS
        attachedDocument: text("attached_document"),
        attachedDocumentId: text("attached_document_id"),
        attachedDocumentUrl: text("attached_document_url"),
        isVoice: boolean("is_voice").default(false),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        messagesUserIdIdx: index("study_agent_messages_user_id_idx").on(table.userId),
        messagesSessionIdIdx: index("study_agent_messages_session_id_idx").on(table.sessionId)
    })
);

export const studyAgentSessionRelations = relations(studyAgentSessions, ({ many }) => ({
    profiles: many(studyAgentProfile),
    preferences: many(studyAgentPreferences),
    goals: many(studyAgentGoals),
    pomodoroSettings: many(studyAgentPomodoroSettings),
    notes: many(studyAgentNotes),
    messages: many(studyAgentMessages),
}));

export const studyAgentProfileRelations = relations(studyAgentProfile, ({ one, many }) => ({
    session: one(studyAgentSessions, {
        fields: [studyAgentProfile.sessionId],
        references: [studyAgentSessions.id],
    }),
    preferences: many(studyAgentPreferences),
    goals: many(studyAgentGoals),
    pomodoroSettings: many(studyAgentPomodoroSettings),
    notes: many(studyAgentNotes),
}));

export type StudyAgentSession = InferSelectModel<typeof studyAgentSessions>;
export type StudyAgentGoal = InferSelectModel<typeof studyAgentGoals>;
export type StudyAgentProfile = InferSelectModel<typeof studyAgentProfile>;
export type StudyAgentPreferences = InferSelectModel<typeof studyAgentPreferences>;
export type StudyAgentPomodoroSettings = InferSelectModel<typeof studyAgentPomodoroSettings>;
export type StudyAgentNote = InferSelectModel<typeof studyAgentNotes>;
export type StudyAgentMessage = InferSelectModel<typeof studyAgentMessages>;