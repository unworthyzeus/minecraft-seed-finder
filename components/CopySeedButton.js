'use client';

export default function CopySeedButton({ seed, className = '', style = null }) {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(seed);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className={className}
            style={style || undefined}
        >
            Copy
        </button>
    );
}
