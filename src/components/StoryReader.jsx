import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons } from './Icons';
import { callAI } from '../utils/api';

export default function StoryReader({ story, state, dispatch, onBack }) {
    const [fontSize, setFontSize] = useState(() => {
        return parseInt(localStorage.getItem('fluentup_reader_font_size') || '20');
    });
    const [scrollProgress, setScrollProgress] = useState(0);
    const [tooltip, setTooltip] = useState(null); // { x, y, word, translation, loading }
    const [selectionMenu, setSelectionMenu] = useState(null); // { x, y, text }
    const [isRead, setIsRead] = useState(false);
    const [translationOverlay, setTranslationOverlay] = useState(null); // For phrase translation
    
    const [savedInSession, setSavedInSession] = useState(new Set()); // Track words saved to avoid duplicates
    
    const contentRef = useRef(null);
    const lastWordRef = useRef(null);
    const isAr = state.lang === 'ar';

    // Combine sentences into a continuous text
    const fullText = useMemo(() => {
        return story.sentences.map(s => s.en).join(' ');
    }, [story]);

    // Handle Scroll Progress
    useEffect(() => {
        const handleScroll = () => {
            const el = document.documentElement;
            const scrolled = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
            setScrollProgress(scrolled);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // IntersectionObserver for Completion
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isRead) {
                setIsRead(true);
                if (!state.storyProgress.includes(story.id)) {
                    dispatch({ type: 'MARK_STORY_COMPLETE', payload: story.id });
                    dispatch({ type: 'ADD_XP', payload: 50 });
                }
            }
        }, { threshold: 1.0 });

        if (lastWordRef.current) observer.observe(lastWordRef.current);
        return () => observer.disconnect();
    }, [story.id, isRead]);

    // Save font size
    useEffect(() => {
        localStorage.setItem('fluentup_reader_font_size', fontSize);
    }, [fontSize]);

    const handleWordClick = async (e, word) => {
        // Clear any existing selection to prevent conflicts
        window.getSelection().removeAllRanges();
        setSelectionMenu(null);

        const rect = e.target.getBoundingClientRect();
        const cleanWord = word.replace(/[.,!?;:()"]/g, '');
        
        // Use clientX/Y for fixed positioning math
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        setTooltip({
            x,
            y,
            word: cleanWord,
            loading: true
        });

        handlePlayAudio(cleanWord);

        try {
            const prompt = `Provide the Arabic translation and a very brief English example for the word "${cleanWord}". JSON format: { "ar": "...", "example": "..." }`;
            const schema = {
                type: "object",
                properties: {
                    ar: { type: "string" },
                    example: { type: "string" }
                },
                required: ["ar", "example"]
            };
            const res = await callAI(prompt, "You are a concise dictionary.", true, schema);
            if (res) {
                setTooltip(prev => ({ ...prev, translation: res.ar, example: res.example, loading: false }));
            }
        } catch (error) {
            setTooltip(prev => ({ ...prev, translation: "Error", loading: false }));
        }
    };

    const handleTextSelection = (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && text.length > 3) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelectionMenu({
                x: rect.left + rect.width / 2,
                y: rect.top, // Use viewport y
                text: text
            });
            // Don't show word tooltip if we are selecting
            setTooltip(null);
        } else {
            setSelectionMenu(null);
        }
    };

    const handleTranslatePhrase = async () => {
        if (!selectionMenu) return;
        const textToTranslate = selectionMenu.text;
        setSelectionMenu(null);
        
        setTranslationOverlay({ text: textToTranslate, loading: true });

        // Local match optimization: if the selection is (or is part of) an existing sentence
        const localMatch = story.sentences.find(s => 
            s.en.toLowerCase().includes(textToTranslate.toLowerCase()) || 
            textToTranslate.toLowerCase().includes(s.en.toLowerCase())
        );

        if (localMatch && textToTranslate.length > 10) {
             setTranslationOverlay({ text: textToTranslate, translation: localMatch.ar, loading: false });
             return;
        }

        try {
            const prompt = `Translate this phrase to Arabic: "${textToTranslate}". Return only the translation as a string.`;
            const res = await callAI(prompt, "You are a translator.", false);
            setTranslationOverlay({ text: textToTranslate, translation: res, loading: false });
        } catch (error) {
            setTranslationOverlay(null);
        }
    };

    const handlePlayAudio = (text) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const handleSaveWord = () => {
        if (!tooltip || tooltip.loading) return;
        
        dispatch({ 
            type: 'ADD_WORDS', 
            payload: [{ 
                english: tooltip.word, 
                arabic: tooltip.translation, 
                level: 'Reader', 
                emoji: '📖', 
                phonetic: '', 
                example_en: tooltip.example, 
                example_ar: '' 
            }], 
            level: 'Reader' 
        });

        setSavedInSession(prev => new Set(prev).add(tooltip.word));
        
        // Auto-close after a short delay
        setTimeout(() => setTooltip(null), 1500);
    };

    return (
        <div className="max-w-3xl mx-auto pb-32 animate-fade-in relative" onMouseUp={handleTextSelection}>
            {/* Header - Changed from fixed to sticky for better layout alignment */}
            <div className="sticky top-[-1rem] md:top-[-2rem] z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 -mx-4 md:-mx-8 px-4 md:px-8 mb-8">
                <div className="max-w-4xl mx-auto h-16 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
                        {isAr ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
                        <span className="hidden sm:inline">{isAr ? 'العودة' : 'Library'}</span>
                    </button>
                    
                    <div className="flex-1 text-center px-4">
                        <h2 className="font-black text-slate-800 dark:text-white truncate text-sm md:text-base tracking-tight">{story.title}</h2>
                        <div className="h-1 ms-auto me-auto w-32 md:w-48 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${scrollProgress}%` }}></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setFontSize(prev => Math.max(14, prev - 2))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Icons.ZoomOut size={18} /></button>
                        <span className="text-xs font-bold w-8 text-center">{fontSize}</span>
                        <button onClick={() => setFontSize(prev => Math.min(32, prev + 2))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Icons.ZoomIn size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Story Content */}
            <div className="px-2 md:px-6"> {/* Reduced padding for mobile */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 relative group select-none">
                        {/* CSS-based Modern Book Cover Fallback (shown behind and if image fails) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                            <div className="relative z-10 space-y-4">
                                <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                    <Icons.BookOpen className="text-white/20" size={32} />
                                </div>
                                <h2 className="text-white/40 font-black text-lg md:text-2xl uppercase tracking-[0.2em] max-w-md mx-auto line-clamp-2">{story.title}</h2>
                            </div>
                        </div>

                        <img 
                            src={story.cover} 
                            alt={story.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 relative z-20" 
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-30"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{story.title}</h1>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                        <Icons.User size={14} /> {story.author}
                    </p>
                </div>

                <div 
                    ref={contentRef}
                    className="prose prose-slate dark:prose-invert max-w-none font-serif leading-relaxed text-slate-800 dark:text-slate-200"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {story.sentences.map((sentence, sIdx) => (
                        <span key={sIdx} className="mr-1.5 inline-block group/sentence">
                            {sentence.en.split(' ').map((word, wIdx) => (
                                <span 
                                    key={wIdx} 
                                    onClick={(e) => handleWordClick(e, word)}
                                    className="cursor-pointer hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors px-0.5"
                                >
                                    {word}{' '}
                                </span>
                            ))}
                            {/* Marker for progress intersection */}
                            {sIdx === story.sentences.length - 1 && <span ref={lastWordRef} className="invisible">.</span>}
                        </span>
                    ))}
                </div>

                {isRead && (
                    <div className="mt-20 p-8 rounded-[2.5rem] bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 flex flex-col items-center text-center gap-4 animate-bounce-subtle">
                        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Icons.CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">{isAr ? 'تمت القراءة بنجاح!' : 'Story Completed!'}</h3>
                        <p className="text-emerald-600 font-bold">+50 XP Earned</p>
                        <button onClick={onBack} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:shadow-emerald-500/30 transition-all">
                            {isAr ? 'العودة للمكتبة' : 'Back to Library'}
                        </button>
                    </div>
                )}
            </div>

            {/* Word Tooltip - Uses fixed positioning to avoid viewport clipping */}
            {tooltip && (
                <div 
                    className="fixed z-[100] transform -translate-x-1/2 -translate-y-full mb-8 animate-scale-in"
                    style={{ 
                        // Smart positioning: ensure it stays within viewport margins
                        left: Math.max(120, Math.min(window.innerWidth - 120, tooltip.x)), 
                        top: tooltip.y - 12
                    }}
                >
                    <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-4 border border-slate-200 dark:border-slate-700 min-w-[220px] relative">
                        <button onClick={() => setTooltip(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs"><Icons.X size={12} /></button>
                        
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <span className="font-black text-indigo-600 dark:text-indigo-400 text-base">{tooltip.word}</span>
                            <button onClick={() => handlePlayAudio(tooltip.word)} className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"><Icons.Volume2 size={14}/></button>
                        </div>

                        {tooltip.loading ? (
                            <div className="py-4">
                                <Icons.RefreshCw className="animate-spin text-slate-300 mx-auto" size={20} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-xl font-ar text-slate-800 dark:text-white text-right" dir="rtl">{tooltip.translation}</p>
                                <p className="text-xs text-slate-400 italic leading-relaxed">"{tooltip.example}"</p>
                                
                                <button 
                                    onClick={handleSaveWord}
                                    disabled={savedInSession.has(tooltip.word)}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        savedInSession.has(tooltip.word) 
                                        ? 'bg-emerald-500/10 text-emerald-600 cursor-default' 
                                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700'
                                    }`}
                                >
                                    {savedInSession.has(tooltip.word) ? (
                                        <><Icons.Check size={12} /> Saved</>
                                    ) : (
                                        'Save Word'
                                    )}
                                </button>
                            </div>
                        )}
                        {/* Triangle decorator - Adjust its relative position if tooltip is pushed */}
                        <div 
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 border-r border-b border-slate-200 dark:border-slate-700"
                            style={{ 
                                left: `calc(50% + ${tooltip.x - Math.max(120, Math.min(window.innerWidth - 120, tooltip.x))}px)`
                            }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Selection Menu */}
            {selectionMenu && (
                <div 
                    className="fixed z-[100] transform -translate-x-1/2 -translate-y-full mb-8 flex gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl animate-scale-in"
                    style={{ 
                        left: Math.max(100, Math.min(window.innerWidth - 100, selectionMenu.x)), 
                        top: selectionMenu.y - 12 
                    }}
                >
                    <button onClick={() => handlePlayAudio(selectionMenu.text)} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all border-r border-white/10">
                        <Icons.Play size={14} /> Speak
                    </button>
                    <button onClick={handleTranslatePhrase} className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 text-white text-xs font-bold rounded-lg transition-all">
                        <Icons.Globe size={14} /> Translate
                    </button>
                </div>
            )}

            {/* Phrase Translation Overlay */}
            {translationOverlay && (
                <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setTranslationOverlay(null)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-2xl text-indigo-600">
                                <Icons.Globe size={24} />
                            </div>
                            <button onClick={() => setTranslationOverlay(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><Icons.X /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-slate-500 italic font-medium">"{translationOverlay.text}"</p>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
                            {translationOverlay.loading ? (
                                <div className="flex items-center gap-3 text-indigo-600 font-bold">
                                    <Icons.RefreshCw className="animate-spin" />
                                    <span>{isAr ? 'جاري الترجمة...' : 'Translating...'}</span>
                                </div>
                            ) : (
                                <p className="text-3xl font-ar text-slate-800 dark:text-white leading-relaxed text-right" dir="rtl">
                                    {translationOverlay.translation}
                                </p>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => handlePlayAudio(translationOverlay.text)}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                            <Icons.Volume2 /> {isAr ? 'استمع للنص' : 'Listen to Text'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
