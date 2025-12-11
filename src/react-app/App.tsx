import { useEffect, useState } from "react";
import "./App.css";
import playLogo from "./assets/play-logo.png";

const secretPath = "/songgame-lab-8d3b4c2a3f3e4b9a";
const defaultFavicon = "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20100%20100%27%3E%3Ctext%20y%3D%27.9em%27%20font-size%3D%2790%27%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E";
const labFavicon = "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20100%20100%27%3E%3Ctext%20y%3D%27.9em%27%20font-size%3D%2790%27%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E";

const games = [
	{
		title: "songgame",
		tagline: "Daily guess the song challenge.",
		actionLabel: "Play songgame",
		onSelect: () => "modal",
	},
	{
		title: "Placeholder",
		tagline: "More coming at a later date.",
		actionLabel: "TBD",
		onSelect: () => "placeholder",
	},
];

function App() {
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
				<div className="brand">
					<img src={playLogo} alt="ChrisK Studios logo" />
					<div>
						<p className="brand-label">ChrisK Studios</p>
						<h1>play.chriskstudios.com</h1>
					</div>
				</div>
				<span className="status-chip">Work in progress</span>
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
									<button className="primary-btn" type="button" onClick={() => setShowModal(true)}>
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
						<h3>Not quite done yet!</h3>
						<p>This game is still in development.</p>
						<p>
							Stay updated at{" "}
							<a href="https://chriskstudios.com" target="_blank" rel="noreferrer">
								chriskstudios.com
							</a>
						</p>
						<button className="ghost-btn" type="button" onClick={() => setShowModal(false)}>
							Close
						</button>
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
	return (
		<div className="play-shell">
			<header className="play-header">
				<div className="brand">
					<img src={playLogo} alt="ChrisK Studios logo" />
					<div>
						<p className="brand-label">ChrisK Studios</p>
						<h1>songgame lab</h1>
					</div>
				</div>
				<span className="status-chip">Prototype</span>
			</header>
			<main className="doc">
				<section className="doc-card intro-card">
					<p className="eyebrow">Hidden route</p>
					<h1>Prototype canvas</h1>
					<p>This page intentionally stays blank so you can build out the experience privately.</p>
					<p>Current slug: {secretPath}</p>
					<div className="lab-actions">
						<a className="ghost-btn" href="/">
							Back to games
						</a>
					</div>
				</section>
			</main>
			<footer className="play-footer">
				<p>© ChrisK Studios 2025</p>
			</footer>
		</div>
	);
}
