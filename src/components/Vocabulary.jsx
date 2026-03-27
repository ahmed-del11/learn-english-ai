import React, { useState } from 'react';
import { Icons } from './Icons';
import { T } from '../utils/constants';
import Flashcard from './Flashcard';
import { callAI } from '../utils/api';

export default function Vocabulary({ state, dispatch }) {
    const t = (key) => T[key][state.lang];
    const isAr = state.lang === 'ar';
    
    // Simple Session Logic
    const [sessionWords, setSessionWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSessionActive, setIsSessionActive] = useState(false);

    // AI Generator State
    const [aiTopic, setAiTopic] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [generatingLevel, setGeneratingLevel] = useState(null); // tracking level packs

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');
    const [visibleCount, setVisibleCount] = useState(25);

    const filteredWords = state.words.filter(w => {
        const matchesSearch = w.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             w.arabic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = filterLevel === 'All' || w.level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    const displayedWords = filteredWords.slice(0, visibleCount);

    const handleGenerateAI = async () => {
        if (!aiTopic.trim()) return;
        setIsGeneratingAI(true);
        try {
            const wordSchema = {
                type: "OBJECT",
                properties: {
                    words: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                english: { type: "STRING" },
                                arabic: { type: "STRING" },
                                emoji: { type: "STRING" },
                                phonetic: { type: "STRING" },
                                example_en: { type: "STRING" },
                                example_ar: { type: "STRING" }
                            },
                            required: ["english", "arabic", "emoji", "phonetic", "example_en", "example_ar"]
                        }
                    }
                },
                required: ["words"]
            };

            const existingWords = state.words.slice(0, 50).map(w => w.english).join(', ');
            const prompt = `Generate exactly 10 unique English vocabulary words related to the topic: "${aiTopic}". For each word, provide:
1. The English word
2. Arabic translation
3. IPA Phonetic spelling
4. A relevant emoji
5. A simple example sentence in English
6. The Arabic translation of that example sentence.
DO NOT include any of the following already known words: [${existingWords}].
Ensure they follow the requested JSON schema exactly.`;
            const response = await callAI(prompt, "You are an expert English teacher creating vocabulary lists.", true, wordSchema);
            
            if (response && response.words && response.words.length > 0) {
                dispatch({ type: 'ADD_WORDS', payload: response.words, level: 'Custom' });
                setAiTopic(''); // Clear input on success
                // Add success feedback (optional alert or UI change)
            }
        } catch (error) {
            alert(isAr ? 'فشل توليد الكلمات. يرجى المحاولة مرة أخرى.' : 'Failed to generate words. Please try again.');
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleGenerateLevelPack = async (levelName) => {
        setGeneratingLevel(levelName);
        try {
            const wordSchema = {
                type: "OBJECT",
                properties: {
                    words: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                english: { type: "STRING" },
                                arabic: { type: "STRING" },
                                emoji: { type: "STRING" },
                                phonetic: { type: "STRING" },
                                example_en: { type: "STRING" },
                                example_ar: { type: "STRING" }
                            },
                            required: ["english", "arabic", "emoji", "phonetic", "example_en", "example_ar"]
                        }
                    }
                },
                required: ["words"]
            };

            const existingWords = state.words.slice(0, 50).map(w => w.english).join(', ');
            const prompt = `Generate exactly 10 unique English vocabulary words suitable for a ${levelName} level English learner. For each word, provide:
1. The English word
2. Arabic translation
3. IPA Phonetic spelling
4. A relevant emoji
5. A simple example sentence in English
6. The Arabic translation of that example sentence.
DO NOT include any of the following already known words: [${existingWords}].
Ensure they follow the requested JSON schema exactly.`;
            const response = await callAI(prompt, "You are an expert English teacher building a dynamic dictionary.", true, wordSchema);
            
            if (response && response.words && response.words.length > 0) {
                dispatch({ type: 'ADD_WORDS', payload: response.words, level: levelName });
            }
        } catch (error) {
            alert(isAr ? 'فشل تحميل الحزمة.' : 'Failed to load pack.');
        } finally {
            setGeneratingLevel(null);
        }
    };

    const startSession = () => {
        const now = new Date();
        const due = state.words.filter(w => w.next_review && new Date(w.next_review) <= now);
        const newWords = state.words.filter(w => !w.learned).slice(0, 10 - due.length);
        let selected = [...due, ...newWords].slice(0, 10);
        if (selected.length === 0) selected = state.words.slice(0, 10);
        
        selected = selected.sort(() => Math.random() - 0.5);
        setSessionWords(selected);
        setCurrentIndex(0);
        setIsSessionActive(true);
    };

    const handleResult = (knewIt, event) => {
        const word = sessionWords[currentIndex];
        let nextReviewDate = new Date();
        
        if (knewIt) {
            dispatch({ type: 'ADD_XP', payload: word.learned ? 5 : 10, event });
            const intervals = [1, 3, 7, 14, 30]; 
            const nextInterval = intervals[Math.min(word.repetition_count, intervals.length - 1)];
            nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
            
            dispatch({ type: 'UPDATE_WORD', payload: { ...word, learned: true, repetition_count: word.repetition_count + 1, next_review: nextReviewDate.toISOString() }});
        } else {
            nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 10);
            dispatch({ type: 'UPDATE_WORD', payload: { ...word, repetition_count: Math.max(0, word.repetition_count - 1), next_review: nextReviewDate.toISOString() }});
        }

        if (currentIndex < sessionWords.length - 1) setCurrentIndex(prev => prev + 1);
        else setIsSessionActive(false);
    };

    if (isSessionActive) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] page-transition-enter-active">
                <div className="w-full max-w-sm mb-8 flex items-center justify-between px-4">
                    <button onClick={() => setIsSessionActive(false)} className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 font-bold transition-colors">
                        <Icons.X className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">{t('exitSession')}</span>
                    </button>
                    <div className="flex gap-1">
                        {sessionWords.map((_, i) => (
                            <div key={i} className={`h-2 w-6 rounded-full transition-all duration-500 ${i < currentIndex ? 'bg-indigo-500' : i === currentIndex ? 'bg-indigo-300 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        ))}
                    </div>
                    <span className="text-sm font-bold text-slate-500">{currentIndex + 1}/{sessionWords.length}</span>
                </div>
                <Flashcard word={sessionWords[currentIndex]} onResult={handleResult} t={t} isAr={isAr} />
            </div>
        );
    }

    return (
        <div className="space-y-6 page-transition-enter-active">
            <div className="flex-1 flex justify-between items-center bg-indigo-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-9xl opacity-20"><Icons.Book /></div>
                <div className="relative z-10 flex-1">
                    <h2 className="text-2xl font-bold mb-1">{t('vocab')}</h2>
                    <div className="flex items-center gap-4">
                        <p className="opacity-80 text-sm">{state.words.filter(w=>w.learned).length} / {state.words.length} {isAr ? 'كلمة في القاموس' : 'words in dictionary'}</p>
                        <button 
                            onClick={() => {
                                if (window.confirm(isAr ? 'هل أنت متأكد من مسح جميع الكلمات المضافة والبدء من جديد؟' : 'Are you sure you want to clear all added words and start fresh?')) {
                                    dispatch({ type: 'RESET_WORDS' });
                                }
                            }}
                            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors group relative"
                            title={isAr ? 'إعادة ضبط القاموس' : 'Reset Dictionary'}
                        >
                            <Icons.RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
                <button onClick={startSession} className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105">
                    {t('startSession')}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(25); }}
                        placeholder={t('searchPlaceholder')}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar">
                    {['All', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                        <button 
                            key={lvl} 
                            onClick={() => { setFilterLevel(lvl); setVisibleCount(25); }}
                            className={`px-6 py-3 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border ${filterLevel === lvl ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                        >
                            {lvl === 'All' ? t('filterAll') : lvl}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass p-6 rounded-3xl border border-indigo-500/30">
                <div className="flex items-center gap-2 mb-4">
                    <Icons.Sparkles className="text-indigo-500" />
                    <h3 className="font-bold text-lg">{t('levelPacks')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                        <button 
                            key={lvl} 
                            onClick={() => handleGenerateLevelPack(lvl)} 
                            disabled={generatingLevel !== null} 
                            className="p-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/10 hover:bg-slate-800 font-bold transition-all flex justify-between items-center disabled:opacity-50"
                        >
                            {t(`pack${lvl}`)}
                            {generatingLevel === lvl ? <Icons.Loader className="animate-spin" /> : <Icons.DownloadCloud className="opacity-50" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between border border-purple-500/30">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-600 dark:bg-purple-900/50 p-3 rounded-xl">
                        <Icons.Sparkles />
                    </div>
                    <h3 className="font-bold text-lg">{t('aiGeneratorTitle')}</h3>
                </div>
                <div className="flex flex-1 w-full md:max-w-md gap-2">
                    <input 
                        type="text" 
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder={t('aiTopicPrompt')}
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-transparent focus:border-purple-500 outline-none transition-all"
                    />
                    <button 
                        onClick={handleGenerateAI} 
                        disabled={isGeneratingAI || !aiTopic.trim()} 
                        className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/30 disabled:opacity-50"
                    >
                        {isGeneratingAI ? <Icons.Loader className="animate-spin" /> : <Icons.Sparkles />} 
                        {isGeneratingAI ? t('generatingBtn') : t('generateBtn')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedWords.map((w, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => {
                            if ('speechSynthesis' in window) {
                                const ut = new SpeechSynthesisUtterance(w.english);
                                ut.lang = 'en-US';
                                window.speechSynthesis.speak(ut);
                            }
                        }}
                        className={`glass p-4 rounded-2xl flex flex-col items-center text-center transition-all cursor-pointer hover:border-indigo-500 active:scale-95 relative ${w.learned ? 'border-green-500/30' : ''}`}
                    >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{w.emoji}</span>
                        <span className="font-bold">{w.english}</span>
                        <span className="text-xs mt-1 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-500">{w.level}</span>
                        <span className="text-sm font-ar text-slate-500 dark:text-slate-400 mt-1">{w.arabic}</span>
                        {w.learned && <div className="absolute top-2 right-2 text-green-500"><Icons.Check /></div>}
                    </div>
                ))}
            </div>

            {filteredWords.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <Icons.Search className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">{t('noWordsFound')}</p>
                </div>
            )}

            {filteredWords.length > visibleCount && (
                <div className="flex justify-center pt-4">
                    <button 
                        onClick={() => setVisibleCount(prev => prev + 25)}
                        className="px-10 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-black text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                        {t('loadMore')}
                    </button>
                </div>
            )}
        </div>
    );
}
