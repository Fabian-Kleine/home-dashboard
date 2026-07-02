import { API_ROUTES, type AiOverviewRequest, type AiOverviewResponse } from "@repo/shared";
import { Router, type Router as ExpressRouter } from "express";
import { getAiOverview } from "../lib/ai-overview.js";

const router: ExpressRouter = Router();

router.post(API_ROUTES.aiOverview, async (request, response) => {
    const body = (request.body ?? {}) as Partial<AiOverviewRequest>;

    if (!body.weather || !body.productionStatus || !body.language) {
        return response.status(400).json({ error: "Missing required fields: weather, productionStatus, language" });
    }

    try {
        const summary = await getAiOverview(body as AiOverviewRequest);
        const payload: AiOverviewResponse = { summary };
        response.json(payload);
    } catch (error) {
        console.error("Failed to generate AI overview:", error);
        response.status(502).json({ error: "Unable to generate the AI overview right now" });
    }
});

export default router;
