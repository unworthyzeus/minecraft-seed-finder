'use client';

import Link from 'next/link';

export default function Header({ onSubmitClick }) {
    return (
        <header className="header">
            <div className="header-inner">
                <Link href="/" className="logo">
                    <span className="logo-icon">🌍</span>
                    <span className="logo-text">
                        Seed<span>Finder</span>
                    </span>
                </Link>

                <nav className="nav">
                    <a
                        href="https://minecraftathome.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                    >
                        Minecraft At Home
                    </a>
                    <a
                        href="https://www.chunkbase.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link"
                    >
                        Chunkbase
                    </a>
                    <button className="submit-btn" onClick={onSubmitClick}>
                        <span>➕</span>
                        Submit Discovery
                    </button>
                </nav>
            </div>
        </header>
    );
}
