import React, { useReducer, useEffect, useRef, useCallback } from 'react';
import { loadFromSupabase, saveToSupabase } from './utils/sync';

import { Icons } from './components/Icons';
import { T, INITIAL_WORDS, SENTENCES } from './utils/constants';
import Home from './components/Home';
import Vocabulary from './components/Vocabulary';
import Shadowing from './components/Shadowing';
import Quizzes from './components/Quizzes';
import Progress from './components/Progress';
import Profile from './components/Profile';

const initialState = {
    lang: 'en',
    theme: 'dark',
    xp: parseInt(localStorage.getItem('fluentup_xp') || '0'),
    streak: parseInt(localStorage.getItem('fluentup_streak') || '0'),
    lastStudyDate: localStorage.getItem('fluentup_last_study_date') || null,
    words: JSON.parse(localStorage.getItem('fluentup_words') || JSON.stringify(INITIAL_WORDS)),
    sentences: JSON.parse(localStorage.getItem('fluentup_sentences') || JSON.stringify(SENTENCES)),
    shadowingProgress: JSON.parse(localStorage.getItem('fluentup_shadowing_progress') || '[]'),
    quizHistory: JSON.parse(localStorage.getItem('fluentup_quiz_history') || '[]'),
    chatSessions: JSON.parse(localStorage.getItem('fluentup_chat_sessions') || '[]'),
    activeSessionId: localStorage.getItem('fluentup_active_session_id') ? parseInt(localStorage.getItem('fluentup_active_session_id')) : null,
    activeTab: 'home',
    user: JSON.parse(localStorage.getItem('fluentup_user') || 'null'),
    nudgeDismissed: localStorage.getItem('fluentup_nudge_dismissed') === 'true',
};

function reducer(state, action) {
    let newState = { ...state };
    switch (action.type) {
        case 'LOGIN':
            newState.user = action.payload;
            break;
        case 'LOGOUT':
            newState.user = null;
            break;
        case 'UPDATE_USER':
            newState.user = { ...state.user, ...action.payload };
            break;
        case 'TOGGLE_LANG':
            newState.lang = state.lang === 'en' ? 'ar' : 'en';
            break;
        case 'TOGGLE_THEME':
            newState.theme = state.theme === 'dark' ? 'light' : 'dark';
            break;
        case 'SET_TAB':
            newState.activeTab = action.payload;
            break;
        case 'DISMISS_NUDGE':
            newState.nudgeDismissed = true;
            break;
        case 'ADD_XP':
            newState.xp += action.payload;
            const today = new Date().toDateString();
            if (state.lastStudyDate !== today) {
                newState.streak += 1;
                newState.lastStudyDate = today;
            }
            break;
        case 'UPDATE_WORD':
            newState.words = state.words.map(w => w.id === action.payload.id ? action.payload : w);
            break;
        case 'ADD_WORDS':
            const existingWordSet = new Set(state.words.map(w => w.english.toLowerCase()));
            const maxId = state.words.length > 0 ? Math.max(...state.words.map(w => w.id)) : 0;
            
            const wordsToAdd = action.payload
                .filter(w => !existingWordSet.has(w.english.toLowerCase()))
                .map((w, index) => ({
                    ...w,
                    id: maxId + index + 1,
                    learned: false,
                    repetition_count: 0,
                    next_review: null,
                    level: action.level || "Custom",
                    category: "AI Generated"
                }));
            
            newState.words = [...wordsToAdd, ...state.words];
            break;
        case 'RESET_WORDS':
            newState.words = INITIAL_WORDS;
            break;
        case 'CLEAR_ALL_WORDS':
            newState.words = [];
            break;
        case 'ADD_SENTENCES':
            const maxSId = state.sentences.length > 0 ? Math.max(...state.sentences.map(s => s.id)) : 0;
            const sentencesToAdd = action.payload.map((s, index) => ({
                ...s,
                id: maxSId + index + 1,
                level: action.level
            }));
            newState.sentences = [...sentencesToAdd, ...state.sentences];
            break;
        case 'MARK_SHADOWING_COMPLETE':
            if (!newState.shadowingProgress.includes(action.payload)) {
                newState.shadowingProgress = [...newState.shadowingProgress, action.payload];
            }
            break;
        case 'SAVE_QUIZ_RESULT':
            newState.quizHistory = [action.payload, ...state.quizHistory].slice(0, 50);
            break;
        case 'CREATE_CHAT_SESSION':
            const newSession = {
                id: Date.now(),
                name: action.payload || `Session ${state.chatSessions.length + 1}`,
                messages: [{ role: 'ai', text: "Hello! I am your AI English Tutor. How can I help you practice your English today?" }]
            };
            newState.chatSessions = [newSession, ...state.chatSessions];
            newState.activeSessionId = newSession.id;
            break;
        case 'UPDATE_CHAT_SESSION':
            newState.chatSessions = state.chatSessions.map(s => 
                s.id === action.id ? { ...s, messages: action.messages } : s
            );
            break;
        case 'SET_ACTIVE_CHAT_SESSION':
            newState.activeSessionId = action.payload;
            break;
        case 'DELETE_CHAT_SESSION':
            newState.chatSessions = state.chatSessions.filter(s => s.id !== action.payload);
            if (newState.activeSessionId === action.payload) {
                newState.activeSessionId = newState.chatSessions.length > 0 ? newState.chatSessions[0].id : null;
            }
            break;
        case 'HYDRATE':
            // Merge cloud data over local state — cloud wins
            return {
                ...state,
                ...action.payload,
                user: state.user, // keep already-set user object
                activeTab: state.activeTab,
                nudgeDismissed: state.nudgeDismissed,
            };
        default:
            return state;
    }
    localStorage.setItem('fluentup_xp', newState.xp);
    localStorage.setItem('fluentup_streak', newState.streak);
    if (newState.lastStudyDate) localStorage.setItem('fluentup_last_study_date', newState.lastStudyDate);
    localStorage.setItem('fluentup_words', JSON.stringify(newState.words));
    localStorage.setItem('fluentup_sentences', JSON.stringify(newState.sentences));
    localStorage.setItem('fluentup_shadowing_progress', JSON.stringify(newState.shadowingProgress));
    localStorage.setItem('fluentup_quiz_history', JSON.stringify(newState.quizHistory));
    localStorage.setItem('fluentup_chat_sessions', JSON.stringify(newState.chatSessions));
    if (newState.activeSessionId) localStorage.setItem('fluentup_active_session_id', newState.activeSessionId);
    localStorage.setItem('fluentup_user', JSON.stringify(newState.user));
    localStorage.setItem('fluentup_nudge_dismissed', newState.nudgeDismissed);
    return newState;
}

export default function App() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const saveTimerRef = useRef(null);

    // Auto-save to Supabase (debounced 1.5s) whenever state changes
    useEffect(() => {
        if (!state.user?.id) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveToSupabase(state.user.id, state);
        }, 1500);
        return () => clearTimeout(saveTimerRef.current);
    }, [state.xp, state.streak, state.words, state.sentences,
        state.shadowingProgress, state.quizHistory, state.chatSessions, state.user]);

    useEffect(() => {
        if (state.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    }, [state.theme, state.lang]);

    const googleInitStarted = React.useRef(false);
    const googleButtonRef = React.useRef(null);
    const googleNudgeButtonRef = React.useRef(null);

    useEffect(() => {
        if (!googleInitStarted.current && window.google) {
            googleInitStarted.current = true;
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                use_fedcm_for_prompt: false,
                callback: async (response) => {
                    try {
                        const payload = JSON.parse(atob(response.credential.split('.')[1]));
                        const user = {
                            id: payload.sub,
                            name: payload.name,
                            email: payload.email,
                            picture: payload.picture
                        };
                        dispatch({ type: 'LOGIN', payload: user });
                        // Load cloud data and hydrate state
                        const cloudData = await loadFromSupabase(user.id);
                        if (cloudData) {
                            dispatch({ type: 'HYDRATE', payload: {
                                xp: cloudData.xp ?? 0,
                                streak: cloudData.streak ?? 0,
                                lastStudyDate: cloudData.last_study_date ?? null,
                                words: cloudData.words ?? [],
                                sentences: cloudData.sentences ?? [],
                                shadowingProgress: cloudData.shadowing_progress ?? [],
                                quizHistory: cloudData.quiz_history ?? [],
                                chatSessions: cloudData.chat_sessions ?? [],
                            }});
                        }
                    } catch (e) { console.error(e); }
                }
            });
        }

        if (window.google && !state.user) {
            if (googleButtonRef.current) {
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    theme: state.theme === 'dark' ? 'filled_black' : 'outline',
                    size: 'large',
                    shape: 'pill',
                    width: 232
                });
            }
            if (googleNudgeButtonRef.current) {
                window.google.accounts.id.renderButton(googleNudgeButtonRef.current, {
                    theme: 'filled_blue',
                    size: 'medium',
                    shape: 'pill'
                });
            }
            window.google.accounts.id.prompt(); 
        }
    }, [state.user, state.theme]);

    const t = (key) => T[key] ? T[key][state.lang] : key;
    const isAr = state.lang === 'ar';

    const navItems = [
        { id: 'home', icon: Icons.Home, label: t('home') },
        { id: 'vocab', icon: Icons.Book, label: t('vocab') },
        { id: 'shadowing', icon: Icons.Mic, label: t('shadowing') },
        { id: 'quizzes', icon: Icons.Brain, label: t('quizzes') },
        { id: 'progress', icon: Icons.TrendingUp, label: t('progress') }
    ];

    return (
        <div className={`min-h-screen flex flex-col md:flex-row ${state.lang === 'ar' ? 'font-ar' : 'font-en'}`}>
            <nav className="glass sticky top-0 md:h-screen w-full md:w-64 z-50 flex md:flex-col p-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start w-full gap-8">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-2xl tracking-tighter">
                        <Icons.Globe className="w-8 h-8" />
                        <span className="hidden md:block">{t('appName')}</span>
                    </div>
                    <div className="flex md:w-full gap-2">
                        <button onClick={() => dispatch({ type: 'TOGGLE_LANG' })} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm w-10 h-10 flex items-center justify-center transition-colors">
                            {state.lang === 'en' ? 'ع' : 'EN'}
                        </button>
                        <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 w-10 h-10 flex items-center justify-center transition-colors">
                            {state.theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex flex-col gap-2 mt-10 w-full">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => dispatch({ type: 'SET_TAB', payload: item.id })}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl font-semibold transition-all ${state.activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            <item.icon className="w-5 h-5" /> {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 hidden md:block"></div>

                <div className="hidden md:flex flex-col gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                    {state.user ? (
                        <div 
                          onClick={() => dispatch({ type: 'SET_TAB', payload: 'profile' })}
                          className={`flex items-center gap-3 p-2 group rounded-2xl border transition-all cursor-pointer ${state.activeTab === 'profile' ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40'}`}
                        >
                            <img src={state.user.picture} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-white dark:ring-slate-800" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${state.activeTab === 'profile' ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{state.user.name}</p>
                                <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'LOGOUT' }); }} className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${state.activeTab === 'profile' ? 'text-indigo-200 hover:text-white' : 'text-rose-500 hover:text-rose-600'}`}>
                                    <Icons.LogOut className="w-3 h-3" /> {isAr ? 'خروج' : 'Log out'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div ref={googleButtonRef} className="w-full flex justify-center"></div>
                    )}
                </div>
            </nav>

            <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto w-full max-w-6xl mx-auto relative lg:flex lg:flex-col lg:items-center">
                <div className="w-full">
                    {state.activeTab === 'home' && <Home state={state} dispatch={dispatch} t={t} />}
                    {state.activeTab === 'vocab' && <Vocabulary state={state} dispatch={dispatch} t={t} />}
                    {state.activeTab === 'shadowing' && <Shadowing state={state} dispatch={dispatch} t={t} />}
                    {state.activeTab === 'quizzes' && <Quizzes state={state} dispatch={dispatch} t={t} />}
                    {state.activeTab === 'progress' && <Progress state={state} dispatch={dispatch} t={t} />}
                    {state.activeTab === 'profile' && <Profile state={state} dispatch={dispatch} t={t} />}
                </div>

                {!state.user && !state.nudgeDismissed && (
                    <div className="fixed bottom-[5.5rem] md:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg glass p-3 md:p-4 rounded-2xl border border-indigo-500/30 flex items-center gap-3 animate-slide-up shadow-2xl z-40 bg-white/90 dark:bg-slate-900/90">
                         <button
                            onClick={() => dispatch({ type: 'DISMISS_NUDGE' })}
                            className="absolute top-2 right-2 rtl:right-auto rtl:left-2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                            aria-label="Dismiss"
                         >
                            <Icons.X className="w-3.5 h-3.5" />
                         </button>
                         <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                            <Icons.Sparkles className="w-4 h-4" />
                         </div>
                         <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-black text-slate-800 dark:text-white">{isAr ? 'احفظ تقدمك!' : 'Save your progress!'}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{isAr ? 'سجل مع جوجل لحفظ الـ XP والكلمات.' : 'Sign in to sync your XP and words.'}</p>
                         </div>
                         <div ref={googleNudgeButtonRef} className="shrink-0 scale-90 origin-right"></div>
                    </div>
                )}
            </main>

            <nav className="md:hidden glass fixed bottom-0 left-0 w-full z-50 flex justify-around p-3 pb-safe border-t border-slate-200 dark:border-slate-800">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => dispatch({ type: 'SET_TAB', payload: item.id })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${state.activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-500'}`}>
                        <item.icon />
                        <span className="text-[10px] font-semibold">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
