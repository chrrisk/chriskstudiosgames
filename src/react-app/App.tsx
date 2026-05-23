import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import clickSound from "./assets/click-soft.wav";
import playLogo from "./assets/play-logo.png";

const secretPath = "/songgame";
const colorSecretPath = "/colorgame";
const defaultFavicon =
	"data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20100%20100%27%3E%3Ctext%20y%3D%27.9em%27%20font-size%3D%2790%27%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E";
const labFavicon =
	"data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20100%20100%27%3E%3Ctext%20y%3D%27.9em%27%20font-size%3D%2790%27%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E";

type TrackResult = {
	id: string;
	name: string;
	artists: string;
	album: string;
	artwork?: string | null;
	previewUrl?: string | null;
	duration?: number | null;
	provider?: string;
	url?: string | null;
};

type GuessEntry = { track: TrackResult; correct: boolean; timestamp: number };

const ALL_CATEGORY_KEYS = ["oldies", "modern", "holiday"] as const;
type CategoryKey = (typeof ALL_CATEGORY_KEYS)[number];
const DEFAULT_CATEGORY_ORDER: CategoryKey[] = ["oldies", "modern"];
const HOLIDAY_CATEGORY: CategoryKey = "holiday";

const CATEGORY_LABELS: Record<CategoryKey, { title: string; description: string; emoji: string }> = {
	oldies: { title: "Oldies but Goodies", description: "Classic throwbacks", emoji: "📼" },
	modern: { title: "2000s & Newer", description: "Fresh favorites", emoji: "🎧" },
	holiday: { title: "Holiday Classics", description: "Seasonal favorites", emoji: "🎄" },
};

type CategoryStatus = "idle" | "success" | "failure";
type CompletionModalState = { category: CategoryKey; status: "success" | "failure"; nextCategory?: CategoryKey };

type DailyTrackResponse = {
	track?: TrackResult | null;
	categories?: Partial<Record<CategoryKey, TrackResult | null>>;
	error?: string;
};

const createInitialRevealSteps = () =>
	({ oldies: 0, modern: 0, holiday: 0 } satisfies Record<CategoryKey, number>);
const createInitialGuessHistories = () =>
	({ oldies: [], modern: [], holiday: [] } satisfies Record<CategoryKey, GuessEntry[]>);
const createInitialWinners = () =>
	({ oldies: false, modern: false, holiday: false } satisfies Record<CategoryKey, boolean>);
const createInitialFailures = () =>
	({ oldies: false, modern: false, holiday: false } satisfies Record<CategoryKey, boolean>);
const createInitialSolvedAt = () =>
	({ oldies: null, modern: null, holiday: null } satisfies Record<CategoryKey, number | null>);
const createInitialSelectedTracks = () =>
	({ oldies: null, modern: null, holiday: null } satisfies Record<CategoryKey, TrackResult | null>);
const createInitialQueries = () =>
	({ oldies: "", modern: "", holiday: "" } satisfies Record<CategoryKey, string>);
const createInitialTrackResults = () =>
	({ oldies: [], modern: [], holiday: [] } satisfies Record<CategoryKey, TrackResult[]>);

const MAINTENANCE_MODE = false;

type StoredState = {
	dateKey?: string;
	activeCategory?: CategoryKey;
	revealSteps?: Partial<Record<CategoryKey, number>>;
	guessHistories?: Partial<Record<CategoryKey, GuessEntry[]>>;
	winners?: Partial<Record<CategoryKey, boolean>>;
	failures?: Partial<Record<CategoryKey, boolean>>;
	solvedAtMap?: Partial<Record<CategoryKey, number | null>>;
	selectedTracks?: Partial<Record<CategoryKey, TrackResult | null>>;
};

function mergeCategoryMap<T>(incoming: Partial<Record<CategoryKey, T>> | undefined, fallback: Record<CategoryKey, T>) {
	return ALL_CATEGORY_KEYS.reduce((acc, key) => {
		acc[key] = (incoming?.[key] ?? fallback[key]) as T;
		return acc;
	}, {} as Record<CategoryKey, T>);
}

const snippetDurations = [0.5, 1, 2, 5, 10, 15];
const FULL_REVEAL_DURATION = 30;
const STORAGE_KEY = "songgame-daily-state";

const games: Array<{ title: string; tagline: string; actionLabel: string; path: string | null }> = [
	{ title: "songgame", tagline: "Daily guess the song challenge.", actionLabel: "Play songgame", path: secretPath },
	{ title: "colorgame", tagline: "Memorize a color and recreate it from memory.", actionLabel: "Play colorgame", path: colorSecretPath },
];

function App() {
	if (MAINTENANCE_MODE) {
		return (
			<div
				className="play-shell"
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "radial-gradient(circle at 20% 20%, #1f2937, #0f172a 55%)",
					color: "#f8fafc",
					textAlign: "center",
					padding: "3rem 1.5rem",
				}}
			>
				<div style={{ maxWidth: 640, width: "100%" }}>
					<p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>play.chriskstudios</p>
					<h1 style={{ fontSize: "2.75rem", margin: "0.5rem 0 0.75rem" }}>Down for maintenance</h1>
					<p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
						We are polishing the games and will be back soon. Thanks for your patience.
					</p>
				</div>
			</div>
		);
	}

	const playClick = useClickSound();
	const isSecretRoute =
		typeof window !== "undefined" &&
		window.location.pathname.replace(/\/$/, "") === secretPath.replace(/\/$/, "");
	const isColorRoute =
		typeof window !== "undefined" &&
		window.location.pathname.replace(/\/$/, "") === colorSecretPath.replace(/\/$/, "");

	useEffect(() => {
		if (typeof document === "undefined") return;
		const href = isSecretRoute ? labFavicon : defaultFavicon;
		let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
		if (!link) {
			link = document.createElement("link");
			link.rel = "icon";
			link.type = "image/svg+xml";
			document.head.appendChild(link);
		}
		link.href = href;
	}, [isSecretRoute]);

	if (isSecretRoute) {
		return <SongGameLab />;
	}
	if (isColorRoute) {
		return <ColorGame />;
	}

	return (
		<div className="play-shell">
			<header className="play-header">
				<a className="brand" href="/" onClick={playClick}>
					<img src={playLogo} alt="ChrisK Studios logo" />
					<div>
						<p className="brand-label">ChrisK Studios</p>
						<h1>play.chriskstudios.com</h1>
					</div>
				</a>
			</header>
			<main className="doc">
				<section className="doc-card games-card" id="songgame">
					<div className="games-header">
						<div>
							<h2>Games by ChrisK</h2>
						</div>
						<button className="ghost-btn" type="button" disabled>
							More coming soon
						</button>
					</div>
					<div className="games-grid">
						{games.map((game) => (
							<article className="game-card" key={game.title}>
								<div>
									<h3>{game.title}</h3>
									<p>{game.tagline}</p>
								</div>
								{game.path ? (
									<a
										className="primary-btn modal-link"
										href={game.path}
										onClick={playClick}
									>
										{game.actionLabel}
									</a>
								) : (
									<button className="ghost-btn" type="button" disabled>
										{game.actionLabel}
									</button>
								)}
							</article>
						))}
					</div>
				</section>
			</main>
			<footer className="play-footer">
				<p>© ChrisK Studios 2026</p>
			</footer>
		</div>
	);
}

export default App;

function SongGameLab() {
	const playClick = useClickSound();
	const [categoryQueries, setCategoryQueries] = useState<Record<CategoryKey, string>>(createInitialQueries);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [isResultsHovered, setIsResultsHovered] = useState(false);
	const [categoryTracks, setCategoryTracks] = useState<Record<CategoryKey, TrackResult[]>>(createInitialTrackResults);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [selectedTracks, setSelectedTracks] = useState<Record<CategoryKey, TrackResult | null>>(createInitialSelectedTracks);
	const [dailyCategories, setDailyCategories] = useState<Partial<Record<CategoryKey, TrackResult | null>>>({});
	const [dateKey, setDateKey] = useState(() => getEasternDateKey());
	const [availableCategories, setAvailableCategories] = useState<CategoryKey[]>(() => getActiveCategoryKeysForDate(getEasternDateKey()));
	const [activeCategory, setActiveCategory] = useState<CategoryKey>("oldies");
	const [gameMessage, setGameMessage] = useState<string | null>(null);
	const [revealSteps, setRevealSteps] = useState<Record<CategoryKey, number>>(createInitialRevealSteps);
	const [isPlayingSnippet, setIsPlayingSnippet] = useState(false);
	const [volume, setVolume] = useState(0.8);
	const [guessHistories, setGuessHistories] = useState<Record<CategoryKey, GuessEntry[]>>(createInitialGuessHistories);
	const [winners, setWinners] = useState<Record<CategoryKey, boolean>>(createInitialWinners);
	const [failures, setFailures] = useState<Record<CategoryKey, boolean>>(createInitialFailures);
	const [showResultsModal, setShowResultsModal] = useState(false);
	const [completionModal, setCompletionModal] = useState<CompletionModalState | null>(null);
	const [shareFeedback, setShareFeedback] = useState<{ message: string; context: "floating" | "modal" } | null>(null);
	const [isHydrated, setIsHydrated] = useState(false);
	const [isArchiveOpen, setIsArchiveOpen] = useState(false);
	const [archiveDates, setArchiveDates] = useState<string[]>([]);
	const [archiveDateKey, setArchiveDateKey] = useState<string | null>(null);
	const [archiveLoading, setArchiveLoading] = useState(false);
	const [archiveError, setArchiveError] = useState<string | null>(null);
	const [archiveCategories, setArchiveCategories] = useState<Partial<Record<CategoryKey, TrackResult | null>>>({});
	const [archiveActiveCategory, setArchiveActiveCategory] = useState<CategoryKey>("oldies");
	const [solvedAtMap, setSolvedAtMap] = useState<Record<CategoryKey, number | null>>(createInitialSolvedAt);
	const [resetCountdown, setResetCountdown] = useState(() => formatCountdownLabel(getMillisecondsUntilNextEasternReset()));
	const [isVolumeOpen, setIsVolumeOpen] = useState(false);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const archiveAudioRef = useRef<HTMLAudioElement | null>(null);
	const snippetTimeoutRef = useRef<number | null>(null);
	const shareFeedbackTimeoutRef = useRef<number | null>(null);

	const currentTrack = dailyCategories[activeCategory] ?? null;
	const archiveTrack = archiveCategories[archiveActiveCategory] ?? null;
	const answerTrack = currentTrack;
	const revealStep = revealSteps[activeCategory] ?? 0;
	const guessHistory = guessHistories[activeCategory] ?? [];
	const isWinner = winners[activeCategory] ?? false;
	const selectedTrack = selectedTracks[activeCategory] ?? null;
	const isFailed = failures[activeCategory] ?? false;
	const allCategoriesFinished = availableCategories.every((key) => winners[key] || failures[key]);
	const query = categoryQueries[activeCategory];
	const tracks = categoryTracks[activeCategory];

	const snippetIndex = Math.min(revealStep, snippetDurations.length - 1);
	const currentSnippetLength = snippetDurations[snippetIndex];
	const totalSnippetLength = snippetDurations[snippetDurations.length - 1];
	const isAtMaxReveal = snippetIndex === snippetDurations.length - 1;
	const snippetSegments = snippetDurations.map((duration, index) => {
		const previousDuration = index === 0 ? 0 : snippetDurations[index - 1];
		const segmentLength = duration - previousDuration;
		const isUnlocked = index <= snippetIndex;
		const isCurrent = index === snippetIndex;
		const isNext = !isAtMaxReveal && index === snippetIndex + 1;
		const additionLabel =
			index === 0 ? formatSecondsLabel(duration) : formatSecondsLabel(segmentLength);
		const totalLabel = formatSecondsLabel(duration);
		const label =
			index === 0
				? `${totalLabel}s unlocked`
				: `Unlocks +${additionLabel}s (total ${totalLabel}s)`;
		return {
			index,
			segmentLength,
			label,
			isUnlocked,
			isCurrent,
			isNext,
		};
	});
	const hasQuery = query.trim().length > 0;
	const showResults = hasQuery && (isSearchFocused || isResultsHovered);
	const archiveMonths = groupDatesByMonth(archiveDates);

	const getCategorySummaries = () =>
		availableCategories.map((key) => {
			const { title, emoji } = CATEGORY_LABELS[key];
			if (winners[key]) {
				const solvedTime = solvedAtMap[key];
				const timeLabel = solvedTime !== null ? `${formatSecondsLabel(solvedTime)}s` : "??s";
				return {
					key,
					status: "success" as CategoryStatus,
					shareLine: `${emoji} **${title}** — solved in ${timeLabel}`,
					displayLine: `${emoji} ${title}: solved in ${timeLabel}`,
				};
			}
			if (failures[key]) {
				return {
					key,
					status: "failure" as CategoryStatus,
					shareLine: `${emoji} **${title}** — gave up`,
					displayLine: `${emoji} ${title}: gave up`,
				};
			}
			return {
				key,
				status: "idle" as CategoryStatus,
				shareLine: `${emoji} **${title}** — in progress`,
				displayLine: `${emoji} ${title}: in progress`,
			};
		});

	useEffect(() => {
		const categoryKey = activeCategory;
		const controller = new AbortController();
		const timeoutId = window.setTimeout(async () => {
			const trimmed = query.trim();
			if (!trimmed) {
				setCategoryTracks((prev) => ({ ...prev, [categoryKey]: [] }));
				setSelectedTracks((prev) => ({ ...prev, [categoryKey]: null }));
				setIsSearching(false);
				setSearchError(null);
				return;
			}

			setIsSearching(true);
			setSearchError(null);
			try {
				const response = await fetch(`/api/music/search?q=${encodeURIComponent(trimmed)}`, {
					signal: controller.signal,
				});
				const data = (await response.json()) as { tracks?: TrackResult[]; error?: string };
				if (!response.ok) throw new Error(data.error ?? "Search failed");
				setCategoryTracks((prev) => ({ ...prev, [categoryKey]: data.tracks ?? [] }));
			} catch (err) {
				if (controller.signal.aborted) return;
				setSearchError(err instanceof Error ? err.message : "Search failed");
				setCategoryTracks((prev) => ({ ...prev, [categoryKey]: [] }));
			} finally {
				if (!controller.signal.aborted) {
					setIsSearching(false);
				}
			}
		}, 350);

		return () => {
			controller.abort();
			clearTimeout(timeoutId);
		};
	}, [query, activeCategory]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			setIsHydrated(true);
			return;
		}
	try {
		const data = JSON.parse(raw) as StoredState;
		const todaysKeys = getActiveCategoryKeysForDate(dateKey);
		setAvailableCategories(todaysKeys);
		if (data.dateKey === dateKey) {
			const storedActive = data.activeCategory && todaysKeys.includes(data.activeCategory) ? data.activeCategory : todaysKeys[0];
			setActiveCategory(storedActive ?? "oldies");
			setRevealSteps(mergeCategoryMap(data.revealSteps, createInitialRevealSteps()));
			setGuessHistories(mergeCategoryMap(data.guessHistories, createInitialGuessHistories()));
			const mergedWinners = mergeCategoryMap(data.winners, createInitialWinners());
			const mergedFailures = mergeCategoryMap(data.failures, createInitialFailures());
			setWinners(mergedWinners);
			setFailures(mergedFailures);
			setSolvedAtMap(mergeCategoryMap(data.solvedAtMap, createInitialSolvedAt()));
			setSelectedTracks(mergeCategoryMap(data.selectedTracks, createInitialSelectedTracks()));
			if (todaysKeys.every((key) => mergedWinners[key] || mergedFailures[key])) {
				setShowResultsModal(true);
			}
		} else {
			window.localStorage.removeItem(STORAGE_KEY);
		}
		} catch {
			window.localStorage.removeItem(STORAGE_KEY);
		} finally {
			setIsHydrated(true);
		}
	}, [dateKey]);

	useEffect(() => {
		if (!isHydrated || typeof window === "undefined") return;
		const payload: StoredState = {
			dateKey,
			activeCategory,
			revealSteps,
			guessHistories,
			winners,
			failures,
			solvedAtMap,
			selectedTracks,
		};
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
	}, [dateKey, activeCategory, revealSteps, guessHistories, winners, failures, solvedAtMap, selectedTracks, isHydrated]);

	useEffect(() => {
		if (!isArchiveOpen || archiveDates.length > 0) return;
		const controller = new AbortController();
		const loadArchiveDates = async () => {
			try {
				const response = await fetch("/api/music/archive", { signal: controller.signal });
				const data = (await response.json()) as { dates?: string[]; error?: string };
				if (!response.ok) throw new Error(data.error ?? "Failed to load archive");
				const dates = data.dates ?? [];
				setArchiveDates(dates);
				setArchiveDateKey((prev) => prev ?? dates[0] ?? null);
			} catch (error) {
				if (controller.signal.aborted) return;
				setArchiveError(error instanceof Error ? error.message : "Failed to load archive");
			}
		};
		void loadArchiveDates();
		return () => controller.abort();
	}, [isArchiveOpen, archiveDates.length]);

	useEffect(() => {
		if (!isArchiveOpen || !archiveDateKey) return;
		const controller = new AbortController();
		const loadArchiveTrack = async () => {
			setArchiveLoading(true);
			setArchiveError(null);
			try {
				const response = await fetch(`/api/music/daily?date=${encodeURIComponent(archiveDateKey)}`, {
					signal: controller.signal,
				});
				const data = (await response.json()) as DailyTrackResponse;
				if (!response.ok) throw new Error(data.error ?? "Failed to load archive song");
				const categories: Partial<Record<CategoryKey, TrackResult | null>> = {};
				if (data.categories) {
					for (const key of ALL_CATEGORY_KEYS) {
						if (key in data.categories) {
							categories[key] = data.categories[key] ?? null;
						}
					}
				}
				const nextActive = categories.oldies ? "oldies" : categories.modern ? "modern" : categories.holiday ? "holiday" : "oldies";
				setArchiveCategories(categories);
				setArchiveActiveCategory(nextActive);
			} catch (error) {
				if (controller.signal.aborted) return;
				setArchiveError(error instanceof Error ? error.message : "Failed to load archive song");
			} finally {
				if (!controller.signal.aborted) {
					setArchiveLoading(false);
				}
			}
		};
		void loadArchiveTrack();
		return () => controller.abort();
	}, [isArchiveOpen, archiveDateKey]);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			const newKey = getEasternDateKey();
			if (newKey !== dateKey) {
				resetGameState(newKey);
			}
		}, 60000);
		return () => window.clearInterval(intervalId);
	}, [dateKey]);

	useEffect(() => {
		const updateCountdown = () => {
			setResetCountdown(formatCountdownLabel(getMillisecondsUntilNextEasternReset()));
		};
		updateCountdown();
		const countdownId = window.setInterval(updateCountdown, 1000);
		return () => window.clearInterval(countdownId);
	}, []);

	useEffect(() => {
		const fetchDaily = async () => {
			try {
				const response = await fetch("/api/music/daily");
				const data = (await response.json()) as DailyTrackResponse;
				if (!response.ok) throw new Error(data.error ?? "Failed to load the daily song");
				const fallbackTrack = data.track ?? null;
				const categories: Partial<Record<CategoryKey, TrackResult | null>> = {};
				if (data.categories) {
					for (const key of ALL_CATEGORY_KEYS) {
						if (key in data.categories) {
							categories[key] = data.categories[key] ?? null;
						}
					}
				}
				if (!categories.oldies && fallbackTrack) categories.oldies = fallbackTrack;
				if (!categories.modern && fallbackTrack) categories.modern = fallbackTrack;
				setDailyCategories(categories);
			} catch (err) {
				setGameMessage(err instanceof Error ? err.message : "Unable to load daily song");
			}
		};
		void fetchDaily();
	}, [dateKey]);

	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.volume = volume;
		}
	}, [volume]);

	useEffect(() => {
		return () => {
			if (snippetTimeoutRef.current) {
				window.clearTimeout(snippetTimeoutRef.current);
			}
			audioRef.current?.pause();
			archiveAudioRef.current?.pause();
		};
	}, []);

useEffect(() => {
	if (snippetTimeoutRef.current) {
		window.clearTimeout(snippetTimeoutRef.current);
		snippetTimeoutRef.current = null;
	}
	audioRef.current?.pause();
	setIsPlayingSnippet(false);
	if (shareFeedbackTimeoutRef.current) {
		window.clearTimeout(shareFeedbackTimeoutRef.current);
	}
	setGameMessage(null);
}, [activeCategory]);

useEffect(() => {
	return () => {
		if (shareFeedbackTimeoutRef.current) {
			window.clearTimeout(shareFeedbackTimeoutRef.current);
		}
	};
}, []);

	const playSegment = (durationSeconds: number, options?: { suppressMissingMessage?: boolean }) => {
		if (!currentTrack?.previewUrl) {
			if (!options?.suppressMissingMessage) {
				setGameMessage("No preview available for today's track.");
			}
			return false;
		}

		const audio = audioRef.current;
		if (!audio) return false;

		audio.src = currentTrack.previewUrl;
		audio.currentTime = 0;
		audio.volume = volume;
		setIsPlayingSnippet(true);

		if (snippetTimeoutRef.current) {
			window.clearTimeout(snippetTimeoutRef.current);
			snippetTimeoutRef.current = null;
		}

		void audio.play().catch(() => {
			setIsPlayingSnippet(false);
		});

		snippetTimeoutRef.current = window.setTimeout(() => {
			audio.pause();
			setIsPlayingSnippet(false);
		}, durationSeconds * 1000);

		return true;
	};

	const pauseSnippet = () => {
		if (snippetTimeoutRef.current) {
			window.clearTimeout(snippetTimeoutRef.current);
			snippetTimeoutRef.current = null;
		}
		audioRef.current?.pause();
		setIsPlayingSnippet(false);
	};

	const handleCategoryChange = (next: CategoryKey) => {
		if (next === activeCategory) return;
		playClick();
		setActiveCategory(next);
	};

	const handleArchiveDateChange = (next: string) => {
		playClick();
		setArchiveDateKey(next);
	};

	const handleArchivePlay = () => {
		if (!archiveTrack?.previewUrl) {
			setArchiveError("No preview is available for this archived track.");
			return;
		}
		const audio = archiveAudioRef.current;
		if (!audio) return;
		audio.src = archiveTrack.previewUrl;
		audio.currentTime = 0;
		audio.volume = volume;
		void audio.play().catch(() => undefined);
	};

	const openArchive = () => {
		playClick();
		setIsArchiveOpen(true);
		setArchiveError(null);
		if (!archiveDateKey) {
			setArchiveDateKey(dateKey);
		}
	};

	const handlePlaySnippet = () => {
		if (!currentTrack) {
			return;
		}
		if (isPlayingSnippet) {
			pauseSnippet();
			return;
		}
		void playSegment(currentSnippetLength);
	};

const getCategoryStatus = (key: CategoryKey): CategoryStatus => {
	if (winners[key]) return "success";
	if (failures[key]) return "failure";
	return "idle";
};

	const triggerCompletionModal = (
		completedCategory: CategoryKey,
		status: "success" | "failure",
		nextWinners: Record<CategoryKey, boolean>,
		nextFailures: Record<CategoryKey, boolean>
	) => {
		const finished = availableCategories.every((key) => nextWinners[key] || nextFailures[key]);
		if (finished) {
			setCompletionModal(null);
			setShowResultsModal(true);
			return;
		}
		const nextCategory = availableCategories.find((key) => !nextWinners[key] && !nextFailures[key]);
		if (nextCategory) {
			setCompletionModal({ category: completedCategory, status, nextCategory });
		}
	};

	const handleShareResults = async (context: "floating" | "modal" = "floating") => {
		const summary = getCategorySummaries()
			.map((entry) => entry.shareLine)
			.join("\n");
		const baseMessage = `🎧 My songgame results 🎧\n${summary}`;
		const shareUrl = "https://play.chriskstudios.com";
		const message = `${baseMessage}\nPlay it yourself: ${shareUrl}`;
		try {
			if (typeof navigator !== "undefined" && navigator.share) {
				await navigator.share({
					title: "My songgame results",
					text: message,
				});
				setShareFeedback({ message: "Shared! 🎉", context });
			} else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(message);
				setShareFeedback({ message: "Results copied! 📋", context });
			} else {
				setShareFeedback({ message: "Sharing not supported here. Copy manually.", context });
			}
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") return;
			setShareFeedback({ message: "Unable to share right now.", context });
		}

		if (shareFeedbackTimeoutRef.current) {
			window.clearTimeout(shareFeedbackTimeoutRef.current);
		}
	shareFeedbackTimeoutRef.current = window.setTimeout(() => {
		setShareFeedback(null);
		shareFeedbackTimeoutRef.current = null;
	}, 7000);
	};

	const handleSkip = () => {
		if (!currentTrack) {
			setGameMessage("Pick a category to load today's track.");
			return;
		}
		if (isWinner) {
			setGameMessage("Game already solved for today.");
			return;
		}
		if (isFailed) {
			setGameMessage("You've already used all your reveals today.");
			return;
		}
		const nextIndex = Math.min(snippetIndex + 1, snippetDurations.length - 1);
		const addedSeconds = Math.max(0, snippetDurations[nextIndex] - snippetDurations[snippetIndex]);
		const entry: GuessEntry = {
			track: {
				id: `skip-${activeCategory}-${Date.now()}`,
				name: isAtMaxReveal ? "Skip" : `Skip (+${addedSeconds}s)`,
				artists: "",
				album: "",
				artwork: null,
				previewUrl: null,
				duration: null,
			},
			correct: false,
			timestamp: Date.now(),
		};
		setGuessHistories((prev) => {
			const current = prev[activeCategory] ?? [];
			const updated = [...current, entry].slice(-snippetDurations.length);
			return {
				...prev,
				[activeCategory]: updated,
			};
		});

		if (isAtMaxReveal) {
			const updatedFailures = { ...failures, [activeCategory]: true };
			setFailures(updatedFailures);
			const playedFull = playSegment(FULL_REVEAL_DURATION, { suppressMissingMessage: true });
			setGameMessage(playedFull ? "Out of time! Try again tomorrow." : "Out of time! Preview unavailable today.");
			triggerCompletionModal(activeCategory, "failure", winners, updatedFailures);
		} else {
			setRevealSteps((prev) => ({ ...prev, [activeCategory]: nextIndex }));
			setGameMessage(null);
		}
	};

	const handleGuessTrack = (track: TrackResult) => {
		if (!currentTrack) {
			setGameMessage("Daily song not loaded yet.");
			return;
		}
		if (isWinner) {
			setGameMessage("Already solved for today.");
			return;
		}
		if (isFailed) {
			setGameMessage("Already used all reveals for today.");
			return;
		}
		setSelectedTracks((prev) => ({ ...prev, [activeCategory]: track }));

		const correct = isMatchingTrack(track, currentTrack);
		const currentRevealIndex = revealSteps[activeCategory] ?? 0;
		const nextRevealIndex = Math.min(currentRevealIndex + 1, snippetDurations.length - 1);
		const entry: GuessEntry = { track, correct, timestamp: Date.now() };
		setGuessHistories((prev) => {
			const current = prev[activeCategory] ?? [];
			const updated = [...current, entry].slice(-snippetDurations.length);
			return {
				...prev,
				[activeCategory]: updated,
			};
		});

		if (correct) {
			const solvedDuration = currentSnippetLength;
			const solvedLabel = formatSecondsLabel(solvedDuration);
			const fullDuration = FULL_REVEAL_DURATION;
			setSolvedAtMap((prev) => ({ ...prev, [activeCategory]: solvedDuration }));
			setRevealSteps((prev) => ({ ...prev, [activeCategory]: snippetDurations.length - 1 }));
			const updatedWinners = { ...winners, [activeCategory]: true };
			setWinners(updatedWinners);
			const playedFull = playSegment(fullDuration, { suppressMissingMessage: true });
			setGameMessage(
				playedFull
					? `You nailed it in ${solvedLabel}s! Enjoy the full clip.`
					: `You nailed it in ${solvedLabel}s, but today's track has no preview.`
			);
			triggerCompletionModal(activeCategory, "success", updatedWinners, failures);
		} else {
			const reachedMax = nextRevealIndex === snippetDurations.length - 1;
			setRevealSteps((prev) => ({
				...prev,
				[activeCategory]: nextRevealIndex,
			}));
			if (reachedMax) {
				const updatedFailures = { ...failures, [activeCategory]: true };
				setFailures(updatedFailures);
				const playedFull = playSegment(FULL_REVEAL_DURATION, { suppressMissingMessage: true });
				setGameMessage(playedFull ? "Out of time! Try again tomorrow." : "Out of time! Preview unavailable today.");
				triggerCompletionModal(activeCategory, "failure", winners, updatedFailures);
			} else {
				setGameMessage(null);
			}
		}
	};
	const resetGameState = (newKey: string) => {
		const upcomingCategories = getActiveCategoryKeysForDate(newKey);
		setDateKey(newKey);
		setAvailableCategories(upcomingCategories);
		setActiveCategory(upcomingCategories[0] ?? "oldies");
		setCategoryQueries(createInitialQueries());
		setCategoryTracks(createInitialTrackResults());
		setRevealSteps(createInitialRevealSteps());
		setGuessHistories(createInitialGuessHistories());
		setWinners(createInitialWinners());
		setFailures(createInitialFailures());
		setSolvedAtMap(createInitialSolvedAt());
		setSelectedTracks(createInitialSelectedTracks());
		setCompletionModal(null);
		setShowResultsModal(false);
		setShareFeedback(null);
		if (shareFeedbackTimeoutRef.current) {
			window.clearTimeout(shareFeedbackTimeoutRef.current);
			shareFeedbackTimeoutRef.current = null;
		}
		setGameMessage(null);
		if (typeof window !== "undefined") {
			window.localStorage.removeItem(STORAGE_KEY);
		}
	};

	return (
		<div className="play-shell">
			<header className="play-header">
				<a className="brand" href="/" onClick={playClick}>
					<img src={playLogo} alt="ChrisK Studios logo" />
					<div>
						<p className="brand-label">ChrisK Studios</p>
						<h1>songgame by ChrisK</h1>
					</div>
				</a>
				<div className="header-actions">
					<div className="reset-countdown">
						<span>Next songs in</span>
						<strong>{resetCountdown}</strong>
					</div>
				</div>
			</header>
			<main className="doc lab-doc">
		<section className="doc-card lab-player-card">
			<div className={`lab-volume-toggle${isVolumeOpen ? " open" : ""}`}>
				<button
					type="button"
					aria-label="Adjust volume"
					aria-expanded={isVolumeOpen}
					onClick={() => setIsVolumeOpen((prev) => !prev)}
				>
					{isVolumeOpen ? "🔈" : "🔊"}
				</button>
				{isVolumeOpen ? (
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={volume}
						onChange={(event) => setVolume(Number(event.target.value))}
						onInput={(event) => setVolume(Number(event.currentTarget.value))}
						aria-label="Volume slider"
					/>
				) : null}
			</div>
				<div className="lab-player-top">
					<div>
						<div className="category-toggle">
							{availableCategories.map((key) => {
								const isActive = key === activeCategory;
								const details = CATEGORY_LABELS[key];
								const trackInfo = dailyCategories[key];
								const status = getCategoryStatus(key);
								const classes = ["category-pill"];
								if (isActive) classes.push("active");
								if (status === "success") classes.push("success");
								if (status === "failure") classes.push("failure");
								if (key === HOLIDAY_CATEGORY) classes.push("holiday");
								let pillSubtext = "Hidden track";
								if (!trackInfo) {
									pillSubtext = "Loading track...";
								} else if (status === "success") {
									pillSubtext = trackInfo.name;
								} else if (status === "failure") {
									pillSubtext = trackInfo ? `${trackInfo.name} — ${trackInfo.artists}` : "Answer revealed";
								}
								return (
									<button
										type="button"
										key={key}
										className={classes.join(" ")}
										onClick={() => handleCategoryChange(key)}
									>
										<div className="category-pill-content">
											<span className={`category-pill-emoji${key === HOLIDAY_CATEGORY ? " holiday" : ""}`} aria-hidden="true">
												{details.emoji}
											</span>
											<div className="category-pill-text">
												<span className="category-pill-label">{details.title}</span>
												<span className="category-pill-sub">{pillSubtext}</span>
											</div>
										</div>
									</button>
								);
							})}
						</div>
				</div>
			</div>
			<div className="snippet-progress">
				<div className="snippet-progress-bar">
					{snippetSegments.map((segment) => {
						const classes = ["snippet-progress-segment"];
						if (segment.isUnlocked) {
							classes.push("complete");
						} else {
							classes.push("locked");
						}
						if (segment.isCurrent) {
							classes.push("current");
						}
						if (segment.isNext) {
							classes.push("next");
						}
						return (
							<span
								key={segment.index}
								className={classes.join(" ")}
								style={{ flexGrow: segment.segmentLength, flexBasis: 0 }}
								aria-label={segment.label}
							/>
						);
					})}
				</div>
				<p className="lab-hint">
					{formatSecondsLabel(currentSnippetLength)}/{formatSecondsLabel(totalSnippetLength)}s
				</p>
			</div>
			<div className="lab-controls">
				<button
					className="primary-btn"
					type="button"
					onClick={() => handlePlaySnippet()}
					disabled={!currentTrack}
				>
					{isPlayingSnippet ? "Stop" : "Play"}
				</button>
				<button
					className="ghost-btn skip-btn"
					type="button"
					onClick={() => {
						playClick();
						handleSkip();
					}}
					disabled={!currentTrack || isWinner || isFailed}
				>
					{isAtMaxReveal ? "Give up" : `Skip (+${Math.max(0, snippetDurations[Math.min(snippetIndex + 1, snippetDurations.length - 1)] - currentSnippetLength)}s)`}
				</button>
			</div>
			{gameMessage ? <p className="lab-message">{gameMessage}</p> : null}
			<div className="lab-search-panel">
				<p className="eyebrow">Song list</p>
				<div className="lab-search">
					<input
						type="text"
						placeholder="Search song, artist, or album"
						value={query}
						onChange={(event) => {
							const { value } = event.target;
							setCategoryQueries((prev) => ({ ...prev, [activeCategory]: value }));
						}}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								if (tracks[0]) handleGuessTrack(tracks[0]);
							}
						}}
						onFocus={() => setIsSearchFocused(true)}
						onBlur={() => setIsSearchFocused(false)}
						aria-label="Search songs"
					/>
					{isSearching ? <span className="lab-status">Searching…</span> : null}
				</div>
				{searchError ? <p className="lab-error">{searchError}</p> : null}
				<div
					className={`lab-results${showResults ? " visible" : ""}`}
					onMouseEnter={() => setIsResultsHovered(true)}
					onMouseLeave={() => setIsResultsHovered(false)}
					onFocusCapture={() => setIsResultsHovered(true)}
					onBlurCapture={(event) => {
						const nextTarget = (event.relatedTarget as Node | null) ?? null;
						if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
							setIsResultsHovered(false);
						}
					}}
				>
					{tracks.length === 0 && !isSearching ? <p className="lab-hint">Results will appear here.</p> : null}
					{tracks.map((track) => {
						const isActive = selectedTrack?.id === track.id;
						const alreadyGuessed = guessHistory.some(
							(entry) => entry.track.id === track.id && !entry.track.name.startsWith("Skip")
						);
						return (
							<button
								className={`track-card${isActive ? " selected" : ""}${alreadyGuessed ? " guessed" : ""}`}
								type="button"
								key={track.id}
								disabled={alreadyGuessed}
								onClick={() => {
									playClick();
									handleGuessTrack(track);
								}}
							>
								<div className="track-meta">
									{track.artwork ? <img src={track.artwork} alt="" className="track-art" /> : null}
									<div>
										<p className="track-name">{track.name}</p>
										<p className="track-detail">{track.artists}</p>
										<p className="track-detail">{track.album}</p>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>
			<div className="guess-board">
				<div className="guess-board-head">
					<p className="eyebrow">Guesses</p>
				</div>
				<div className="guess-grid">
					{Array.from({ length: snippetDurations.length }).map((_, index) => {
						const entry = guessHistory[index];
						let tileState = "";
						let label = "—";
						if (entry) {
							if (entry.correct) {
								tileState = "correct";
								label = entry.track.name;
							} else if (entry.track.name.startsWith("Skip")) {
								tileState = "skip";
								label = entry.track.name;
							} else {
								const artistMatch = answerTrack ? hasMatchingArtist(entry.track, answerTrack) : false;
								tileState = artistMatch ? "artist-match" : "incorrect";
								label = entry.track.name;
							}
						} else if (index === guessHistory.length) {
							tileState = "active";
							label = "…";
						}
						return (
							<div className={`guess-tile ${tileState}`} key={`guess-tile-${index}`}>
								<span>{label}</span>
							</div>
						);
					})}
				</div>
			</div>
			<audio ref={audioRef} onEnded={() => setIsPlayingSnippet(false)} preload="auto" />
		</section>
	</main>
			<footer className="play-footer">
				<p>© ChrisK Studios 2026</p>
			</footer>
			{completionModal ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true">
					<div className="modal">
						<h3>{completionModal.status === "success" ? "Correct! 🎉" : "Out of time ⏳"}</h3>
						<p className="lab-hint">{CATEGORY_LABELS[completionModal.category].title}</p>
						{completionModal.status === "failure" ? (
							<p>
								Answer: {dailyCategories[completionModal.category]?.name} —{" "}
								{dailyCategories[completionModal.category]?.artists}
							</p>
						) : null}
						<div className="modal-actions">
							{completionModal.nextCategory ? (
								<button
									className="primary-btn"
									type="button"
									onClick={() => {
										playClick();
										setActiveCategory(completionModal.nextCategory as CategoryKey);
										setCompletionModal(null);
									}}
								>
									Play {CATEGORY_LABELS[completionModal.nextCategory].title}
								</button>
							) : null}
							<button
								className="ghost-btn"
								type="button"
								onClick={() => {
									playClick();
									setCompletionModal(null);
								}}
							>
								Continue
							</button>
						</div>
					</div>
				</div>
			) : null}
			{showResultsModal ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true">
					<div className="modal results-modal">
						<h3>Daily scorecard ✨</h3>
						<ul className="results-list">
							{getCategorySummaries().map((entry) => (
								<li key={`results-${entry.key}`} className={entry.status}>
									{entry.displayLine}
								</li>
							))}
						</ul>
						<p className="lab-hint next-reset-hint">Next songs in {resetCountdown}</p>
						<div className="modal-actions">
							<button
								className="primary-btn"
								type="button"
								onClick={() => {
									playClick();
									void handleShareResults("modal");
								}}
							>
								Share results 🎵✨
							</button>
							{shareFeedback?.context === "modal" ? <p className="share-feedback">{shareFeedback.message}</p> : null}
							<button
								className="ghost-btn"
								type="button"
								onClick={() => {
									playClick();
									setShowResultsModal(false);
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			) : null}
			{isArchiveOpen ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true">
					<div className="modal archive-modal">
						<div className="archive-modal-head">
							<div>
								<h3>Archive</h3>
								<p className="lab-hint">Pick a day and play that song again.</p>
							</div>
							<button className="ghost-btn" type="button" onClick={() => setIsArchiveOpen(false)}>
								Close
							</button>
						</div>
						<div className="archive-layout">
							<div className="archive-calendar">
								{archiveMonths.map((month) => (
									<section className="archive-month" key={month.key}>
										<h4>{month.label}</h4>
										<div className="archive-date-grid">
											{month.dates.map((date) => {
												const selected = archiveDateKey === date;
												return (
													<button
														key={date}
														type="button"
														className={`archive-date-btn${selected ? " active" : ""}`}
														onClick={() => handleArchiveDateChange(date)}
													>
														{formatArchiveDateLabel(date)}
													</button>
												);
											})}
										</div>
									</section>
								))}
							</div>
							<div className="archive-player">
								{archiveLoading ? <p className="lab-hint">Loading archive track…</p> : null}
								{archiveError ? <p className="lab-error">{archiveError}</p> : null}
								{archiveDateKey ? <p className="eyebrow">{formatArchiveLongDate(archiveDateKey)}</p> : null}
								<div className="category-toggle archive-category-toggle">
									{availableCategories.map((key) => {
										const info = archiveCategories[key];
										const details = CATEGORY_LABELS[key];
										const selected = key === archiveActiveCategory;
										return (
											<button
												key={`archive-${key}`}
												type="button"
												className={`category-pill${selected ? " active" : ""}`}
												onClick={() => {
													playClick();
													setArchiveActiveCategory(key);
												}}
											>
												<div className="category-pill-content">
													<span className="category-pill-emoji" aria-hidden="true">
														{details.emoji}
													</span>
													<div className="category-pill-text">
														<span className="category-pill-label">{details.title}</span>
														<span className="category-pill-sub">{info ? info.name : "Loading…"}</span>
													</div>
												</div>
											</button>
										);
									})}
								</div>
								<div className="archive-track-card">
									{archiveTrack ? (
										<>
											<div className="track-meta archive-track-meta">
												{archiveTrack.artwork ? <img src={archiveTrack.artwork} alt="" className="track-art" /> : null}
												<div>
													<p className="track-name">{archiveTrack.name}</p>
													<p className="track-detail">{archiveTrack.artists}</p>
													<p className="track-detail">{archiveTrack.album}</p>
												</div>
											</div>
											<button className="primary-btn" type="button" onClick={handleArchivePlay} disabled={!archiveTrack.previewUrl}>
												Play preview
											</button>
											{archiveTrack.previewUrl ? null : <p className="lab-hint">No preview available for this song.</p>}
										</>
									) : (
										<p className="lab-hint">Choose a date to load a song.</p>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}

function normalizeTrackText(value: string) {
	return value
		.toLowerCase()
		.replace(/\([^)]*\)/g, "")
		.replace(/feat\..*/gi, "")
		.replace(/-/g, " ")
		.trim();
}

function isMatchingTrack(a: TrackResult, b: TrackResult) {
	return (
		normalizeTrackText(a.name) === normalizeTrackText(b.name) &&
		artistsMatchExactly(a.artists, b.artists)
	);
}

function hasMatchingArtist(a: TrackResult, b: TrackResult) {
	return artistsOverlap(a.artists, b.artists);
}

function normalizeArtistList(value: string) {
	const cleaned = value
		.toLowerCase()
		.replace(/\([^)]*\)/g, "")
		.replace(/feat\..*/gi, "")
		.replace(/with .*/gi, "")
		.replace(/[-+]/g, " ")
		.replace(/\band\b/g, ",")
		.replace(/&/g, ",");
	return cleaned
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function artistsMatchExactly(a: string, b: string) {
	const listA = normalizeArtistList(a);
	const listB = normalizeArtistList(b);
	if (listA.length !== listB.length) return false;
	const setB = new Set(listB);
	return listA.every((artist) => setB.has(artist));
}

function artistsOverlap(a: string, b: string) {
	const listA = normalizeArtistList(a);
	const setA = new Set(listA);
	return normalizeArtistList(b).some((artist) => setA.has(artist));
}

function getEasternDateKey() {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const parts = formatter.format(now).split("/");
	const [month, day, year] = parts;
	return `${year}-${month}-${day}`;
}

function formatSecondsLabel(value: number) {
	return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, "");
}

function getMillisecondsUntilNextEasternReset() {
	const now = new Date();
	const easternNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
	const easternMidnight = new Date(easternNow);
	easternMidnight.setHours(24, 0, 0, 0);
	return Math.max(0, easternMidnight.getTime() - easternNow.getTime());
}

function formatCountdownLabel(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const hours = Math.floor(totalSeconds / 3600)
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor((totalSeconds % 3600) / 60)
		.toString()
		.padStart(2, "0");
	const seconds = (totalSeconds % 60).toString().padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
}

function formatArchiveDateLabel(dateKey: string) {
	const date = new Date(`${dateKey}T12:00:00Z`);
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	}).format(date);
}

function formatArchiveLongDate(dateKey: string) {
	const date = new Date(`${dateKey}T12:00:00Z`);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function groupDatesByMonth(dateKeys: string[]) {
	const groups = new Map<string, string[]>();
	for (const dateKey of dateKeys) {
		const monthKey = dateKey.slice(0, 7);
		const current = groups.get(monthKey) ?? [];
		current.push(dateKey);
		groups.set(monthKey, current);
	}
	return [...groups.entries()].map(([monthKey, dates]) => ({
		key: monthKey,
		label: formatArchiveMonthLabel(monthKey),
		dates,
	}));
}

function formatArchiveMonthLabel(monthKey: string) {
	const date = new Date(`${monthKey}-01T12:00:00Z`);
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		year: "numeric",
	}).format(date);
}

// ─── Color Game ───────────────────────────────────────────────────────────────

const COLOR_GAME_ROUNDS = 5;
const MEMORIZE_SECONDS = 4;

type ColorHSL = { h: number; s: number; l: number };
type ColorPhase = "memorize" | "guess" | "result" | "complete";

function ColorGame() {
	const playClick = useClickSound();
	const [round, setRound] = useState(1);
	const [phase, setPhase] = useState<ColorPhase>("memorize");
	const [target, setTarget] = useState<ColorHSL>(() => randomColorHSL());
	const [guess, setGuess] = useState<ColorHSL>({ h: 180, s: 50, l: 50 });
	const [timeLeft, setTimeLeft] = useState(MEMORIZE_SECONDS);
	const [roundScores, setRoundScores] = useState<number[]>([]);
	const [lastScore, setLastScore] = useState(0);
	const cgTimerRef = useRef<number | null>(null);

	useEffect(() => {
		if (phase !== "memorize") return;
		setTimeLeft(MEMORIZE_SECONDS);
		cgTimerRef.current = window.setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					if (cgTimerRef.current) window.clearInterval(cgTimerRef.current);
					setPhase("guess");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		return () => {
			if (cgTimerRef.current) window.clearInterval(cgTimerRef.current);
		};
	}, [phase, round]);

	const handleSubmitGuess = () => {
		playClick();
		const score = scoreColorGuess(target, guess);
		setLastScore(score);
		setRoundScores((prev) => [...prev, score]);
		setPhase("result");
	};

	const handleNextRound = () => {
		playClick();
		if (round >= COLOR_GAME_ROUNDS) {
			setPhase("complete");
		} else {
			setRound((r) => r + 1);
			setTarget(randomColorHSL());
			setGuess({ h: 180, s: 50, l: 50 });
			setPhase("memorize");
		}
	};

	const handleRestartGame = () => {
		playClick();
		setRound(1);
		setRoundScores([]);
		setLastScore(0);
		setTarget(randomColorHSL());
		setGuess({ h: 180, s: 50, l: 50 });
		setPhase("memorize");
	};

	const totalScore = roundScores.length
		? Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length)
		: 0;

	return (
		<div className="play-shell">
			<header className="play-header">
				<a className="brand" href="/" onClick={playClick}>
					<img src={playLogo} alt="ChrisK Studios logo" />
					<div>
						<p className="brand-label">ChrisK Studios</p>
						<h1>colorgame by ChrisK</h1>
					</div>
				</a>
				<div className="header-actions">
					<div className="reset-countdown">
						<span>Round</span>
						<strong>{phase === "complete" ? "done" : `${round} / ${COLOR_GAME_ROUNDS}`}</strong>
					</div>
				</div>
			</header>
			<main className="doc lab-doc">
				<section className="doc-card cg-card">
					{phase === "memorize" && (
						<>
							<p className="eyebrow">Round {round} of {COLOR_GAME_ROUNDS}</p>
							<h2 className="cg-title">Memorize this color</h2>
							<p className="lab-hint">{timeLeft}s remaining</p>
							<div className="cg-swatch-wrap">
								<div className="cg-swatch" style={{ background: hslStr(target) }} />
								<div className="cg-timer-bar">
									<div className="cg-timer-fill" style={{ width: `${(timeLeft / MEMORIZE_SECONDS) * 100}%` }} />
								</div>
							</div>
						</>
					)}

					{phase === "guess" && (
						<>
							<p className="eyebrow">Round {round} of {COLOR_GAME_ROUNDS}</p>
							<h2 className="cg-title">Recreate the color</h2>
							<p className="lab-hint">Adjust the sliders to match what you saw.</p>
							<div className="cg-guess-layout">
								<div className="cg-preview-swatch" style={{ background: hslStr(guess) }} />
								<div className="cg-sliders">
									<div className="cg-slider-row">
										<label className="cg-label">Brightness <span>{guess.l}%</span></label>
										<input
											type="range"
											className="cg-slider"
											min="0"
											max="100"
											value={guess.l}
											onChange={(e) => setGuess((prev) => ({ ...prev, l: Number(e.target.value) }))}
											style={{ background: `linear-gradient(to right, hsl(${guess.h}, ${guess.s}%, 0%), hsl(${guess.h}, ${guess.s}%, 50%), hsl(${guess.h}, ${guess.s}%, 100%))` }}
										/>
									</div>
									<div className="cg-slider-row">
										<label className="cg-label">Saturation <span>{guess.s}%</span></label>
										<input
											type="range"
											className="cg-slider"
											min="0"
											max="100"
											value={guess.s}
											onChange={(e) => setGuess((prev) => ({ ...prev, s: Number(e.target.value) }))}
											style={{ background: `linear-gradient(to right, hsl(${guess.h}, 0%, ${guess.l}%), hsl(${guess.h}, 100%, ${guess.l}%))` }}
										/>
									</div>
									<div className="cg-slider-row">
										<label className="cg-label">Hue <span>{guess.h}°</span></label>
										<input
											type="range"
											className="cg-slider cg-hue-slider"
											min="0"
											max="359"
											value={guess.h}
											onChange={(e) => setGuess((prev) => ({ ...prev, h: Number(e.target.value) }))}
										/>
									</div>
								</div>
							</div>
							<button className="primary-btn" type="button" onClick={handleSubmitGuess}>
								Submit guess
							</button>
						</>
					)}

					{phase === "result" && (
						<>
							<p className="eyebrow">Round {round} of {COLOR_GAME_ROUNDS}</p>
							<h2 className="cg-title">
								{lastScore >= 90 ? "Excellent!" : lastScore >= 70 ? "Nice!" : lastScore >= 50 ? "Not bad" : "Keep practicing"}
							</h2>
							<div className="cg-result-swatches">
								<div className="cg-result-col">
									<div className="cg-swatch cg-swatch-sm" style={{ background: hslStr(guess) }} />
									<p className="cg-swatch-label">Your guess</p>
								</div>
								<div className="cg-result-sep">vs</div>
								<div className="cg-result-col">
									<div className="cg-swatch cg-swatch-sm" style={{ background: hslStr(target) }} />
									<p className="cg-swatch-label">Target</p>
								</div>
							</div>
							<p className="lab-hint" style={{ margin: "0.75rem 0" }}>
								Score: <strong style={{ color: cgScoreColor(lastScore), fontSize: "1.1rem" }}>{lastScore}%</strong>
							</p>
							<div className="lab-controls">
								<button className="primary-btn" type="button" onClick={handleNextRound}>
									{round >= COLOR_GAME_ROUNDS ? "See final score" : "Next round →"}
								</button>
							</div>
						</>
					)}

					{phase === "complete" && (
						<>
							<h2 className="cg-title">Final score</h2>
							<p className="lab-hint" style={{ marginBottom: "1rem" }}>
								Average: <strong style={{ color: cgScoreColor(totalScore), fontSize: "1.5rem" }}>{totalScore}%</strong>
							</p>
							<ul className="cg-score-list">
								{roundScores.map((score, i) => (
									<li key={i} className="cg-score-row">
										<span>Round {i + 1}</span>
										<div className="cg-score-bar-wrap">
											<div className="cg-score-bar" style={{ width: `${score}%`, background: cgScoreGradient(score) }} />
										</div>
										<span style={{ color: cgScoreColor(score), fontWeight: 600 }}>{score}%</span>
									</li>
								))}
							</ul>
							<div className="lab-controls" style={{ marginTop: "1.5rem" }}>
								<button className="primary-btn" type="button" onClick={handleRestartGame}>
									Play again
								</button>
								<a className="ghost-btn" href="/" onClick={playClick} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
									Back to games
								</a>
							</div>
						</>
					)}
				</section>
			</main>
			<footer className="play-footer">
				<p>© ChrisK Studios 2026</p>
			</footer>
		</div>
	);
}

function randomColorHSL(): ColorHSL {
	return {
		h: Math.floor(Math.random() * 360),
		s: Math.floor(Math.random() * 85) + 10,
		l: Math.floor(Math.random() * 70) + 10,
	};
}

function hslStr({ h, s, l }: ColorHSL): string {
	return `hsl(${h}, ${s}%, ${l}%)`;
}

function scoreColorGuess(target: ColorHSL, guess: ColorHSL): number {
	const hueDiff = Math.min(Math.abs(target.h - guess.h), 360 - Math.abs(target.h - guess.h));
	const hueScore = 1 - hueDiff / 180;
	const satScore = 1 - Math.abs(target.s - guess.s) / 100;
	const lightScore = 1 - Math.abs(target.l - guess.l) / 100;
	const weighted = hueScore * 0.5 + satScore * 0.25 + lightScore * 0.25;
	return Math.round(Math.pow(weighted, 2) * 100);
}

function cgScoreColor(score: number): string {
	if (score >= 90) return "#6ef4c5";
	if (score >= 70) return "#80c4ff";
	if (score >= 50) return "#ffb864";
	return "#ff9b9b";
}

function cgScoreGradient(score: number): string {
	if (score >= 90) return "linear-gradient(90deg, #6ef4c5, #4da1ff)";
	if (score >= 70) return "linear-gradient(90deg, #4da1ff, #c792ff)";
	if (score >= 50) return "linear-gradient(90deg, #ffb864, #ff9b9b)";
	return "linear-gradient(90deg, #ff6b6b, #ff9b9b)";
}

function useClickSound() {
	const soundRef = useRef<HTMLAudioElement | null>(null);
	return useCallback(() => {
		if (typeof Audio === "undefined") return;
		if (!soundRef.current) {
			soundRef.current = new Audio(clickSound);
		}
		soundRef.current.currentTime = 0;
		void soundRef.current.play().catch(() => undefined);
	}, []);
}

function getActiveCategoryKeysForDate(currentDateKey: string): CategoryKey[] {
	return isHolidaySeason(currentDateKey) ? [...DEFAULT_CATEGORY_ORDER, HOLIDAY_CATEGORY] : DEFAULT_CATEGORY_ORDER;
}

function isHolidaySeason(currentDateKey: string) {
	const [, monthStr, dayStr] = currentDateKey.split("-");
	const month = Number(monthStr);
	const day = Number(dayStr);
	if (Number.isNaN(month) || Number.isNaN(day)) {
		return false;
	}
	return month === 12 || (month === 1 && day === 1);
}
