import { API_ROUTES } from "@repo/shared";
import { Router, type Router as ExpressRouter } from "express";
import { getNewsData } from "../lib/news.js";

const router: ExpressRouter = Router();

router.get(API_ROUTES.news, async (_request, response) => {
    try {
        const newsData = await getNewsData();
        response.json(newsData);
    } catch (error) {
        console.error("Failed to serve news response:", error);
        response.status(502).json({ error: "Unable to fetch news right now" });
    }
});

export default router;
