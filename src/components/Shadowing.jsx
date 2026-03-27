import React, { useState, useRef, useCallback } from 'react';
import { Icons } from './Icons';
import { T } from '../utils/constants';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { callAI } from '../utils/api';

export default function Shadowing({ state, dispatch }) {
    const t = (key) => T[key][state.lang];
    const isAr = state.lang === 'ar';
    const [selectedSentence, setSelectedSentence] = useState(null);
    
    // Session State
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionSentences, setSessionSentences] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filters
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [generatingLevel, setGeneratingLevel] = useState(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [singleSentence, setSingleSentence] = useState('');

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeWordIndex, setActiveWordIndex] = useState(-1);
    
    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Speech Recognition
    const [transcript, setTranscript] = useState('');
    const [score, setScore] = useState(null);

    const calculateScore = (userText, originalText) => {
        if (!userText || !originalText) return 0;

        // Clean texts: remove punctuation and split into words
        const userWords = userText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);
        const originalWords = originalText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);

        if (originalWords.length === 0) return 0;

        let matches = 0;
        const userWordsSet = new Set(userWords);

        originalWords.forEach(word => {
            if (userWordsSet.has(word)) matches++;
        });

        const scoreValue = Math.round((matches / originalWords.length) * 100);
        return Math.min(100, scoreValue);
    };

    const handleSpeechResult = useCallback((text, isFinal) => {
        if (selectedSentence && text && text.trim()) {
            setTranscript(prev => {
                if (prev === text) return prev;
                const s = calculateScore(text, selectedSentence.english);
                setScore(s);
                return text;
            });
        }
    }, [selectedSentence]);

    const handleSpeechEnd = useCallback(() => {
        // Recognition ended
    }, []);

    const { startListening, stopListening, isListening, supported } = useSpeechRecognition(
        handleSpeechResult,
        handleSpeechEnd
    );

    const startSession = () => {
        const uncompleted = state.sentences.filter(s => !state.shadowingProgress.includes(s.id));
        let selected = uncompleted.slice(0, 5);
        
        if (selected.length < 5) {
            const completed = state.sentences.filter(s => state.shadowingProgress.includes(s.id))
                .sort(() => Math.random() - 0.5);
            selected = [...selected, ...completed].slice(0, 5);
        }
        
        selected = selected.sort(() => Math.random() - 0.5);
        
        setSessionSentences(selected);
        setCurrentIndex(0);
        setIsSessionActive(true);
        setSelectedSentence(selected[0]);
        setAudioURL(null);
        setTranscript('');
        setScore(null);
    };

    const nextSessionSentence = () => {
        if (currentIndex < sessionSentences.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setSelectedSentence(sessionSentences[nextIdx]);
            setAudioURL(null);
            setTranscript('');
            setScore(null);
            setIsPlaying(false);
            setActiveWordIndex(-1);
        } else {
            setIsSessionActive(false);
            setSelectedSentence(null);
        }
    };

    const prevSessionSentence = () => {
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            setSelectedSentence(sessionSentences[prevIdx]);
            setAudioURL(null);
            setTranscript('');
            setScore(null);
            setIsPlaying(false);
            setActiveWordIndex(-1);
        }
    };

    const handleNextNormal = () => {
        const sentences = filterLevel === 'All' ? state.sentences : state.sentences.filter(s => s.level === filterLevel);
        const idx = sentences.findIndex(s => s.id === selectedSentence.id);
        if (idx !== -1 && idx < sentences.length - 1) {
            setSelectedSentence(sentences[idx + 1]);
            setAudioURL(null);
            setTranscript('');
            setScore(null);
            setIsPlaying(false);
            setActiveWordIndex(-1);
        }
    };

    const handlePrevNormal = () => {
        const sentences = filterLevel === 'All' ? state.sentences : state.sentences.filter(s => s.level === filterLevel);
        const idx = sentences.findIndex(s => s.id === selectedSentence.id);
        if (idx > 0) {
            setSelectedSentence(sentences[idx - 1]);
            setAudioURL(null);
            setTranscript('');
            setScore(null);
            setIsPlaying(false);
            setActiveWordIndex(-1);
        }
    };

    const handlePlayOriginal = () => {
        if (!selectedSentence) return;
        window.speechSynthesis.cancel();
        setIsPlaying(true);
        setActiveWordIndex(-1);

        const utterance = new SpeechSynthesisUtterance(selectedSentence.english);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;

        const words = selectedSentence.english.split(' ');
        const totalTime = words.length * 400; 
        
        let wordIdx = 0;
        const interval = setInterval(() => {
            if (wordIdx < words.length) {
                setActiveWordIndex(wordIdx);
                wordIdx++;
            } else {
                clearInterval(interval);
                setIsPlaying(false);
                setActiveWordIndex(-1);
            }
        }, totalTime / words.length);

        utterance.onend = () => {
            clearInterval(interval);
            setIsPlaying(false);
            setActiveWordIndex(-1);
        };

        window.speechSynthesis.speak(utterance);
    };

    const toggleRecording = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            stopListening();
            setIsRecording(false);
        } else {
            try {
                setTranscript('');
                setScore(null);
                setAudioURL(null);
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = e => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    setAudioURL(URL.createObjectURL(audioBlob));
                    dispatch({ type: 'ADD_XP', payload: 20 });
                    dispatch({ type: 'MARK_SHADOWING_COMPLETE', payload: selectedSentence.id });
                };

                mediaRecorderRef.current.start();
                startListening();
                setIsRecording(true);
            } catch (err) {
                console.error("Recording error:", err);
                alert(isAr ? 'الرجاء السماح بالوصول للميكروفون' : 'Please allow microphone access.');
            }
        }
    };

    const handleGenerateShadowPack = async (levelName) => {
        setGeneratingLevel(levelName);
        try {
            const prompt = `Generate exactly 5 English sentences for shadowing practice at the ${levelName} level. Provide diverse topics. Respond exactly in the requested JSON format.`;
            
            const sentenceSchema = {
                type: "OBJECT",
                properties: {
                    sentences: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                english: { type: "STRING" },
                                arabic: { type: "STRING" },
                                words: { type: "ARRAY", items: { type: "STRING" } },
                                topic: { type: "STRING" }
                            },
                            required: ["english", "arabic", "words", "topic"]
                        }
                    }
                },
                required: ["sentences"]
            };

            const response = await callAI(prompt, "You are an expert English teacher creating conversational sentences for shadowing.", true, sentenceSchema);
            
            if (response && response.sentences && response.sentences.length > 0) {
                dispatch({ type: 'ADD_SENTENCES', payload: response.sentences, level: levelName });
                setFilterLevel(levelName);
            }
        } catch (error) {
            alert(isAr ? 'فشل تحميل الحزمة.' : 'Failed to load pack.');
        } finally {
            setGeneratingLevel(null);
        }
    };

    const handleAddSingleSentence = async () => {
        if (!singleSentence.trim() || isLookingUp) return;
        
        const cleanInput = singleSentence.trim();
        const existing = state.sentences.find(s => s.english.toLowerCase() === cleanInput.toLowerCase());
        if (existing) {
            alert(isAr ? 'هذه الجملة موجودة بالفعل!' : 'This sentence already exists!');
            setSingleSentence('');
            return;
        }

        setIsLookingUp(true);
        try {
            const prompt = `Enrich this English sentence for shadowing: "${cleanInput}". 
            Provide the Arabic translation, a list of 3-5 key words from the sentence, and a short topic tag (e.g., Daily Life, Travel, Business).
            Respond exactly in the requested JSON format.`;
            
            const schema = {
                type: "OBJECT",
                properties: {
                    english: { type: "STRING" },
                    arabic: { type: "STRING" },
                    words: { type: "ARRAY", items: { type: "STRING" } },
                    topic: { type: "STRING" }
                },
                required: ["english", "arabic", "words", "topic"]
            };

            const response = await callAI(prompt, "You are a helpful English teacher.", true, schema);
            
            if (response && response.arabic) {
                dispatch({ 
                    type: 'ADD_SENTENCES', 
                    payload: [{
                        ...response,
                        english: cleanInput // Ensure we use the user's input casing if preferred, or the enriched one
                    }]
                });
                setSingleSentence('');
            }
        } catch (error) {
            alert(isAr ? 'تعذر تحميل الجملة. حاول مرة أخرى.' : 'Could not enrich sentence. Try again.');
        } finally {
            setIsLookingUp(false);
        }
    };


    if (!selectedSentence) {
        const displayedSentences = filterLevel === 'All' ? state.sentences : state.sentences.filter(s => s.level === filterLevel);
        
        return (
            <div className="space-y-6 page-transition-enter-active">
                <div className="flex-1 flex justify-between items-center bg-purple-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 text-9xl opacity-20"><Icons.Mic /></div>
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold">{t('shadowing')}</h2>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => handleGenerateShadowPack(filterLevel === 'All' ? 'Beginner' : filterLevel)}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                                    title="Reload Level"
                                >
                                    <Icons.RefreshCw className={`w-4 h-4 ${generatingLevel ? 'animate-spin' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm(isAr ? 'هل أنت متأكد من حذف جميع الجمل؟' : 'Clear all sentences?')) {
                                            dispatch({ type: 'CLEAR_ALL_SENTENCES' });
                                        }
                                    }}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-rose-500/40 transition-colors text-white"
                                    title="Clear All"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="opacity-80 text-sm">
                            {state.shadowingProgress.length} / {state.sentences.length} {t('shadowSentencesCompleted')}
                        </p>
                    </div>
                    <button onClick={startSession} className="relative z-10 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105">
                        {t('startSession')}
                    </button>
                </div>

                {/* 🔍 Search and Manual Entry Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Icons.TrendingUp className="text-indigo-500" />
                        <h2 className="text-xl font-bold">{t('browseSentences')}</h2>
                    </div>
                    
                    {/* Filter Pills */}
                    <div className="flex overflow-x-auto gap-2 w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                        {['All', 'Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                            <button 
                                key={lvl} 
                                onClick={() => setFilterLevel(lvl)}
                                className={`px-4 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all ${filterLevel === lvl ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                {lvl === 'All' ? t('shadowFilterAll') : lvl}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ✍️ Manual Sentence Entry Bar */}
                <div className="glass p-3 md:p-4 rounded-3xl border border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col sm:flex-row gap-3 items-center">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xl">🔎</span>
                    </div>
                    <input 
                        type="text"
                        value={singleSentence}
                        onChange={(e) => setSingleSentence(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSingleSentence()}
                        placeholder={isAr ? 'اكتب جملة بالإنجليزية...' : 'Type English sentence...'}
                        className="flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 font-bold placeholder:text-slate-400/60 w-full"
                    />
                    <button 
                        onClick={handleAddSingleSentence}
                        disabled={!singleSentence.trim() || isLookingUp}
                        className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {isLookingUp ? <Icons.Loader className="w-5 h-5 animate-spin" /> : <Icons.Sparkles className="w-5 h-5" />}
                        <span className="sm:hidden lg:inline">{isAr ? 'إضافة' : 'Add'}</span>
                    </button>
                </div>

                {/* 🔍 Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder={isAr ? 'ابحث في جملك...' : 'Search sentences...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold"
                        />
                    </div>
                </div>

                {/* ✨ AI Infinite Shadow Packs */}
                <div className="glass p-5 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Icons.Sparkles className="text-indigo-500" />
                        <h3 className="font-bold text-sm md:text-base">{t('shadowPacks')}</h3>
                    </div>
                    <div className="flex flex-1 gap-2 overflow-x-auto w-full hide-scrollbar">
                        <button onClick={() => handleGenerateShadowPack('Beginner')} disabled={generatingLevel !== null} className="flex-1 min-w-[120px] p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                            {generatingLevel === 'Beginner' ? <Icons.Loader className="animate-spin" /> : <Icons.DownloadCloud className="opacity-50" />} {t('packBeginner').replace('10', '5')}
                        </button>
                        <button onClick={() => handleGenerateShadowPack('Intermediate')} disabled={generatingLevel !== null} className="flex-1 min-w-[120px] p-3 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                            {generatingLevel === 'Intermediate' ? <Icons.Loader className="animate-spin" /> : <Icons.DownloadCloud className="opacity-50" />} {t('packIntermediate').replace('10', '5')}
                        </button>
                        <button onClick={() => handleGenerateShadowPack('Advanced')} disabled={generatingLevel !== null} className="flex-1 min-w-[120px] p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                            {generatingLevel === 'Advanced' ? <Icons.Loader className="animate-spin" /> : <Icons.DownloadCloud className="opacity-50" />} {t('packAdvanced').replace('10', '5')}
                        </button>
                    </div>
                </div>

                {/* Sentences Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {displayedSentences.filter(s => 
                        s.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.arabic.includes(searchTerm) ||
                        s.topic.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((s, idx) => {
                        const isCompleted = state.shadowingProgress.includes(s.id);
                        return (
                        <div 
                            key={idx} 
                            onClick={() => { 
                                if ('speechSynthesis' in window) {
                                    const ut = new SpeechSynthesisUtterance(s.english);
                                    ut.lang = 'en-US';
                                    window.speechSynthesis.speak(ut);
                                }
                                setSelectedSentence(s); 
                                setAudioURL(null); 
                            }} 
                            className={`glass p-6 rounded-2xl text-left cursor-pointer hover:border-indigo-500 transition-all flex justify-between items-center group active:scale-[0.98] ${isCompleted ? 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10' : ''}`}
                        >
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{s.topic}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${s.level === 'Beginner' ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' : s.level === 'Intermediate' ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' : 'text-rose-600 bg-rose-100 dark:bg-rose-900/30'}`}>{s.level}</span>
                                </div>
                                <p className={`font-bold text-lg mb-1 transition-colors ${isCompleted ? 'text-slate-700 dark:text-slate-300' : 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{s.english}</p>
                                <p className="font-ar text-slate-500 text-sm">{s.arabic}</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                {isCompleted && <Icons.CheckCircle className="text-green-500" />}
                                <div className={`text-slate-300 group-hover:text-indigo-500 transition-colors ${isCompleted ? 'opacity-50' : ''}`}>
                                    {state.lang === 'ar' ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 page-transition-enter-active pb-12">
            {isSessionActive ? (
                <div className="w-full flex items-center justify-between px-4">
                    <button onClick={() => { setIsSessionActive(false); setSelectedSentence(null); }} className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 font-bold transition-colors">
                        <Icons.X className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wider">{t('exitSession')}</span>
                    </button>
                    <div className="flex gap-1">
                        {sessionSentences.map((_, i) => (
                            <div key={i} className={`h-2 w-6 rounded-full transition-all duration-500 ${i < currentIndex ? 'bg-purple-500' : i === currentIndex ? 'bg-purple-300 animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                        ))}
                    </div>
                    <span className="text-sm font-bold text-slate-500">{currentIndex + 1}/{sessionSentences.length}</span>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <button onClick={() => setSelectedSentence(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors font-bold">
                        {isAr ? <Icons.ChevronRight /> : <Icons.ChevronLeft />} {t('back')}
                    </button>
                    
                    <div className="flex gap-2">
                        <button onClick={handlePrevNormal} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-90">
                            {isAr ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
                        </button>
                        <button onClick={handleNextNormal} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-90">
                            {isAr ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
                        </button>
                    </div>
                </div>
            )}

            <div className="glass p-8 rounded-3xl text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                
                <div className="text-3xl md:text-4xl font-bold leading-relaxed mb-6 flex flex-wrap justify-center gap-x-2">
                    {(selectedSentence.english.split(' ')).map((word, i) => (
                        <span key={i} className={`transition-colors duration-200 ${i === activeWordIndex ? 'text-indigo-500 drop-shadow-md scale-110 inline-block' : 'text-slate-800 dark:text-slate-100'}`}>
                            {word}
                        </span>
                    ))}
                </div>
                <p className="text-xl font-ar text-slate-500 dark:text-slate-400 mb-8" dir="rtl">{selectedSentence.arabic}</p>

                <div className="flex flex-col items-center gap-6">
                    <button onClick={handlePlayOriginal} disabled={isPlaying} className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${isPlaying ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-1'}`}>
                        {isPlaying ? <Icons.Pause /> : <Icons.Play />} {t('playOriginal')}
                    </button>

                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-light-base dark:bg-dark-base px-2 text-sm text-slate-400">or</span>
                    </div>

                    <button onClick={toggleRecording} className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all ${isRecording ? 'bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)]' : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                        {isRecording ? (
                            <div className="w-8 h-8 bg-white rounded-sm animate-pulse"></div>
                        ) : (
                            <Icons.Mic className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                        )}
                        {isRecording && <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-20"></div>}
                    </button>
                    <span className="text-sm font-semibold">{isRecording ? t('stop') : t('record')}</span>

                    {score !== null && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <div className={`text-4xl font-black transition-all duration-300 ${score > 80 ? 'text-green-500 scale-110' : score > 50 ? 'text-orange-500' : 'text-rose-500'}`}>
                                {score}%
                            </div>
                            <p className="text-sm text-slate-500 italic max-w-xs break-words">
                                "{transcript}"
                            </p>
                        </div>
                    )}

                    {audioURL && (
                        <div className="mt-4 p-4 glass rounded-2xl w-full flex flex-col md:flex-row items-center justify-between animate-float-up gap-4">
                            <div className="flex items-center gap-4">
                                <span className="font-semibold flex items-center gap-2"><Icons.Check className="text-green-500"/> {t('playYours')}</span>
                                <audio src={audioURL} controls className="h-10 w-48 custom-audio"></audio>
                            </div>
                        </div>
                    )}

                    {isSessionActive && (
                        <div className="flex w-full gap-3 mt-4">
                            <button 
                                onClick={prevSessionSentence} 
                                disabled={currentIndex === 0}
                                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                            >
                                {isAr ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
                                {isAr ? 'السابق' : 'Previous'}
                            </button>
                            <button 
                                onClick={nextSessionSentence} 
                                className="flex-[2] px-8 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                            >
                                {currentIndex === sessionSentences.length - 1 ? t('finishSession') : t('nextSentence')}
                                {isAr ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
