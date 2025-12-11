import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import clickSound from "./assets/click-soft.wav";
import playLogo from "./assets/play-logo.png";

const secretPath = "/songgame";
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

const CATEGORY_KEYS = ["oldies", "modern"] as const;
type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_LABELS: Record<CategoryKey, { title: string; description: string; emoji: string }> = {
	oldies: { title: "Oldies but Goodies", description: "Classic throwbacks", emoji: "🎶" },
	modern: { title: "2000s & Newer", description: "Fresh favorites", emoji: "⚡️" },
};

type CategoryStatus = "idle" | "success" | "failure";
type CompletionModalState = { category: CategoryKey; status: "success" | "failure"; nextCategory?: CategoryKey };

type DailyTrackResponse = {
	track?: TrackResult | null;
	categories?: Partial<Record<CategoryKey, TrackResult | null>>;
	error?: string;
};

const createInitialRevealSteps = () =>
	({ oldies: 0, modern: 0 } satisfies Record<CategoryKey, number>);
const createInitialGuessHistories = () =>
	({ oldies: [], modern: [] } satisfies Record<CategoryKey, GuessEntry[]>);
const createInitialWinners = () =>
	({ oldies: false, modern: false } satisfies Record<CategoryKey, boolean>);
const createInitialFailures = () =>
	({ oldies: false, modern: false } satisfies Record<CategoryKey, boolean>);
const createInitialSolvedAt = () =>
	({ oldies: null, modern: null } satisfies Record<CategoryKey, number | null>);
const createInitialSelectedTracks = () =>
	({ oldies: null, modern: null } satisfies Record<CategoryKey, TrackResult | null>);

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
	return {
		oldies: incoming?.oldies ?? fallback.oldies,
		modern: incoming?.modern ?? fallback.modern,
	} as Record<CategoryKey, T>;
}

const snippetDurations = [0.25, 0.5, 1, 2, 5, 10, 15];
const FULL_REVEAL_DURATION = 30;
const STORAGE_KEY = "songgame-daily-state";

const games = [
	{
		title: "songgame",
		tagline: "Daily guess the song challenge.",
		actionLabel: "Play songgame",
		onSelect: () => "modal",
	},
	{
		title: "More to come",
		tagline: "More games are a work in progress.",
		actionLabel: "-",
		onSelect: () => "placeholder",
	},
];

function App() {
	const playClick = useClickSound();
	const [showModal, setShowModal] = useState(false);
	const isSecretRoute =
		typeof window !== "undefined" &&
		window.location.pathname.replace(/\/$/, "") === secretPath.replace(/\/$/, "");

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
								{game.onSelect() === "modal" ? (
									<button
										className="primary-btn"
										type="button"
										onClick={() => {
											playClick();
											setShowModal(true);
										}}
									>
										{game.actionLabel}
									</button>
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
			{showModal ? (
				<div className="modal-backdrop" role="dialog" aria-modal="true">
					<div className="modal">
						<h3>Heads up — beta build</h3>
						<p>This game is still being worked on.</p>
						<div className="modal-actions">
							<a className="primary-btn beta-action modal-link" href={secretPath} onClick={playClick}>
								Start anyway
							</a>
							<button
								className="ghost-btn"
								type="button"
								onClick={() => {
									playClick();
									setShowModal(false);
								}}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			) : null}
			<footer className="play-footer">
				<p>© ChrisK Studios 2025</p>
			</footer>
		</div>
	);
}

export default App;

function SongGameLab() {
	const playClick = useClickSound();
	const [query, setQuery] = useState("");
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [isResultsHovered, setIsResultsHovered] = useState(false);
	const [tracks, setTracks] = useState<TrackResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [selectedTracks, setSelectedTracks] = useState<Record<CategoryKey, TrackResult | null>>(createInitialSelectedTracks);
	const [dailyCategories, setDailyCategories] = useState<Partial<Record<CategoryKey, TrackResult | null>>>({});
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
	const [dateKey, setDateKey] = useState(() => getEasternDateKey());
	const [isHydrated, setIsHydrated] = useState(false);
	const [solvedAtMap, setSolvedAtMap] = useState<Record<CategoryKey, number | null>>(createInitialSolvedAt);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const snippetTimeoutRef = useRef<number | null>(null);
	const shareFeedbackTimeoutRef = useRef<number | null>(null);

	const currentTrack = dailyCategories[activeCategory] ?? null;
	const answerTrack = currentTrack;
	const revealStep = revealSteps[activeCategory] ?? 0;
	const guessHistory = guessHistories[activeCategory] ?? [];
	const isWinner = winners[activeCategory] ?? false;
	const solvedAt = solvedAtMap[activeCategory] ?? null;
	const selectedTrack = selectedTracks[activeCategory] ?? null;
	const isFailed = failures[activeCategory] ?? false;
	const allCategoriesFinished = CATEGORY_KEYS.every((key) => winners[key] || failures[key]);

	const snippetIndex = Math.min(revealStep, snippetDurations.length - 1);
	const currentSnippetLength = snippetDurations[snippetIndex];
	const totalSnippetLength = snippetDurations[snippetDurations.length - 1];
	const isAtMaxReveal = snippetIndex === snippetDurations.length - 1;
	const hasQuery = query.trim().length > 0;
	const showResults = hasQuery && (isSearchFocused || isResultsHovered);

	const getCategorySummaries = () =>
		CATEGORY_KEYS.map((key) => {
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
		const controller = new AbortController();
		const timeoutId = window.setTimeout(async () => {
			const trimmed = query.trim();
			if (!trimmed) {
				setTracks([]);
				setSelectedTracks((prev) => ({ ...prev, [activeCategory]: null }));
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
				setTracks(data.tracks ?? []);
			} catch (err) {
				if (controller.signal.aborted) return;
				setSearchError(err instanceof Error ? err.message : "Search failed");
				setTracks([]);
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
		if (data.dateKey === dateKey) {
			setActiveCategory(data.activeCategory ?? "oldies");
			setRevealSteps(mergeCategoryMap(data.revealSteps, createInitialRevealSteps()));
			setGuessHistories(mergeCategoryMap(data.guessHistories, createInitialGuessHistories()));
			const mergedWinners = mergeCategoryMap(data.winners, createInitialWinners());
			const mergedFailures = mergeCategoryMap(data.failures, createInitialFailures());
			setWinners(mergedWinners);
			setFailures(mergedFailures);
			setSolvedAtMap(mergeCategoryMap(data.solvedAtMap, createInitialSolvedAt()));
			setSelectedTracks(mergeCategoryMap(data.selectedTracks, createInitialSelectedTracks()));
			if (CATEGORY_KEYS.every((key) => mergedWinners[key] || mergedFailures[key])) {
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
	const intervalId = window.setInterval(() => {
		const newKey = getEasternDateKey();
		if (newKey !== dateKey) {
			resetGameState(newKey);
			}
		}, 60000);
	return () => window.clearInterval(intervalId);
}, [dateKey]);

	useEffect(() => {
		const fetchDaily = async () => {
			try {
				const response = await fetch("/api/music/daily");
				const data = (await response.json()) as DailyTrackResponse;
				if (!response.ok) throw new Error(data.error ?? "Failed to load the daily song");
				const fallbackTrack = data.track ?? null;
				const categories: Partial<Record<CategoryKey, TrackResult | null>> = {
					oldies: data.categories?.oldies ?? fallbackTrack,
					modern: data.categories?.modern ?? fallbackTrack,
				};
				if (!categories.oldies && categories.modern) categories.oldies = categories.modern;
				if (!categories.modern && categories.oldies) categories.modern = categories.oldies;
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
		const finished = CATEGORY_KEYS.every((key) => nextWinners[key] || nextFailures[key]);
		if (finished) {
			setCompletionModal(null);
			setShowResultsModal(true);
			return;
		}
		const nextCategory = CATEGORY_KEYS.find((key) => !nextWinners[key] && !nextFailures[key]);
		if (nextCategory) {
			setCompletionModal({ category: completedCategory, status, nextCategory });
		}
	};

	const handleShareResults = async (context: "floating" | "modal" = "floating") => {
		const summary = getCategorySummaries()
			.map((entry) => entry.shareLine)
			.join("\n");
		const message = `🎧 My songgame results 🎧\n${summary}\nPlay it: https://play.chriskstudios.com`;
		try {
			if (typeof navigator !== "undefined" && navigator.share) {
				await navigator.share({
					title: "My songgame results",
					text: message,
					url: "https://play.chriskstudios.com",
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
			const failMessage = `Out of time! Today's ${CATEGORY_LABELS[activeCategory].title} track was ${currentTrack.name} — ${currentTrack.artists}.`;
			const playedFull = playSegment(FULL_REVEAL_DURATION, { suppressMissingMessage: true });
			setGameMessage(playedFull ? failMessage : `${failMessage} Preview unavailable.`);
			triggerCompletionModal(activeCategory, "failure", winners, updatedFailures);
		} else {
			setRevealSteps((prev) => ({ ...prev, [activeCategory]: nextIndex }));
			setGameMessage("Skipping ahead unlocked more audio.");
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
				const failMessage = `Out of time! Today's ${CATEGORY_LABELS[activeCategory].title} track was ${currentTrack.name} — ${currentTrack.artists}.`;
				const playedFull = playSegment(FULL_REVEAL_DURATION, { suppressMissingMessage: true });
				setGameMessage(playedFull ? failMessage : `${failMessage} Preview unavailable.`);
				triggerCompletionModal(activeCategory, "failure", winners, updatedFailures);
			} else {
				setGameMessage("Not quite. Listen again or try another guess.");
			}
		}
	};
	const resetGameState = (newKey: string) => {
		setDateKey(newKey);
		setActiveCategory("oldies");
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
				<div className="volume-top-control">
					<label htmlFor="top-volume-slider">Volume</label>
					<input
						id="top-volume-slider"
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={volume}
						onChange={(event) => setVolume(Number(event.target.value))}
					/>
				</div>
			</header>
			<main className="doc lab-doc">
		<section className="doc-card lab-player-card">
				<div className="lab-player-top">
					<div>
						{/* <p className="eyebrow">Daily snippet</p> */}
						<h2>songgame by ChrisK</h2>
						<p className="lab-hint">Unlock more audio with each skip or incorrect guess.</p>
						<div className="category-toggle">
							{CATEGORY_KEYS.map((key) => {
								const isActive = key === activeCategory;
								const details = CATEGORY_LABELS[key];
								const trackInfo = dailyCategories[key];
								const status = getCategoryStatus(key);
								const classes = ["category-pill"];
								if (isActive) classes.push("active");
								if (status === "success") classes.push("success");
								if (status === "failure") classes.push("failure");
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
										<span className="category-pill-label">{details.title}</span>
										<span className="category-pill-sub">{pillSubtext}</span>
									</button>
								);
							})}
						</div>
				</div>
			</div>
			<div className="snippet-progress">
				<div className="snippet-progress-bar">
					<span style={{ width: `${(currentSnippetLength / totalSnippetLength) * 100}%` }} />
				</div>
				<p className="lab-hint">
					{formatSecondsLabel(currentSnippetLength)}s unlocked of {formatSecondsLabel(totalSnippetLength)}s total
				</p>
				{isWinner && solvedAt !== null ? (
					<p className="lab-solved-callout">
						Solved {CATEGORY_LABELS[activeCategory].title} in {formatSecondsLabel(solvedAt)}s — full clip unlocked.
					</p>
				) : null}
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
					className="ghost-btn"
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
			<div className="lab-search-panel">
				<p className="eyebrow">Song list</p>
				<p className="lab-hint">Tap any row to submit your guess instantly.</p>
				<div className="lab-search">
					<input
						type="text"
						placeholder="Search song, artist, or album"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
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
			<audio ref={audioRef} onEnded={() => setIsPlayingSnippet(false)} preload="auto" />
		</section>
	</main>
			<footer className="play-footer">
				<p>© ChrisK Studios 2025</p>
			</footer>
			{allCategoriesFinished ? (
				<div className="share-results-fixed">
				<button
					className="share-results-btn"
					type="button"
					onClick={() => {
						playClick();
						void handleShareResults("floating");
					}}
				>
					Share results 🎵✨
				</button>
					{shareFeedback?.context === "floating" ? <p className="share-feedback">{shareFeedback.message}</p> : null}
				</div>
			) : null}
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
