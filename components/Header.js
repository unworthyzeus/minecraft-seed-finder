'use client';

import Link from 'next/link';

export default function Header({ onSubmitClick }) {
    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="logo">
                    <span className="logo-icon">🌍</span>
                    <span className="logo-text desktop-only">
                        Seed<span>Finder</span>
                    </span>
                    <span className="logo-text mobile-only">
                        SF
                    </span>
                </Link>

                <nav className="nav">
                    <Link href="/search" className="nav-link" title="Procedural Search">
                        <span className="desktop-only">Search Lab</span>
                        <span className="mobile-only">Lab</span>
                    </Link>
                    <Link href="/algorithms" className="nav-link" title="Algorithms">
                        <span className="desktop-only">Algorithms</span>
                        <span className="mobile-only">Algos</span>
                    </Link>
                    <a
                        href="https://minecraftathome.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                        title="Minecraft@Home"
                    >
                        MC@H
                    </a>
                    <a
                        href="https://www.chunkbase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                        title="Chunkbase"
                    >
                        <span className="desktop-only">Chunkbase</span>
                        <span className="mobile-only">CB</span>
                    </a>
                    <button className="submit-btn" onClick={onSubmitClick} title="Submit Discovery">
                        <span className="desktop-only">➕ Submit</span>
                        <span className="mobile-only">➕</span>
                    </button>
                </nav>
            </div>
        </header>
    );
}




