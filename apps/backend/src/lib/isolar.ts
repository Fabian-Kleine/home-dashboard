import type { IsolarPvString, IsolarSolarData } from "@repo/shared";

// These endpoints are the "User" (direct account/password login) API family,
// not the OAuth2.0 developer-portal API — the two use different paths and
// response shapes even where they cover the same data, and a User-login token
// is only accepted by User-family endpoints.
const ISOLAR_LOGIN_PATH = "/login";
const ISOLAR_QUERY_STATION_LIST_PATH = "/getPowerStationList";
const ISOLAR_DEVICE_LIST_PATH = "/getDeviceList";
const ISOLAR_REAL_TIME_DATA_PATH = "/getDeviceRealTimeData";
const ISOLAR_SYS_CODE = "901";

// Plants are queryable as a virtual "device" of this type, keyed by
// `{ps_id}_11_0_0` — confirmed against multiple iSolarCloud doc examples.
const PLANT_DEVICE_TYPE = 11;
// Plain grid-tied inverters and hybrid/battery ("Energy Storage System")
// inverters report under different device types with entirely different
// measuring-point ID ranges, so both are queried for and handled separately.
const INVERTER_DEVICE_TYPE = 1;
const ESS_INVERTER_DEVICE_TYPE = 14;

export const ISOLAR_TOKEN_COOKIE = "isolar_token";
export const ISOLAR_PS_ID_COOKIE = "isolar_ps_id";
export const ISOLAR_INVERTER_PS_KEY_COOKIE = "isolar_inverter_ps_key";
export const ISOLAR_INVERTER_DEVICE_TYPE_COOKIE = "isolar_inverter_device_type";
export const ISOLAR_TOKEN_MAX_AGE_MS = 55 * 60 * 1000;

// Plant-level measuring points (see Appendix 10 / Common Plant Measuring Points).
// Residential storage inverters and EMS-based commercial storage systems expose
// battery/grid/load under different point IDs, so both are requested and the
// first populated value wins.
const POINT_SOLAR_POWER = "83033"; // Plant Power (W)
const POINT_DAILY_YIELD = "83022"; // Daily Yield of Plant (Wh)
const POINT_LOAD_POWER = "83106"; // Load Power (W)
const POINT_LOAD_POWER_EMS = "83330"; // Load Active Power (EMS) (W)
const POINT_GRID_POWER = "83549"; // Grid Active Power (W)
const POINT_GRID_POWER_EMS = "83328"; // Grid Active Power (EMS) (W)
const POINT_BATTERY_POWER = "83238"; // Total field energy storage active power (W)
const POINT_BATTERY_POWER_EMS = "83326"; // Energy Storage Active Power (EMS) (W)
const POINT_BATTERY_LEVEL = "83252"; // Battery Level (SOC) (%)
const POINT_BATTERY_LEVEL_EMS = "83334"; // Energy Storage SOC (EMS) (%)

// Per-string DC input, keyed by device type — plain inverters report string
// power directly, while ESS/hybrid inverters only report MPPT voltage and
// current, so power has to be computed (P = V * I). Labels match this
// installation's physical string layout (two roof faces on one inverter).
type PvStringPointConfig =
    | { kind: "power"; pointId: string; label: string }
    | { kind: "voltage-current"; voltagePointId: string; currentPointId: string; label: string };

const PV_STRING_CONFIG_BY_DEVICE_TYPE: Record<number, PvStringPointConfig[]> = {
    [INVERTER_DEVICE_TYPE]: [
        { kind: "power", pointId: "11", label: "East roof" }, // PV1 Power (W)
        { kind: "power", pointId: "12", label: "West roof" }, // PV2 Power (W)
    ],
    [ESS_INVERTER_DEVICE_TYPE]: [
        { kind: "voltage-current", voltagePointId: "13001", currentPointId: "13002", label: "East roof" }, // MPPT1
        { kind: "voltage-current", voltagePointId: "13105", currentPointId: "13106", label: "West roof" }, // MPPT2
    ],
};

const REAL_TIME_POINT_IDS = [
    POINT_SOLAR_POWER,
    POINT_DAILY_YIELD,
    POINT_LOAD_POWER,
    POINT_LOAD_POWER_EMS,
    POINT_GRID_POWER,
    POINT_GRID_POWER_EMS,
    POINT_BATTERY_POWER,
    POINT_BATTERY_POWER_EMS,
    POINT_BATTERY_LEVEL,
    POINT_BATTERY_LEVEL_EMS,
];

export class IsolarAuthError extends Error {}

type IsolarApiEnvelope<T> = {
    result_code?: string;
    result_msg?: string;
    result_data?: (T & { msg?: string }) | null;
    error?: string;
    error_description?: string;
};

function getIsolarBaseUrl(): string {
    return process.env.ISOLAR_CLOUD_URL ?? "https://gateway.isolarcloud.eu/openapi";
}

function getIsolarCredentials(): { appkey: string; accessKey: string } {
    const appkey = process.env.ISOLAR_CLOUD_APPKEY;
    const accessKey = process.env.ISOLAR_SECRET_KEY;

    if (!appkey || !accessKey) {
        throw new Error("iSolarCloud credentials are not configured on the server");
    }

    return { appkey, accessKey };
}

async function callIsolarApi<T>(
    path: string,
    accessKey: string,
    body: Record<string, unknown>,
    token?: string
): Promise<T> {
    // The User (account/password login) API family verifies identity via a
    // `token` request-body field and a `sys_code` header — unlike the OAuth2.0
    // family, it does not use an Authorization header.
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-access-key": accessKey,
        sys_code: ISOLAR_SYS_CODE,
    };

    const requestBody = token ? { ...body, token } : body;

    const response = await fetch(`${getIsolarBaseUrl()}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
    });

    const payload = (await response.json()) as IsolarApiEnvelope<T>;

    if (payload.error) {
        throw new IsolarAuthError(payload.error_description ?? payload.error);
    }

    if (!response.ok || payload.result_code !== "1" || !payload.result_data) {
        throw new IsolarAuthError(payload.result_data?.msg ?? payload.result_msg ?? "iSolarCloud request failed");
    }

    return payload.result_data;
}

type IsolarLoginResult = {
    token?: string;
    msg?: string;
};

export async function loginToIsolarCloud(userAccount: string, userPassword: string): Promise<string> {
    const { appkey, accessKey } = getIsolarCredentials();

    const data = await callIsolarApi<IsolarLoginResult>(ISOLAR_LOGIN_PATH, accessKey, {
        appkey,
        user_account: userAccount,
        user_password: userPassword,
        sys_code: ISOLAR_SYS_CODE,
    });

    if (!data.token) {
        throw new IsolarAuthError(data.msg ?? "Invalid iSolarCloud credentials");
    }

    return data.token;
}

type IsolarStationListResult = {
    pageList?: Array<{ ps_id: number | string }>;
};

export async function queryFirstPowerStationId(token: string): Promise<string> {
    const { appkey, accessKey } = getIsolarCredentials();

    const data = await callIsolarApi<IsolarStationListResult>(
        ISOLAR_QUERY_STATION_LIST_PATH,
        accessKey,
        { appkey, curPage: 1, size: 1 },
        token
    );

    const psId = data.pageList?.[0]?.ps_id;

    if (psId === undefined) {
        throw new IsolarAuthError("No iSolarCloud plants found for this account");
    }

    return String(psId);
}

export type IsolarInverterRef = {
    psKey: string;
    deviceType: number;
};

type IsolarDeviceListResult = {
    pageList?: Array<{ ps_key?: string; device_type?: number }>;
};

export async function queryFirstInverterRef(token: string, psId: string): Promise<IsolarInverterRef | undefined> {
    const { appkey, accessKey } = getIsolarCredentials();

    const data = await callIsolarApi<IsolarDeviceListResult>(
        ISOLAR_DEVICE_LIST_PATH,
        accessKey,
        { appkey, ps_id: psId, curPage: 1, size: 1, device_type_list: [INVERTER_DEVICE_TYPE, ESS_INVERTER_DEVICE_TYPE] },
        token
    );

    const device = data.pageList?.[0];

    if (!device?.ps_key || device.device_type === undefined) return undefined;

    return { psKey: device.ps_key, deviceType: device.device_type };
}

type IsolarRealTimeDataResult = {
    device_point_list?: Array<{ device_point?: Record<string, string | number> }>;
};

function toKw(watts: number | undefined): number {
    return watts === undefined ? 0 : watts / 1000;
}

function toPercent(value: number | undefined): number {
    if (value === undefined) return 0;
    // Battery SOC points have a blank unit in the docs — the same convention
    // used for PR (performance ratio) fields, which are 0-1 fractions rather
    // than 0-100 percentages. Normalize so callers always get 0-100.
    return value <= 1 ? value * 100 : value;
}

function firstDefinedNumber(...values: Array<string | number | undefined>): number | undefined {
    for (const value of values) {
        if (value === undefined || value === "") continue;
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
}

async function getPvStrings(token: string, inverter: IsolarInverterRef): Promise<IsolarPvString[]> {
    const configs = PV_STRING_CONFIG_BY_DEVICE_TYPE[inverter.deviceType];

    if (!configs) return [];

    const { appkey, accessKey } = getIsolarCredentials();
    const pointIds = configs.flatMap((config) =>
        config.kind === "power" ? [config.pointId] : [config.voltagePointId, config.currentPointId]
    );

    const data = await callIsolarApi<IsolarRealTimeDataResult>(
        ISOLAR_REAL_TIME_DATA_PATH,
        accessKey,
        { appkey, device_type: inverter.deviceType, ps_key_list: [inverter.psKey], point_id_list: pointIds },
        token
    );

    const point = data.device_point_list?.[0]?.device_point;

    if (!point) return [];

    return configs
        .map((config) => {
            if (config.kind === "power") {
                return { label: config.label, powerKw: toKw(firstDefinedNumber(point[`p${config.pointId}`])) };
            }

            const voltage = firstDefinedNumber(point[`p${config.voltagePointId}`]);
            const current = firstDefinedNumber(point[`p${config.currentPointId}`]);
            const watts = voltage !== undefined && current !== undefined ? voltage * current : undefined;

            return { label: config.label, powerKw: toKw(watts) };
        })
        .filter((pvString) => pvString.powerKw > 0);
}

export async function getSolarData(token: string, psId: string, inverter?: IsolarInverterRef): Promise<IsolarSolarData> {
    const { appkey, accessKey } = getIsolarCredentials();
    const psKey = `${psId}_${PLANT_DEVICE_TYPE}_0_0`;

    const data = await callIsolarApi<IsolarRealTimeDataResult>(
        ISOLAR_REAL_TIME_DATA_PATH,
        accessKey,
        { appkey, device_type: PLANT_DEVICE_TYPE, ps_key_list: [psKey], point_id_list: REAL_TIME_POINT_IDS },
        token
    );

    const point = data.device_point_list?.[0]?.device_point;

    if (!point) {
        throw new IsolarAuthError("No real-time data returned for this plant");
    }

    const solarPowerW = firstDefinedNumber(point[`p${POINT_SOLAR_POWER}`]);
    const dailyYieldWh = firstDefinedNumber(point[`p${POINT_DAILY_YIELD}`]);
    const loadPowerW = firstDefinedNumber(point[`p${POINT_LOAD_POWER}`], point[`p${POINT_LOAD_POWER_EMS}`]);
    const gridPowerW = firstDefinedNumber(point[`p${POINT_GRID_POWER}`], point[`p${POINT_GRID_POWER_EMS}`]);
    const batteryPowerW = firstDefinedNumber(point[`p${POINT_BATTERY_POWER}`], point[`p${POINT_BATTERY_POWER_EMS}`]);
    const batteryLevel = firstDefinedNumber(point[`p${POINT_BATTERY_LEVEL}`], point[`p${POINT_BATTERY_LEVEL_EMS}`]);

    let pvStrings: IsolarPvString[] = [];

    if (inverter) {
        try {
            pvStrings = await getPvStrings(token, inverter);
        } catch (error) {
            console.warn("Could not fetch per-string PV data:", error);
        }
    }

    // Prefer summing the per-string readings over the plant-level point: both are
    // fetched via separate iSolarCloud requests, so the plant meter can reflect a
    // slightly different instant and drift from the per-string breakdown shown in the UI.
    const solarPowerKw = pvStrings.length > 0
        ? pvStrings.reduce((sum, pvString) => sum + pvString.powerKw, 0)
        : toKw(solarPowerW);

    return {
        solarPowerKw,
        gridPowerKw: toKw(gridPowerW),
        batteryPowerKw: toKw(batteryPowerW),
        batteryLevel: toPercent(batteryLevel),
        loadPowerKw: toKw(loadPowerW),
        dailyYieldKwh: dailyYieldWh === undefined ? 0 : dailyYieldWh / 1000,
        pvStrings,
    };
}
