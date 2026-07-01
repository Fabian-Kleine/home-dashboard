import { API_ROUTES, type IsolarLoginRequest, type IsolarSolarData, type IsolarStatusResponse } from "@repo/shared";
import { Router, type Request, type Response, type Router as ExpressRouter } from "express";
import {
    getSolarData,
    ISOLAR_INVERTER_DEVICE_TYPE_COOKIE,
    ISOLAR_INVERTER_PS_KEY_COOKIE,
    ISOLAR_PS_ID_COOKIE,
    ISOLAR_TOKEN_COOKIE,
    ISOLAR_TOKEN_MAX_AGE_MS,
    IsolarAuthError,
    loginToIsolarCloud,
    queryFirstInverterRef,
    queryFirstPowerStationId,
    type IsolarInverterRef,
} from "../lib/isolar.js";

const router: ExpressRouter = Router();
const isProduction = process.env.NODE_ENV === "production";

function setIsolarCookie(response: Response, name: string, value: string) {
    response.cookie(name, value, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: ISOLAR_TOKEN_MAX_AGE_MS,
    });
}

function setInverterCookies(response: Response, inverter: IsolarInverterRef) {
    setIsolarCookie(response, ISOLAR_INVERTER_PS_KEY_COOKIE, inverter.psKey);
    setIsolarCookie(response, ISOLAR_INVERTER_DEVICE_TYPE_COOKIE, String(inverter.deviceType));
}

function readInverterRefFromCookies(request: Request): IsolarInverterRef | undefined {
    const psKey = request.cookies?.[ISOLAR_INVERTER_PS_KEY_COOKIE];
    const deviceType = Number(request.cookies?.[ISOLAR_INVERTER_DEVICE_TYPE_COOKIE]);

    if (!psKey || Number.isNaN(deviceType)) return undefined;

    return { psKey, deviceType };
}

function clearIsolarCookies(response: Response) {
    response.clearCookie(ISOLAR_TOKEN_COOKIE);
    response.clearCookie(ISOLAR_PS_ID_COOKIE);
    response.clearCookie(ISOLAR_INVERTER_PS_KEY_COOKIE);
    response.clearCookie(ISOLAR_INVERTER_DEVICE_TYPE_COOKIE);
}

router.post(API_ROUTES.isolarLogin, async (request, response) => {
    const { email, password } = (request.body ?? {}) as Partial<IsolarLoginRequest>;

    if (!email || !password) {
        return response.status(400).json({ error: "Email and password are required" });
    }

    try {
        const token = await loginToIsolarCloud(email, password);
        setIsolarCookie(response, ISOLAR_TOKEN_COOKIE, token);

        try {
            const psId = await queryFirstPowerStationId(token);
            setIsolarCookie(response, ISOLAR_PS_ID_COOKIE, psId);

            const inverter = await queryFirstInverterRef(token, psId);
            if (inverter) {
                setInverterCookies(response, inverter);
            }
        } catch (psIdError) {
            console.warn("Logged in to iSolarCloud but could not resolve a plant yet:", psIdError);
        }

        const payload: IsolarStatusResponse = { loggedIn: true };
        response.json(payload);
    } catch (error) {
        if (error instanceof IsolarAuthError) {
            return response.status(401).json({ error: error.message });
        }

        console.error("Failed to log in to iSolarCloud:", error);
        response.status(502).json({ error: "Unable to reach the iSolarCloud API right now" });
    }
});

router.post(API_ROUTES.isolarLogout, (_request, response) => {
    clearIsolarCookies(response);
    const payload: IsolarStatusResponse = { loggedIn: false };
    response.json(payload);
});

router.get(API_ROUTES.isolarStatus, (request, response) => {
    const payload: IsolarStatusResponse = { loggedIn: Boolean(request.cookies?.[ISOLAR_TOKEN_COOKIE]) };
    response.json(payload);
});

router.get(API_ROUTES.isolarSolarData, async (request, response) => {
    const token = request.cookies?.[ISOLAR_TOKEN_COOKIE];

    if (!token) {
        return response.status(401).json({ error: "Not connected to iSolarCloud" });
    }

    try {
        let psId = request.cookies?.[ISOLAR_PS_ID_COOKIE];

        if (!psId) {
            psId = await queryFirstPowerStationId(token);
            setIsolarCookie(response, ISOLAR_PS_ID_COOKIE, psId);
        }

        let inverter = readInverterRefFromCookies(request);

        if (!inverter) {
            try {
                inverter = await queryFirstInverterRef(token, psId);
                if (inverter) {
                    setInverterCookies(response, inverter);
                }
            } catch (inverterError) {
                console.warn("Could not resolve an inverter for per-string PV data:", inverterError);
            }
        }

        const solarData: IsolarSolarData = await getSolarData(token, psId, inverter);
        response.json(solarData);
    } catch (error) {
        if (error instanceof IsolarAuthError) {
            clearIsolarCookies(response);
            return response.status(401).json({ error: error.message });
        }

        console.error("Failed to fetch iSolarCloud solar data:", error);
        response.status(502).json({ error: "Unable to reach the iSolarCloud API right now" });
    }
});

export default router;
