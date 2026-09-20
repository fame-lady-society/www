import { fetchHoldingsPage, HoldingsError } from "@/lib/openseaHoldings.server";
import { holdingsCsv } from "@/lib/openseaHoldings";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ walletAddress: string }> },
) {
  const { walletAddress } = await params;
  const query = new URL(request.url).searchParams;
  const format = query.get("format") ?? "json";
  if (!["json", "csv"].includes(format))
    return Response.json(
      { error: "format must be json or csv" },
      { status: 400 },
    );
  try {
    const page = await fetchHoldingsPage(walletAddress, query);
    const headers: Record<string, string> = {
      "Cache-Control": "no-store",
      "X-Export-Complete": String(page.complete),
    };
    if (page.next) {
      const next = new URL(page.next, request.url);
      next.searchParams.set("format", format);
      headers.Link = `<${next.pathname}${next.search}>; rel="next"`;
    }
    if (format === "csv") {
      headers["Content-Type"] = "text/csv; charset=utf-8";
      headers["Content-Disposition"] =
        `attachment; filename="${walletAddress}-${page.chain}-page.csv"`;
      return new Response(holdingsCsv(page.nfts), { headers });
    }
    return Response.json(page, { headers });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof HoldingsError
            ? error.message
            : "Unable to read OpenSea holdings. Retry later.",
      },
      {
        status: error instanceof HoldingsError ? error.status : 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
