
import { relations, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { boolean, index, integer, jsonb, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { pgTable } from "./helpers";

export const studyAgentProfile = pgTable(
    "study_agent_profile",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull().unique(),
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
    })
);

export const studyAgentPreferences = pgTable(
    "study_agent_preferences",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull().unique(),
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
    })
);

export const studyAgentGoals = pgTable(
    "study_agent_goals",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull(),
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
    })
);

export const studyAgentPomodoroSettings = pgTable(
    "study_agent_pomodoro_settings",
    {
        id: serial("id").primaryKey(),
        userId: varchar("user_id", { length: 256 }).notNull().unique(),
        focusMinutes: integer("focus_minutes").notNull().default(25),
        shortBreakMinutes: integer("short_break_minutes").notNull().default(5),
        longBreakMinutes: integer("long_break_minutes").notNull().default(15),
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
        pomodoroUserIdx: index("study_agent_pomodoro_settings_user_idx").on(table.userId),
    })
);

export const studyAgentProfileRelations = relations(studyAgentProfile, ({ one, many }) => ({
    preferences: one(studyAgentPreferences, {
        fields: [studyAgentProfile.userId],
        references: [studyAgentPreferences.userId],
    }),
    goals: many(studyAgentGoals),
    pomodoroSettings: one(studyAgentPomodoroSettings, {
        fields: [studyAgentProfile.userId],
        references: [studyAgentPomodoroSettings.userId],
    }),
}));

export type StudyAgentGoal = InferSelectModel<typeof studyAgentGoals>;
export type StudyAgentProfile = InferSelectModel<typeof studyAgentProfile>;
export type StudyAgentPreferences = InferSelectModel<typeof studyAgentPreferences>;
export type StudyAgentPomodoroSettings = InferSelectModel<typeof studyAgentPomodoroSettings>;