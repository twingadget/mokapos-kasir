import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { buildReportCsv, getReportData, resolveDateRange } from "@/lib/services/reports";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const range = resolveDateRange({
        from: request.nextUrl.searchParams.get("from") ?? undefined,
        to: request.nextUrl.searchParams.get("to") ?? undefined,
    });

    const report = await getReportData(range);
    const csv = buildReportCsv({ orders: report.orders });
    const fileName = `laporan-${range.from}-${range.to}.csv`;

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
        },
    });
}
