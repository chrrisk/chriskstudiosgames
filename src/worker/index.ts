import { Hono } from "hono";

const app = new Hono();
const DEFAULT_TRACK_ID = "3210709941";
const CATEGORY_KEYS = ["oldies", "modern", "holiday"] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];
const BASE_CATEGORY_KEYS: readonly CategoryKey[] = ["oldies", "modern"];
const HOLIDAY_CATEGORY: CategoryKey = "holiday";

const CATEGORY_DEFAULT_TRACKS: Record<CategoryKey, string> = {
	oldies: "116348656", // The Beatles - Let It Be
	modern: DEFAULT_TRACK_ID,
	holiday: "62710442", // Mariah Carey - All I Want for Christmas Is You
};

const WEEKLY_TRACK_SCHEDULE: Record<string, Partial<Record<CategoryKey, string>>> = {
};

function getActiveCategoryKeys(dateKey: string): CategoryKey[] {
	const baseKeys = [...BASE_CATEGORY_KEYS];
	if (isHolidaySeason(dateKey)) {
		return [HOLIDAY_CATEGORY, ...baseKeys];
	}
	return baseKeys;
}

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/music/search", async (c) => {
	const query = c.req.query("q");
	if (!query) {
		return jsonError("Missing query parameter", 400);
	}

	try {
		const deezerResponse = await fetch(
			`https://api.deezer.com/search/track?${new URLSearchParams({
				q: query,
				limit: "20",
			}).toString()}`,
		);

		if (!deezerResponse.ok) {
			return jsonError("Deezer search failed", deezerResponse.status);
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = (await deezerResponse.json()) as any;
		const tracks =
			data?.data
				?.map((item: any) => mapDeezerTrack(item))
				.filter((track: { name?: string | null }) => (track?.name ? !isAlternateVersion(track.name) : true)) ?? [];

		return c.json({ tracks });
	} catch (error) {
		console.error("Deezer search error", error);
		return jsonError("Unable to reach Deezer", 500);
	}
});

app.get("/api/music/weekly", async (c) => {
	try {
		const requestedDate = c.req.query("date");
		const fallbackDate = getEasternDateKey();
		const dateKey = requestedDate
			? isKnownScheduleDate(requestedDate)
				? requestedDate
				: fallbackDate
			: getCurrentWeeklyScheduleDateKey();
		const activeCategoryKeys = getActiveCategoryKeys(dateKey);
		const scheduleEntry = WEEKLY_TRACK_SCHEDULE[dateKey];
		const trackIds: Partial<Record<CategoryKey, string>> = {};
		for (const category of activeCategoryKeys) {
			trackIds[category] = scheduleEntry?.[category] ?? CATEGORY_DEFAULT_TRACKS[category];
		}

		const categoryEntries = await Promise.all(
			activeCategoryKeys.map(async (category) => {
				const id = trackIds[category];
				if (!id) {
					console.error(`Missing track id for category ${category} on ${dateKey}`);
					return [category, null] as const;
				}
				try {
					const track = await fetchDeezerTrack(id);
					return [category, track] as const;
				} catch (error) {
					console.error(`Weekly track error for ${category}`, error);
					return [category, null] as const;
				}
			}),
		);

		const categoryTracks = Object.fromEntries(categoryEntries) as Partial<Record<CategoryKey, ReturnType<typeof mapDeezerTrack> | null>>;
		const primaryTrack = categoryTracks.modern ?? categoryTracks.oldies;

		if (!primaryTrack) {
			return jsonError("Unable to load the weekly track", 502);
		}

		return c.json({
			track: primaryTrack,
			categories: categoryTracks,
			requestedDate: dateKey,
		});
	} catch (error) {
		console.error("Weekly track error", error);
		return jsonError("Unable to load the weekly track", 500);
	}
});

app.get("/api/music/archive", (c) => {
	return c.json({
		dates: getArchiveDates(),
	});
});

export default app;

function jsonError(message: string, status: number) {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: {
			"content-type": "application/json",
		},
	});
}

function getEasternDateKey() {
	const now = new Date();
	return getEasternDateKeyFromDate(now);
}

function getEasternDateKeyFromDate(value: Date) {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const parts = formatter.format(value).split("/");
	const [month, day, year] = parts;
	return `${year}-${month}-${day}`;
}

function getCurrentWeeklyScheduleDateKey() {
	const now = new Date();
	const easternNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
	const startOfWeek = new Date(easternNow);
	startOfWeek.setHours(0, 0, 0, 0);
	startOfWeek.setDate(easternNow.getDate() - easternNow.getDay());
	const weekDateKey = getEasternDateKeyFromDate(startOfWeek);
	return isKnownScheduleDate(weekDateKey) ? weekDateKey : getEasternDateKey();
}

function isHolidaySeason(dateKey: string) {
	const [, monthStr, dayStr] = dateKey.split("-");
	const month = Number(monthStr);
	const day = Number(dayStr);
	if (Number.isNaN(month) || Number.isNaN(day)) {
		return false;
	}
	return month === 12 || (month === 1 && day === 1);
}

function isKnownScheduleDate(dateKey: string) {
	return Object.prototype.hasOwnProperty.call(WEEKLY_TRACK_SCHEDULE, dateKey);
}

function getArchiveDates() {
	return Object.keys(WEEKLY_TRACK_SCHEDULE).sort();
}

function isAlternateVersion(title: string) {
	const lower = title.toLowerCase();
	const keywordPatterns = [
		"(live",
		"live version",
		"acoustic",
		"karaoke",
		"instrumental",
		"edit",
		"remix",
		"mix)",
		"mix ",
		"cover",
		"demo",
		"version",
		"wedding",
		"extended",
	];

	if (/\(([^)]*remix|live|acoustic|version|edit|karaoke|instrumental|demo|cover|extended)[^)]*\)/i.test(title)) {
		return true;
	}

	return keywordPatterns.some((keyword) => lower.includes(keyword));
}

async function fetchDeezerTrack(trackId: string) {
	const response = await fetch(`https://api.deezer.com/track/${trackId}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch track ${trackId} (${response.status})`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const data = (await response.json()) as any;
	return mapDeezerTrack(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDeezerTrack(item: any) {
	return {
		id: item.id,
		name: item.title ?? item.title_short ?? "",
		artists: item.artist?.name ?? "",
		album: item.album?.title ?? "",
		artwork: item.album?.cover_medium ?? item.album?.cover ?? null,
		previewUrl: item.preview ?? null,
		duration: item.duration ?? null,
		provider: "deezer",
		url: item.link ?? null,
	};
}
