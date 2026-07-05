import type {
    IsolarMonthlyProductionPoint,
    IsolarPvString,
    IsolarRoofPowerPoint,
    IsolarSolarData,
    IsolarStatistics,
} from "@repo/shared";

// These endpoints are the "User" (direct account/password login) API family,
// not the OAuth2.0 developer-portal API — the two use different paths and
// response shapes even where they cover the same data, and a User-login token
// is only accepted by User-family endpoints.
const ISOLAR_LOGIN_PATH = "/login";
const ISOLAR_QUERY_STATION_LIST_PATH = "/getPowerStationList";
const ISOLAR_DEVICE_LIST_PATH = "/getDeviceList";
const ISOLAR_REAL_TIME_DATA_PATH = "/getDeviceRealTimeData";
// Historical measuring-point data bucketed by day/month/year for devices of one type.
// Returns yield in Wh / power in W. Used by the Statistics page.
const ISOLAR_DAY_MONTH_YEAR_PATH = "/getDevicePointsDayMonthYearDataList";
// Minute-level measuring-point time series (max 3-hour window per call). Used for the
// intraday per-roof power chart.
const ISOLAR_MINUTE_DATA_PATH = "/getDevicePointMinuteDataList";
const ISOLAR_SYS_CODE = "901";
const ISOLAR_LANG = "_de_DE";

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
export const ISOLAR_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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

// Installations with no separate plant-level smart-meter device don't populate
// POINT_GRID_POWER/_EMS at all (neither at plant nor inverter level). Their grid
// interaction is instead split into two unsigned device-level (Common Energy Storage
// Inverter) points, which we net into a single signed value matching the app's
// existing "positive = export" convention.
const POINT_FEED_IN_POWER = "13121"; // Feed-in (export) Power (W), device-level
const POINT_PURCHASED_POWER = "13149"; // Purchased (import) Power (W), device-level

// Residential ESS/hybrid inverters (device_type 14) expose a full, self-consistent live
// snapshot on the inverter device itself — every point below shares one timestamp, so the
// derived energy flow balances and tracks the iSolarCloud app. (The plant "device" only
// returns solar/load/SOC for this install and never battery/grid power, and stitching
// separate plant + per-string + fallback calls yields an out-of-sync flow that neither
// balances nor matches the app.) Grid is netted from POINT_FEED_IN_POWER − POINT_PURCHASED_POWER.
const POINT_ESS_PV_POWER = "13003"; // Total PV (solar) power (W)
const POINT_ESS_DAILY_YIELD = "13112"; // Daily PV yield (Wh)
const POINT_ESS_BATTERY_POWER = "13126"; // Battery power (W), positive = charging
const POINT_ESS_SOC = "13141"; // Battery level / SOC (0-1 fraction)

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

    const requestBody = { ...body, lang: ISOLAR_LANG, ...(token ? { token } : {}) };

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
        const message = payload.result_data?.msg ?? payload.result_msg ?? "iSolarCloud request failed";
        // Surface the iSolarCloud result_code — e.g. "009" = interface not authorized for this appkey,
        // "E900" = token expired — so failures like this are diagnosable from the log.
        throw new IsolarAuthError(payload.result_code ? `${message} (result_code ${payload.result_code})` : message);
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

// Some hybrid/ESS installations have no separate plant-level smart-meter device, so grid
// and battery active power never appear on the plant's own real-time data — only on the
// inverter device itself. This is queried as a fallback whenever the plant-level lookup
// comes up empty for either point.
async function getInverterGridAndBatteryPower(
    token: string,
    inverter: IsolarInverterRef
): Promise<{ gridPowerW: number | undefined; batteryPowerW: number | undefined }> {
    const { appkey, accessKey } = getIsolarCredentials();

    const data = await callIsolarApi<IsolarRealTimeDataResult>(
        ISOLAR_REAL_TIME_DATA_PATH,
        accessKey,
        {
            appkey,
            device_type: inverter.deviceType,
            ps_key_list: [inverter.psKey],
            point_id_list: [
                POINT_GRID_POWER,
                POINT_GRID_POWER_EMS,
                POINT_BATTERY_POWER,
                POINT_BATTERY_POWER_EMS,
                POINT_FEED_IN_POWER,
                POINT_PURCHASED_POWER,
            ],
        },
        token
    );

    const point = data.device_point_list?.[0]?.device_point;

    if (!point) return { gridPowerW: undefined, batteryPowerW: undefined };

    let gridPowerW = firstDefinedNumber(point[`p${POINT_GRID_POWER}`], point[`p${POINT_GRID_POWER_EMS}`]);

    if (gridPowerW === undefined) {
        const feedInPowerW = firstDefinedNumber(point[`p${POINT_FEED_IN_POWER}`]);
        const purchasedPowerW = firstDefinedNumber(point[`p${POINT_PURCHASED_POWER}`]);

        if (feedInPowerW !== undefined || purchasedPowerW !== undefined) {
            gridPowerW = (feedInPowerW ?? 0) - (purchasedPowerW ?? 0);
        }
    }

    return {
        gridPowerW,
        batteryPowerW: firstDefinedNumber(point[`p${POINT_BATTERY_POWER}`], point[`p${POINT_BATTERY_POWER_EMS}`]),
    };
}

// Read the full live snapshot from a residential ESS/hybrid inverter in ONE request, so
// every value shares a timestamp and the energy flow balances (matching how the iSolarCloud
// app presents it). House consumption is *derived* from that balanced flow rather than read
// from the load meter, whose reading is sampled independently and can briefly desync (we saw
// it spike to ~2.7 kW while the true house draw was ~0.6 kW).
async function getEssSolarData(token: string, inverter: IsolarInverterRef): Promise<IsolarSolarData> {
    const { appkey, accessKey } = getIsolarCredentials();
    const stringConfigs = PV_STRING_CONFIG_BY_DEVICE_TYPE[inverter.deviceType] ?? [];

    const stringPointIds = stringConfigs.flatMap((config) =>
        config.kind === "power" ? [config.pointId] : [config.voltagePointId, config.currentPointId]
    );

    const pointIds = Array.from(
        new Set([
            POINT_ESS_PV_POWER,
            POINT_ESS_DAILY_YIELD,
            POINT_FEED_IN_POWER,
            POINT_PURCHASED_POWER,
            POINT_ESS_BATTERY_POWER,
            POINT_ESS_SOC,
            ...stringPointIds,
        ])
    );

    const data = await callIsolarApi<IsolarRealTimeDataResult>(
        ISOLAR_REAL_TIME_DATA_PATH,
        accessKey,
        { appkey, device_type: inverter.deviceType, ps_key_list: [inverter.psKey], point_id_list: pointIds },
        token
    );

    const point = data.device_point_list?.[0]?.device_point;

    if (!point) {
        throw new IsolarAuthError("No real-time data returned for this inverter");
    }

    const solarPowerKw = toKw(firstDefinedNumber(point[`p${POINT_ESS_PV_POWER}`]));
    const dailyYieldWh = firstDefinedNumber(point[`p${POINT_ESS_DAILY_YIELD}`]);
    const feedInW = firstDefinedNumber(point[`p${POINT_FEED_IN_POWER}`]) ?? 0;
    const purchasedW = firstDefinedNumber(point[`p${POINT_PURCHASED_POWER}`]) ?? 0;
    const gridPowerKw = toKw(feedInW - purchasedW); // positive = export, negative = import
    const batteryPowerKw = toKw(firstDefinedNumber(point[`p${POINT_ESS_BATTERY_POWER}`])); // positive = charging
    const batteryLevel = toPercent(firstDefinedNumber(point[`p${POINT_ESS_SOC}`]));

    // Per-string DC power for the roof breakdown (P = V × I for MPPT-only ESS inverters),
    // scaled to the inverter's own PV-power total so the breakdown stays consistent with the
    // headline figure while preserving each roof's share.
    const rawStrings = stringConfigs
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

    const rawStringSumKw = rawStrings.reduce((sum, pvString) => sum + pvString.powerKw, 0);
    const pvStrings =
        rawStringSumKw > 0 && solarPowerKw > 0
            ? rawStrings.map((pvString) => ({ ...pvString, powerKw: pvString.powerKw * (solarPowerKw / rawStringSumKw) }))
            : rawStrings;

    // Derive house consumption from the balanced flow: load = solar − gridExport − batteryCharge
    // (grid positive = export, battery positive = charging). Clamp away sub-watt negatives from rounding.
    const loadPowerKw = Math.max(0, solarPowerKw - gridPowerKw - batteryPowerKw);

    return {
        solarPowerKw,
        gridPowerKw,
        batteryPowerKw,
        batteryLevel,
        loadPowerKw,
        dailyYieldKwh: dailyYieldWh === undefined ? 0 : dailyYieldWh / 1000,
        pvStrings,
    };
}

export async function getSolarData(token: string, psId: string, inverter?: IsolarInverterRef): Promise<IsolarSolarData> {
    // Residential ESS/hybrid inverters expose a complete, single-timestamp snapshot on the
    // inverter device; read that directly so the flow is coherent (see getEssSolarData).
    if (inverter?.deviceType === ESS_INVERTER_DEVICE_TYPE) {
        return getEssSolarData(token, inverter);
    }

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
    const batteryLevel = firstDefinedNumber(point[`p${POINT_BATTERY_LEVEL}`], point[`p${POINT_BATTERY_LEVEL_EMS}`]);

    let gridPowerW = firstDefinedNumber(point[`p${POINT_GRID_POWER}`], point[`p${POINT_GRID_POWER_EMS}`]);
    let batteryPowerW = firstDefinedNumber(point[`p${POINT_BATTERY_POWER}`], point[`p${POINT_BATTERY_POWER_EMS}`]);

    if ((gridPowerW === undefined || batteryPowerW === undefined) && inverter) {
        try {
            const inverterPower = await getInverterGridAndBatteryPower(token, inverter);
            gridPowerW ??= inverterPower.gridPowerW;
            batteryPowerW ??= inverterPower.batteryPowerW;
        } catch (error) {
            console.warn("Could not fetch inverter-level grid/battery power:", error);
        }
    }

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

// ---------------------------------------------------------------------------
// Historical production (Statistics page) — /getDevicePointsDayMonthYearDataList
//
// Request (per the iSolarCloud OpenAPI doc):
//   ps_key_list  – device ps_keys of ONE device type (we use the plant "device", 11)
//   data_point   – comma-separated "p"-prefixed measuring point IDs
//   query_type   – "1"=daily, "2"=monthly, "3"=annual
//   data_type    – "1"=mean "2"=peak "3"=trough "4"=total (total only valid month/year)
//   start_time / end_time – format depends on query_type: day yyyyMMdd, month yyyyMM
//   order        – 0=chronological
// Response:
//   result_data[ps_key][point] = [ { "<data_type>": "<value>", time_stamp: "..." } ]
//   Values are in Wh for yield points. Today's data is never returned.
// A parse/auth failure yields an empty series and the frontend falls back to sample data.
// ---------------------------------------------------------------------------

// "Daily Yield of Plant" (Wh) on the plant "device" — the same point the real-time
// path reads for today's yield; historical day/month buckets aggregate it too.
const YIELD_POINT = `p${POINT_DAILY_YIELD}`;

const QUERY_TYPE_DAILY = "1";
const QUERY_TYPE_MONTHLY = "2";
const DATA_TYPE_TOTAL = "4"; // per-month: summed yield across the month

const MONTHS_WINDOW = 12;

// result_data is keyed by ps_key, then by point id, to a list of time-stamped buckets.
type DayMonthYearResult = Record<string, Record<string, Array<Record<string, string>>>>;

function yyyymm(date: Date): string {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function yyyymmdd(date: Date): string {
    return `${yyyymm(date)}${String(date.getDate()).padStart(2, "0")}`;
}

function isoMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Fetch plant PV yield bucketed by day or month, returned as a map from the raw
 * iSolarCloud `time_stamp` (yyyyMMdd or yyyyMM) to kWh.
 */
async function fetchYieldBuckets(
    token: string,
    psId: string,
    queryType: string,
    dataType: string,
    startTime: string,
    endTime: string
): Promise<Map<string, number>> {
    const { appkey, accessKey } = getIsolarCredentials();
    const psKey = `${psId}_${PLANT_DEVICE_TYPE}_0_0`;
    const granularity = queryType === QUERY_TYPE_DAILY ? "daily" : "monthly";
    const buckets = new Map<string, number>();

    try {
        const result = await callIsolarApi<DayMonthYearResult>(
            ISOLAR_DAY_MONTH_YEAR_PATH,
            accessKey,
            {
                appkey,
                ps_key_list: [psKey],
                data_point: YIELD_POINT,
                data_type: dataType,
                query_type: queryType,
                start_time: startTime,
                end_time: endTime,
                order: 0,
            },
            token
        );

        const series = result[psKey]?.[YIELD_POINT];

        if (!series) {
            console.warn(
                `iSolarCloud ${granularity} yield returned no series for ${YIELD_POINT}; ps_keys: ${Object.keys(result).join(", ")}`
            );
            return buckets;
        }

        for (const entry of series) {
            const yieldWh = firstDefinedNumber(entry[dataType]);
            if (entry.time_stamp && yieldWh !== undefined) {
                buckets.set(entry.time_stamp, yieldWh / 1000);
            }
        }
    } catch (error) {
        console.warn(`Could not fetch iSolarCloud ${granularity} yield:`, error);
    }

    return buckets;
}

// ---------------------------------------------------------------------------
// Intraday per-roof power (Statistics page) — /getDevicePointMinuteDataList
//
// The minute endpoint caps each request at a 3-hour window and never returns today's
// data, so we pull the most recent full day (yesterday) in eight 3-hour chunks and
// derive per-roof power from the same string config the real-time path uses (direct
// power point, or P = V * I for MPPT-only ESS inverters).
// ---------------------------------------------------------------------------

const ROOF_HISTORY_CHUNK_HOURS = 3;
const ROOF_HISTORY_MINUTE_INTERVAL = "15";

// result_data is keyed by ps_key to a list of time-stamped point readings.
type MinuteDataResult = Record<string, Array<Record<string, string>>>;

function yyyymmddhhmmss(date: Date): string {
    return `${yyyymmdd(date)}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(date.getSeconds()).padStart(2, "0")}`;
}

/** "20211122081500" → "2021-11-22T08:15:00" (kept in the plant's local wall-clock, no tz shift). */
function isoFromStamp(stamp: string): string {
    return `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(8, 10)}:${stamp.slice(10, 12)}:${stamp.slice(12, 14)}`;
}

/** Power (kW) for one PV string from a minute-data reading — direct point, or P = V * I. */
function roofReadingKw(config: PvStringPointConfig, reading: Record<string, string>): number {
    if (config.kind === "power") {
        return toKw(firstDefinedNumber(reading[`p${config.pointId}`]));
    }
    const voltage = firstDefinedNumber(reading[`p${config.voltagePointId}`]);
    const current = firstDefinedNumber(reading[`p${config.currentPointId}`]);
    return toKw(voltage !== undefined && current !== undefined ? voltage * current : undefined);
}

async function getRoofPowerHistory(
    token: string,
    inverter: IsolarInverterRef | undefined,
    reference: Date
): Promise<IsolarRoofPowerPoint[]> {
    const configs = inverter ? PV_STRING_CONFIG_BY_DEVICE_TYPE[inverter.deviceType] : undefined;
    const [eastConfig, westConfig] = configs ?? [];

    if (!inverter || !eastConfig || !westConfig) return [];

    const { appkey, accessKey } = getIsolarCredentials();
    const points = Array.from(
        new Set(
            [eastConfig, westConfig].flatMap((config) =>
                config.kind === "power" ? [config.pointId] : [config.voltagePointId, config.currentPointId]
            )
        )
    )
        .map((id) => `p${id}`)
        .join(",");

    // Yesterday, split into 3-hour windows (the endpoint's max range, and today is excluded).
    const dayStart = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - 1, 0, 0, 0);
    const chunks: Array<{ start: Date; end: Date }> = [];
    for (let hour = 0; hour < 24; hour += ROOF_HISTORY_CHUNK_HOURS) {
        const start = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), hour, 0, 0);
        const end = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), hour + ROOF_HISTORY_CHUNK_HOURS, 0, -1); // …:59:59
        chunks.push({ start, end });
    }

    const chunkSeries = await Promise.all(
        chunks.map(async ({ start, end }) => {
            try {
                const result = await callIsolarApi<MinuteDataResult>(
                    ISOLAR_MINUTE_DATA_PATH,
                    accessKey,
                    {
                        appkey,
                        ps_key_list: [inverter.psKey],
                        points,
                        minute_interval: ROOF_HISTORY_MINUTE_INTERVAL,
                        start_time_stamp: yyyymmddhhmmss(start),
                        end_time_stamp: yyyymmddhhmmss(end),
                    },
                    token
                );
                return result[inverter.psKey] ?? [];
            } catch (error) {
                console.warn("Could not fetch iSolarCloud roof-power chunk:", error);
                return [];
            }
        })
    );

    return chunkSeries
        .flat()
        .flatMap((reading) => {
            const stamp = reading.time_stamp;
            if (!stamp) return [];
            return [
                {
                    time: isoFromStamp(stamp),
                    east: roofReadingKw(eastConfig, reading),
                    west: roofReadingKw(westConfig, reading),
                },
            ];
        })
        .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Historical PV data for the Statistics page: total yield per month for the last 12
 * months, and per-roof power across the most recent full day. Everything ends yesterday
 * (the historical endpoints never return today). Missing buckets simply don't appear;
 * the frontend fills gaps with sample data.
 */
export async function getSolarStatistics(
    token: string,
    psId: string,
    inverter?: IsolarInverterRef,
    reference: Date = new Date()
): Promise<IsolarStatistics> {
    const monthStart = new Date(reference.getFullYear(), reference.getMonth() - (MONTHS_WINDOW - 1), 1);

    const [monthlyBuckets, roofPower] = await Promise.all([
        fetchYieldBuckets(token, psId, QUERY_TYPE_MONTHLY, DATA_TYPE_TOTAL, yyyymm(monthStart), yyyymm(reference)),
        getRoofPowerHistory(token, inverter, reference),
    ]);

    const monthly: IsolarMonthlyProductionPoint[] = [];
    for (let i = MONTHS_WINDOW - 1; i >= 0; i--) {
        const date = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
        const productionKwh = monthlyBuckets.get(yyyymm(date));
        if (productionKwh !== undefined) monthly.push({ month: isoMonth(date), productionKwh });
    }

    return { monthly, roofPower };
}
