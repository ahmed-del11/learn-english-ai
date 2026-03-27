import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icons } from './Icons';
import { T } from '../utils/constants';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { callAI } from '../utils/api';

const calculateLevel = (xp) => {
    if (xp < 500) return { name: 'Beginner (A1/A2)', ar: 'مبتدئ (A1/A2)', next: 500 };
    if (xp < 1500) return { name: 'Intermediate (B1/B2)', ar: 'متوسط (B1/B2)', next: 1500 };
    if (xp < 3000) return { name: 'Advanced (C1)', ar: 'متقدم (C1)', next: 3000 };
    return { name: 'Fluent (C2)', ar: 'طليق (C2)', next: 'Max' };
};

export default function Home({ state, dispatch, t }) {
    const isAr = state.lang === 'ar';
    const hour = new Date().getHours();
    const greeting = hour < 17 ? t('greeting') : t('greetingEve');
    const levelInfo = calculateLevel(state.xp);

    const dailyXP = state.xp % 100;
    const progressPercent = Math.min(100, (dailyXP / 100) * 100);

    // AI Voice Chat State
    const [isThinking, setIsThinking] = useState(false);
    const [translatingWord, setTranslatingWord] = useState(null);
    const [inputText, setInputText] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const chatEndRef = useRef(null);

    // Active Session Management
    const activeSession = useMemo(() => {
        let session = state.chatSessions.find(s => s.id === state.activeSessionId);
        if (!session && state.chatSessions.length > 0) {
            session = state.chatSessions[0];
        }
        return session;
    }, [state.chatSessions, state.activeSessionId]);

    useEffect(() => {
        if (!state.activeSessionId && state.chatSessions.length > 0) {
            dispatch({ type: 'SET_ACTIVE_CHAT_SESSION', payload: state.chatSessions[0].id });
        } else if (state.chatSessions.length === 0) {
            dispatch({ type: 'CREATE_CHAT_SESSION' });
        }
    }, [state.chatSessions, state.activeSessionId, dispatch]);

    const messages = activeSession ? activeSession.messages : [];

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleTranslateWord = async (word) => {
        const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
        if (!cleanWord) return;

        setTranslatingWord({ word: cleanWord, translation: '', loading: true });
        try {
            const prompt = `Translate the English word "${cleanWord}" to Arabic. Provide only the Arabic word or a very short phrase.`;
            const response = await callAI(prompt, "You are a helpful dictionary.");
            if (response) {
                setTranslatingWord({ word: cleanWord, translation: response, loading: false });
            }
        } catch (error) {
            console.error("Translation error:", error);
            setTranslatingWord(null);
        }
    };

    const processMessage = async (text) => {
        if (!text.trim() || !activeSession) return;
        
        const newMessages = [...messages, { role: 'user', text }];
        dispatch({ type: 'UPDATE_CHAT_SESSION', id: activeSession.id, messages: newMessages });
        setIsThinking(true);
        
        try {
            const systemPrompt = `You are a friendly and professional English teacher. 
            Keep your responses concise (1-3 sentences) to facilitate a natural conversation. 
            Always respond in English. If the user makes a mistake (grammar, spelling, etc.), gently correct them. 
            The user's current level is ${levelInfo.name}.`;
            
            const history = newMessages.map(m => `${m.role === 'ai' ? 'Assistant' : 'User'}: ${m.text}`).join('\n');
            const prompt = `${history}\nAssistant:`;
            
            const response = await callAI(prompt, systemPrompt);
            
            if (response) {
                const finalMessages = [...newMessages, { role: 'ai', text: response }];
                dispatch({ type: 'UPDATE_CHAT_SESSION', id: activeSession.id, messages: finalMessages });
                speak(response);
            }
        } catch (error) {
            console.error("AI Chat Error:", error);
        } finally {
            setIsThinking(false);
        }
    };

    const handleSpeechResult = useCallback(async (text, isFinal) => {
        if (isFinal && text.trim()) {
            processMessage(text);
        }
    }, [activeSession, levelInfo.name]);

    const { startListening, stopListening, isListening } = useSpeechRecognition(handleSpeechResult);

    const handleSendText = (e) => {
        e.preventDefault();
        if (inputText.trim() && !isThinking) {
            processMessage(inputText);
            setInputText('');
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const toggleVoice = () => {
        if (isListening) stopListening();
        else startListening();
    };

    const createNewSession = () => {
        dispatch({ type: 'CREATE_CHAT_SESSION' });
        setShowHistory(false);
    };

    return (
        <div className="space-y-6 page-transition-enter-active max-w-4xl mx-auto pb-24 relative">
            {/* Translation Popup */}
            {translatingWord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => setTranslatingWord(null)}>
                    <div className="glass p-6 rounded-[2rem] max-w-xs w-full text-center animate-scale-in border-2 border-indigo-500/30" onClick={e => e.stopPropagation()}>
                        <div className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-2">Translation</div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">{translatingWord.word}</div>
                        <div className="w-10 h-1 bg-indigo-500 mx-auto my-3 rounded-full"></div>
                        {translatingWord.loading ? (
                            <Icons.Loader className="animate-spin mx-auto text-indigo-500" />
                        ) : (
                            <div className="text-3xl font-ar font-bold text-indigo-600 dark:text-indigo-400">{translatingWord.translation}</div>
                        )}
                        <button onClick={() => setTranslatingWord(null)} className="mt-6 w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            )}

            {/* Header Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h1 className="text-3xl font-bold">{greeting}</h1>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">{isAr ? `أنت في مستوى ${levelInfo.ar}` : `You are at ${levelInfo.name} level`}</p>
                </div>
                <div className="flex gap-4">
                   <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2">
                       <Icons.Flame className="text-orange-500" />
                       <span className="font-bold text-lg text-orange-500">{state.streak}</span>
                   </div>
                   <div className="glass px-4 py-2 rounded-2xl flex flex-col justify-center min-w-[150px]">
                       <div className="flex justify-between text-sm mb-1">
                           <span>{t('xpToday')}</span>
                           <span className="font-bold text-indigo-600 dark:text-indigo-400">{dailyXP}/100</span>
                       </div>
                       <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                       </div>
                   </div>
                </div>
            </div>

            {/* AI Tutor Card */}
            <div className="glass rounded-[2.5rem] overflow-hidden border-2 border-indigo-500/20 shadow-2xl flex flex-col min-h-[750px] relative">
                <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all active:scale-95"
                        >
                            <Icons.RefreshCw className={`w-6 h-6 ${showHistory ? 'rotate-180' : ''} transition-transform duration-500`} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold">{t('aiTutorTitle')}</h2>
                            <p className="text-xs opacity-80">{activeSession?.name || t('aiTutorDesc')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={createNewSession}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                            title={t('newChat')}
                        >
                            <Icons.Check className="w-5 h-5 rotate-45" /> {/* Plus icon surrogate or use a real one */}
                        </button>
                        {isThinking && <Icons.Loader className="animate-spin" />}
                    </div>
                </div>

                <div className="flex-1 flex relative overflow-hidden">
                    {/* History Sidebar/Overlay */}
                    {showHistory && (
                        <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md animate-fade-in flex flex-col p-6 space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-black text-xl text-indigo-600 dark:text-indigo-400">{t('chatHistory')}</h3>
                                <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-slate-600"><Icons.X /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
                                {state.chatSessions.map(session => (
                                    <div 
                                        key={session.id} 
                                        onClick={() => {
                                            dispatch({ type: 'SET_ACTIVE_CHAT_SESSION', payload: session.id });
                                            setShowHistory(false);
                                        }}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex justify-between items-center group ${
                                            state.activeSessionId === session.id 
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold truncate">{session.name}</div>
                                            <div className="text-[10px] opacity-50 uppercase font-black">{session.messages.length} messages</div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(isAr ? 'حذف هذه المحادثة؟' : 'Delete this conversation?')) {
                                                    dispatch({ type: 'DELETE_CHAT_SESSION', payload: session.id });
                                                }
                                            }}
                                            className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Icons.X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={createNewSession}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                            >
                                {t('newChat')}
                            </button>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[600px] hide-scrollbar bg-slate-50/50 dark:bg-slate-900/20">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'} animate-fade-in group`}>
                                <div className={`relative max-w-[80%] p-4 rounded-3xl font-medium shadow-sm flex flex-col gap-2 ${
                                    m.role === 'ai' 
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none' 
                                    : 'bg-indigo-600 text-white rounded-br-none'
                                }`}>
                                    <div className="flex flex-wrap gap-x-1">
                                        {m.text.split(' ').map((word, i) => (
                                            <span 
                                                key={i} 
                                                onDoubleClick={() => handleTranslateWord(word)}
                                                className="cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors select-none"
                                                title="Double click to translate"
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    {m.role === 'ai' && (
                                        <button 
                                            onClick={() => speak(m.text)}
                                            className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Icons.Volume2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isListening && (
                            <div className="flex justify-end animate-pulse">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                    {t('listening')}
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Voice & Text Control */}
                <div className="p-6 flex flex-col gap-4 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                    <form onSubmit={handleSendText} className="flex gap-2 w-full">
                        <input 
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t('chatInputPlaceholder')}
                            className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border-2 border-transparent focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                        <button 
                            type="submit"
                            disabled={!inputText.trim() || isThinking}
                            className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            <Icons.Send className="w-6 h-6" />
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-2 pt-2">
                        <button 
                            onClick={toggleVoice}
                            disabled={isThinking}
                            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                                isListening 
                                ? 'bg-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] scale-110' 
                                : 'bg-slate-100 dark:bg-slate-900/50 hover:bg-slate-200 text-indigo-600 dark:text-indigo-400'
                            }`}
                        >
                            {isListening ? (
                                <div className="flex gap-1 items-end h-6">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-1 bg-white rounded-full animate-voice-bar" style={{ animationDelay: `${i*0.1}s` }}></div>
                                    ))}
                                </div>
                            ) : (
                                <Icons.Mic className="w-8 h-8" />
                            )}
                            
                            {isListening && (
                                <div className="absolute inset-0 rounded-full border-4 border-rose-500 animate-ping opacity-20"></div>
                            )}
                        </button>
                        <span className={`font-black tracking-wider uppercase text-[10px] ${isListening ? 'text-rose-500' : 'text-slate-400'}`}>
                            {isListening ? t('stopTalking') : t('tapToTalk')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
