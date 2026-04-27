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
                    <Link href="/search" className="nav-link search-nav-cta" title="Procedural Search">
                        <span className="desktop-only">Search Lab</span>
                        <span className="mobile-only">Search</span>
                    </Link>
                    <Link href="/algorithms" className="nav-link" title="Algorithms">
                        <span className="desktop-only">Algorithms</span>
                        <span className="mobile-only">Algos</span>
                    </Link>
                    <button className="submit-btn" onClick={onSubmitClick} title="Submit Discovery">
                        <span className="desktop-only">➕ Submit</span>
                        <span className="mobile-only">➕</span>
                    </button>
                </nav>
            </div>
        </header>
    );
}




