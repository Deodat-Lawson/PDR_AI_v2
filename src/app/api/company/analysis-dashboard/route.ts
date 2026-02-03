import { NextResponse } from "next/server";
import { db } from "~/server/db/index";
import { users, document, documentViews, ChatHistory, agentAiChatbotMessage, agentAiChatbotChat } from "~/server/db/schema";
import { eq, and, sql, gte, desc, count, inArray, max } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

interface TrendDataPoint {
    date: string;
    count: number;
}

interface EmployeeInfo {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    lastActiveAt: string | null;
    createdAt: string;
    queryCount: number;
}

interface DocumentStat {
    id: number;
    title: string;
    category: string;
    views: number;
    lastViewedAt: string | null;
    createdAt: string;
}

interface AnalysisDashboardResponse {
    success: boolean;
    data: {
        totalEmployees: number;
        totalDocuments: number;
        employees: EmployeeInfo[];
        employeeTrend: TrendDataPoint[];
        documentViewsTrend: TrendDataPoint[];
        documentStats: DocumentStat[];
    };
}

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Update current user's lastActiveAt
        await db
            .update(users)
            .set({ lastActiveAt: new Date() })
            .where(eq(users.userId, userId));

        // Get user info and verify they are employer/owner
        const [userInfo] = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId));

        if (!userInfo) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        if (userInfo.role !== "employer" && userInfo.role !== "owner") {
            return NextResponse.json(
                { success: false, error: "Unauthorized. Only employers and owners can access this data." },
                { status: 403 }
            );
        }

        const companyId = userInfo.companyId;

        // Get all employees for the company
        const employeesData = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                status: users.status,
                lastActiveAt: users.lastActiveAt,
                createdAt: users.createdAt,
                userId: users.userId,
            })
            .from(users)
            .where(eq(users.companyId, companyId))
            .orderBy(desc(users.lastActiveAt));

        // Get employee query counts from BOTH simple queries (ChatHistory) AND AI chat (agentAiChatbotMessage)
        const employeeUserIds = employeesData.map(e => e.userId);
        
        let queryCountsData: { userId: string; count: number }[] = [];
        
        if (employeeUserIds.length > 0) {
            // 1. Get counts from legacy ChatHistory
            const simpleQueryCounts = await db
                .select({
                    userId: ChatHistory.UserId,
                    count: count(),
                })
                .from(ChatHistory)
                .where(inArray(ChatHistory.UserId, employeeUserIds))
                .groupBy(ChatHistory.UserId);

            // 2. Get counts from AI Chat (messages where role='user')
            // Join with chat table to get userId since message table doesn't have it directly
            const aiChatCounts = await db
                .select({
                    userId: agentAiChatbotChat.userId,
                    count: count(),
                })
                .from(agentAiChatbotMessage)
                .innerJoin(agentAiChatbotChat, eq(agentAiChatbotMessage.chatId, agentAiChatbotChat.id))
                .where(
                    and(
                        eq(agentAiChatbotMessage.role, "user"),
                        inArray(agentAiChatbotChat.userId, employeeUserIds)
                    )
                )
                .groupBy(agentAiChatbotChat.userId);

            // 3. Merge counts
            const countsMap = new Map<string, number>();
            
            simpleQueryCounts.forEach(c => {
                countsMap.set(c.userId, (countsMap.get(c.userId) ?? 0) + Number(c.count));
            });
            
            aiChatCounts.forEach(c => {
                countsMap.set(c.userId, (countsMap.get(c.userId) ?? 0) + Number(c.count));
            });

            queryCountsData = Array.from(countsMap.entries()).map(([userId, count]) => ({
                userId,
                count
            }));
        }
            
        const queryCountsMap = new Map(
            queryCountsData.map(q => [q.userId, q.count])
        );

        // Get total document count for the company
        const [documentCount] = await db
            .select({ count: count() })
            .from(document)
            .where(eq(document.companyId, companyId));

        // Get per-document statistics
        const documentStatsData = await db
            .select({
                id: document.id,
                title: document.title,
                category: document.category,
                createdAt: document.createdAt,
                views: count(documentViews.id),
                lastViewedAt: max(documentViews.viewedAt),
            })
            .from(document)
            .leftJoin(documentViews, eq(document.id, documentViews.documentId))
            .where(eq(document.companyId, companyId))
            .groupBy(document.id, document.title, document.category, document.createdAt)
            .orderBy(desc(count(documentViews.id)));

        // Calculate date 30 days ago for trend data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Employee trend: count employees created per day in last 30 days
        const employeeTrendData = await db
            .select({
                date: sql<string>`DATE(${users.createdAt})`.as("date"),
                count: count(),
            })
            .from(users)
            .where(
                and(
                    eq(users.companyId, companyId),
                    gte(users.createdAt, thirtyDaysAgo)
                )
            )
            .groupBy(sql`DATE(${users.createdAt})`)
            .orderBy(sql`DATE(${users.createdAt})`);

        // Document views trend: count views per day in last 30 days
        const documentViewsTrendData = await db
            .select({
                date: sql<string>`DATE(${documentViews.viewedAt})`.as("date"),
                count: count(),
            })
            .from(documentViews)
            .where(
                and(
                    eq(documentViews.companyId, companyId),
                    gte(documentViews.viewedAt, thirtyDaysAgo)
                )
            )
            .groupBy(sql`DATE(${documentViews.viewedAt})`)
            .orderBy(sql`DATE(${documentViews.viewedAt})`);

        // Fill in missing dates for trends (to show continuous line chart)
        const fillTrendDates = (data: { date: string; count: number }[]): TrendDataPoint[] => {
            const result: TrendDataPoint[] = [];
            const dataMap = new Map(data.map(d => [d.date, Number(d.count)]));
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0]!;
                result.push({
                    date: dateStr,
                    count: dataMap.get(dateStr) ?? 0,
                });
            }
            return result;
        };

        // Calculate cumulative employee count trend
        const calculateCumulativeEmployeeTrend = (): TrendDataPoint[] => {
            const result: TrendDataPoint[] = [];
            const dailyJoins = new Map(
                employeeTrendData.map(d => [d.date, Number(d.count)])
            );
            
            // Count employees before 30 days ago
            const employeesBeforePeriod = employeesData.filter(
                e => new Date(e.createdAt) < thirtyDaysAgo
            ).length;
            
            let cumulative = employeesBeforePeriod;
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0]!;
                cumulative += dailyJoins.get(dateStr) ?? 0;
                result.push({
                    date: dateStr,
                    count: cumulative,
                });
            }
            return result;
        };

        // Format employee data
        const employees: EmployeeInfo[] = employeesData.map(emp => ({
            id: Number(emp.id),
            name: emp.name,
            email: emp.email,
            role: emp.role,
            status: emp.status,
            lastActiveAt: emp.lastActiveAt?.toISOString() ?? null,
            createdAt: emp.createdAt.toISOString(),
            queryCount: queryCountsMap.get(emp.userId) ?? 0,
        }));

        // Format document stats
        const documentStats: DocumentStat[] = documentStatsData.map(doc => ({
            id: Number(doc.id),
            title: doc.title,
            category: doc.category,
            views: Number(doc.views),
            lastViewedAt: doc.lastViewedAt?.toISOString() ?? null,
            createdAt: doc.createdAt.toISOString(),
        }));

        const response: AnalysisDashboardResponse = {
            success: true,
            data: {
                totalEmployees: employeesData.length,
                totalDocuments: documentCount?.count ?? 0,
                employees,
                employeeTrend: calculateCumulativeEmployeeTrend(),
                documentViewsTrend: fillTrendDates(
                    documentViewsTrendData.map(d => ({
                        date: d.date,
                        count: Number(d.count),
                    }))
                ),
                documentStats,
            },
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error: unknown) {
        console.error("Error fetching analysis dashboard data:", error);
        return NextResponse.json(
            { success: false, error: "Unable to fetch analysis dashboard data" },
            { status: 500 }
        );
    }
}
