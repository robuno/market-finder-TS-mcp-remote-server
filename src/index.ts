import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// interface Env {
//     Add any environment variables your worker needs
// }

// Store coordinates globally
let LATITUDE: number | null = null;
let LONGITUDE: number | null = null;

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
    server = new McpServer({
        name: "Market Price Finder",
        version: "1.0.0",
    });

    async init() {
        // Search market product tool
        this.server.tool(
            "search_market_product",
            {
                keywords: z.string(),
                latitude: z.number(),
                longitude: z.number(),
                distance: z.number().optional().default(5),
                page: z.number().optional().default(0),
                size: z.number().optional().default(24),
            },
            async ({ keywords, latitude, longitude, distance, page, size }) => {
                const searchUrl = "https://api.marketfiyati.org.tr/api/v2/search";
                const searchPayload = {
                    keywords,
                    latitude,
                    longitude,
                    distance,
                    pages: page, // <-- use 'pages' instead of 'page'
                    size,
                };
                const headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0",
                    // "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                    // "Origin": "https://marketfiyati.org.tr",
                    // "Referer": "https://marketfiyati.org.tr/"
                };

                try {
                    console.log("Sending request with payload:", JSON.stringify(searchPayload, null, 2));
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

                    const response = await fetch(searchUrl, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(searchPayload),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("API Error:", response.status, errorText);
                        throw new Error(`API request failed: ${response.status} ${errorText}`);
                    }

                    const searchResponse = await response.json();
                    if (typeof searchResponse !== "object" || searchResponse === null || !("content" in searchResponse)) {
                        throw new Error("Invalid response format");
                    }
                    const searchResponseData = searchResponse as { content?: any[] };
                    if (!searchResponseData.content) {
                        return { content: [{ type: "text", text: "No products found." }] };
                    }

                    const marketResults = (searchResponse.content as any[]).map((productItem: any) => {
                        const productName = productItem.title;
                        const marketDepots = productItem.productDepotInfoList || [];
                        if (marketDepots.length === 0) {
                            return { productName, price: null, marketName: null };
                        }
                        const cheapestDepot = marketDepots.reduce((minPrice: any, depot: any) => 
                            (depot.price < minPrice.price ? depot : minPrice), marketDepots[0]);
                        return {
                            productName,
                            price: cheapestDepot.price,
                            marketName: cheapestDepot.marketAdi,
                        };
                    });

                    return {
                        content: [{ type: "text", text: JSON.stringify(marketResults, null, 2) }],
                    };
                } catch (error: any) {
                    let errorMsg = "Failed to search for products.";
                    if (error instanceof Error) {
                        errorMsg += ` Error: ${error.message}`;
                    } else if (typeof error === "string") {
                        errorMsg += ` Error: ${error}`;
                    }
                    return {
                        content: [{ type: "text", text: errorMsg }],
                    };
                }
            }
        );

        // Get coordinates from address tool
        this.server.tool(
            "get_coordinates_from_address",
            {
                location: z.string(),
            },
            async ({ location }) => {
                const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
                geocodeUrl.searchParams.append("q", location);
                geocodeUrl.searchParams.append("format", "json");
                geocodeUrl.searchParams.append("limit", "1");

                const geocodeHeaders = {
                    "User-Agent": "market-finder/1.0",
                };

                try {
                    const response = await fetch(geocodeUrl.toString(), { headers: geocodeHeaders });
                    if (!response.ok) {
                        throw new Error("API request failed");
                    }

                    const geocodeResponse = await response.json() as Array<{ lat: string; lon: string }>;
                    if (!geocodeResponse || geocodeResponse.length === 0) {
                        return {
                            content: [{ type: "text", text: "Location not found." }],
                        };
                    }

                    const locationCoordinates = {
                        latitude: parseFloat(geocodeResponse[0].lat),
                        longitude: parseFloat(geocodeResponse[0].lon),
                    };

                    // Update global coordinates
                    LATITUDE = locationCoordinates.latitude;
                    LONGITUDE = locationCoordinates.longitude;

                    return {
                        content: [{ type: "text", text: JSON.stringify(locationCoordinates, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: "Error occurred while retrieving coordinates." }],
                    };
                }
            }
        );

        // Get market product tool (using global coordinates)
        this.server.tool(
            "get_market_product",
            {
                keywords: z.string(),
            },
            async ({ keywords }) => {
                if (LATITUDE === null || LONGITUDE === null) {
                    return {
                        content: [{ type: "text", text: "Location not set. Please get coordinates first." }],
                    };
                }

                try {
                    const searchUrl = "https://api.marketfiyati.org.tr/api/v2/search";
                    const searchPayload = {
                        keywords,
                        latitude: LATITUDE,
                        longitude: LONGITUDE,
                        distance: 4,
                        pages: 0, // <-- use 'pages' instead of 'page'
                        size: 24,
                    };
                    const headers = {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 OPR/120.0.0.0",
                        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
                        "Origin": "https://marketfiyati.org.tr",
                        "Referer": "https://marketfiyati.org.tr/"
                    };

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

                    const response = await fetch(searchUrl, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(searchPayload),
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error("API request failed");
                    }

                    const searchResponse = await response.json() as { content?: Array<{ title: string; productDepotInfoList?: Array<{ price: number; marketAdi: string }> }> };
                    if (!searchResponse?.content) {
                        return { content: [{ type: "text", text: "No products found." }] };
                    }

                    const marketResults = searchResponse.content.map(productItem => ({
                        productName: productItem.title,
                        price: productItem.productDepotInfoList?.[0]?.price ?? null,
                        marketName: productItem.productDepotInfoList?.[0]?.marketAdi ?? null,
                    }));

                    return {
                        content: [{ type: "text", text: JSON.stringify(marketResults, null, 2) }],
                    };
                } catch (error) {
                    return {
                        content: [{ type: "text", text: "Failed to search for products." }],
                    };
                }
            }
        );
    }
}

export default {
    fetch(request: Request, env: Env, ctx: ExecutionContext) {
        const url = new URL(request.url);

        if (url.pathname === "/sse" || url.pathname === "/sse/message") {
            return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
        }

        if (url.pathname === "/mcp") {
            return MyMCP.serve("/mcp").fetch(request, env, ctx);
        }

        return new Response("Not found", { status: 404 });
    },
};
