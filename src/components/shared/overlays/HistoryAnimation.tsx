import React, { useState, useEffect } from 'react';
import type { LoreEntry } from '../../../data/loreData';

interface HistoryAnimationProps {
    entries: LoreEntry[];
    onComplete: () => void;
    onSkip?: () => void;
    skipLabel?: string;
}

export const HistoryAnimation: React.FC<HistoryAnimationProps> = ({
    entries, onComplete, onSkip, skipLabel = "OMITIR INTRODUCCIÓN"
}) => {
    const [currentLogIndex, setCurrentLogIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        const log = entries[currentLogIndex];
        if (!log) return;

        let i = 0;
        setDisplayedText("");
        setIsTyping(true);

        const timer = setInterval(() => {
            i++;
            setDisplayedText(log.text.slice(0, i));
            if (i >= log.text.length) {
                clearInterval(timer);
                setIsTyping(false);
            }
        }, 30);

        return () => clearInterval(timer);
    }, [currentLogIndex, entries]);

    const handleNext = () => {
        if (currentLogIndex < entries.length - 1) {
            setCurrentLogIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div
            onClick={handleNext}
            style={{
                width: '100vw', height: '100vh', backgroundColor: '#000', color: '#00ff00',
                fontFamily: 'monospace', padding: '40px', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                background: 'rgba(0, 255, 0, 0.1)', zIndex: 10,
                pointerEvents: 'none', animation: 'scanline 8s linear infinite'
            }} />

            <div style={{ maxWidth: '800px', alignSelf: 'center', position: 'relative' }}>
                {/* Skip Button positioned above the text area */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSkip ? onSkip() : onComplete(); }}
                    style={{
                        position: 'absolute', top: '-80px', right: '0',
                        backgroundColor: 'rgba(0, 30, 0, 0.9)',
                        border: '2px solid #00ff00',
                        color: '#00ff00',
                        padding: '10px 20px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        zIndex: 1000,
                        boxShadow: '0 0 15px rgba(0, 255, 0, 0.4)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#00ff00';
                        e.currentTarget.style.color = '#000';
                        e.currentTarget.style.boxShadow = '0 0 30px #00ff00';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 30, 0, 0.9)';
                        e.currentTarget.style.color = '#00ff00';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.4)';
                    }}
                >
                    {skipLabel}
                </button>

                <div style={{ marginBottom: '20px', fontSize: '1.5rem', opacity: 0.8, color: '#00ff00' }}>
                    &gt;&gt; {entries[currentLogIndex].header}
                </div>
                <div style={{
                    fontSize: '1.8rem', lineHeight: '1.4', minHeight: '300px',
                    textShadow: '0 0 5px #00ff00',
                    whiteSpace: 'pre-wrap',
                    color: '#00ff00'
                }}>
                    {displayedText}
                    {isTyping && <span style={{ animation: 'blink 1s infinite', color: '#00ff00' }}>_</span>}
                </div>

                <div style={{
                    marginTop: '50px', fontSize: '1rem', color: '#00ff00',
                    opacity: 0.5,
                    textAlign: 'right', animation: 'blink 2s infinite'
                }}>
                    &gt; CLICK PARA CONTINUAR [{currentLogIndex + 1}/{entries.length}]
                </div>
            </div>
        </div>
    );
};
