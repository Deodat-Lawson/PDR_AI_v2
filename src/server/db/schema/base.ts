import { relations, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    jsonb,
    serial,
    text,
    timestamp,
    varchar,
    bigint,
} from "drizzle-orm/pg-core";

import { pgVector } from "~/server/db/pgVector";
import { pgTable } from "./helpers";

// ============================================================================
// Users
// ============================================================================

export const users = pgTable(
    "users",
    {
        id: serial("id").primaryKey(),
        name: varchar("name", { length: 256 }).notNull(),
        email: varchar("email", { length: 256 }).notNull(),
        userId: varchar("userId", { length: 256 }).notNull().unique(),
        companyId: bigint("company_id", { mode: "bigint" })
            .notNull()
            .references(() => company.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 256 }).notNull(),
        status: varchar("status", { length: 256 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        companyIdIdx: index("users_company_id_idx").on(table.companyId),
        userIdIdx: index("users_user_id_idx").on(table.userId),
    })
);

// ============================================================================
// Company
// ============================================================================

export const company = pgTable("company", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    employerpasskey: varchar("employerPasskey", { length: 256 }).notNull(),
    employeepasskey: varchar("employeePasskey", { length: 256 }).notNull(),
    numberOfEmployees: varchar("numberOfEmployees", { length: 256 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
        () => new Date()
    ),
});

// ============================================================================
// Document
// ============================================================================

export const document = pgTable(
    "document",
    {
        id: serial("id").primaryKey(),
        url: varchar("url", { length: 256 }).notNull(),
        category: varchar("category", { length: 256 }).notNull(),
        title: varchar("title", { length: 256 }).notNull(),
        companyId: bigint("company_id", { mode: "bigint" })
            .notNull()
            .references(() => company.id, { onDelete: "cascade" }),
        ocrEnabled: boolean("ocr_enabled").default(false),
        ocrProcessed: boolean("ocr_processed").default(false),
        ocrMetadata: jsonb("ocr_metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        companyIdIdx: index("document_company_id_idx").on(table.companyId),
        companyIdIdIdx: index("document_company_id_id_idx").on(table.companyId, table.id),
        companyIdCategoryIdx: index("document_company_id_category_idx").on(
            table.companyId,
            table.category
        ),
    })
);

// ============================================================================
// Category
// ============================================================================

export const category = pgTable(
    "category",
    {
        id: serial("id").primaryKey(),
        name: varchar("name", { length: 256 }).notNull(),
        companyId: bigint("company_id", { mode: "bigint" })
            .notNull()
            .references(() => company.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        companyIdIdx: index("category_company_id_idx").on(table.companyId),
    })
);

// ============================================================================
// PDF Chunks
// ============================================================================

export const pdfChunks = pgTable(
    "pdf_chunks",
    {
        id: serial("id").primaryKey(),
        documentId: bigint("document_id", { mode: "bigint" })
            .notNull()
            .references(() => document.id, { onDelete: "cascade" }),
        page: integer("page").notNull(),
        chunkIndex: integer("chunk_index").notNull().default(0), // deterministic ordering within a page
        content: text("content").notNull(),
        embedding: pgVector({ dimension: 1536 })("embedding"),
    },
    (table) => ({
        documentIdIdx: index("pdf_chunks_document_id_idx").on(table.documentId),
        documentIdPageIdx: index("pdf_chunks_document_id_page_idx").on(
            table.documentId,
            table.page
        ),
        documentIdPageChunkIdx: index("pdf_chunks_document_id_page_chunk_idx").on(
            table.documentId,
            table.page,
            table.chunkIndex
        ),
    })
);

// ============================================================================
// Chat History
// ============================================================================

export const ChatHistory = pgTable(
    "chat_history",
    {
        id: serial("id").primaryKey(),
        UserId: varchar("user_id", { length: 256 }).notNull(), // Clerk user ID
        documentId: bigint("document_id", { mode: "bigint" })
            .notNull()
            .references(() => document.id, { onDelete: "cascade" }),
        documentTitle: varchar("document_title", { length: 256 }).notNull(),
        question: text("question").notNull(),
        response: text("response").notNull(),
        chatId: varchar("chat_id", { length: 256 }),
        queryType: varchar("query_type", {
            length: 20,
            enum: ["simple", "advanced"],
        }).default("simple"),
        pages: integer("pages").array().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => ({
        userIdIdx: index("chat_history_user_id_idx").on(table.UserId),
        userIdCreatedAtIdx: index("chat_history_user_id_created_at_idx").on(
            table.UserId,
            table.createdAt
        ),
        documentIdIdx: index("chat_history_document_id_idx").on(table.documentId),
    })
);

// ============================================================================
// Predictive Document Analysis Results
// ============================================================================

export const predictiveDocumentAnalysisResults = pgTable(
    "predictive_document_analysis_results",
    {
        id: serial("id").primaryKey(),
        documentId: bigint("document_id", { mode: "bigint" })
            .notNull()
            .references(() => document.id, { onDelete: "cascade" }),
        analysisType: varchar("analysis_type", { length: 256 }).notNull(),
        includeRelatedDocs: boolean("include_related_docs").default(false),
        resultJson: jsonb("result_json").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
    },
    (table) => ({
        documentIdIdx: index("predictive_analysis_document_id_idx").on(table.documentId),
    })
);

// ============================================================================
// Document Reference Resolution
// ============================================================================

export const documentReferenceResolution = pgTable(
    "document_reference_resolutions",
    {
        id: serial("id").primaryKey(),
        companyId: bigint("company_id", { mode: "bigint" })
            .notNull()
            .references(() => company.id, { onDelete: "cascade" }),
        referenceName: varchar("reference_name", { length: 256 }).notNull(),
        resolvedInDocumentId: integer("resolved_in_document_id"),
        resolutionDetails: jsonb("resolution_details"),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        companyRefIdx: index("document_reference_resolutions_company_ref_idx").on(
            table.companyId
        ),
    })
);

// ============================================================================
// Relations
// ============================================================================

export const companyRelations = relations(company, ({ many }) => ({
    users: many(users),
    documents: many(document),
    categories: many(category),
}));

export const usersRelations = relations(users, ({ one }) => ({
    company: one(company, {
        fields: [users.companyId],
        references: [company.id],
    }),
}));

export const documentsRelations = relations(document, ({ one, many }) => ({
    company: one(company, {
        fields: [document.companyId],
        references: [company.id],
    }),
    pdfChunks: many(pdfChunks),
    chatHistory: many(ChatHistory),
    predictiveAnalysisResults: many(predictiveDocumentAnalysisResults),
}));

export const categoryRelations = relations(category, ({ one }) => ({
    company: one(company, {
        fields: [category.companyId],
        references: [company.id],
    }),
}));

export const pdfChunksRelations = relations(pdfChunks, ({ one }) => ({
    document: one(document, {
        fields: [pdfChunks.documentId],
        references: [document.id],
    }),
}));

export const chatHistoryRelations = relations(ChatHistory, ({ one }) => ({
    document: one(document, {
        fields: [ChatHistory.documentId],
        references: [document.id],
    }),
}));

export const predictiveAnalysisRelations = relations(predictiveDocumentAnalysisResults, ({ one }) => ({
    document: one(document, {
        fields: [predictiveDocumentAnalysisResults.documentId],
        references: [document.id],
    }),
}));

// ============================================================================
// Type exports
// ============================================================================

export type User = InferSelectModel<typeof users>;
export type Company = InferSelectModel<typeof company>;
export type Document = InferSelectModel<typeof document>;
export type Category = InferSelectModel<typeof category>;
export type PdfChunk = InferSelectModel<typeof pdfChunks>;
export type ChatHistoryEntry = InferSelectModel<typeof ChatHistory>;
export type PredictiveDocumentAnalysisResult = InferSelectModel<typeof predictiveDocumentAnalysisResults>;
export type DocumentReferenceResolution = InferSelectModel<typeof documentReferenceResolution>;
