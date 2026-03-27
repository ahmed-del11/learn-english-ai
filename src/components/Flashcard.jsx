import React, { useState } from 'react';
import { Icons } from './Icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { callAI } from '../utils/api';

export default function Flashcard({ word, onResult, t, isAr }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExplaining, setIsExplaining] = useState(false);
    const [explanation, setExplanation] = useState(null);
    const [speechFeedback, setSpeechFeedback] = useState(null);

    const onSpeechResult = (transcript) => {
        const target = word.english.toLowerCase();
        const input = transcript.toLowerCase();
        
        if (input.includes(target)) {
            setSpeechFeedback({ status: 'perfect', text: isAr ? 'نطق ممتاز!' : 'Perfect pronunciation!' });
        } else {
            setSpeechFeedback({ status: 'try-again', text: isAr ? 'حاول مرة أخرى' : 'Try again' });
        }
    };

    const { isListening, startListening } = useSpeechRecognition(onSpeechResult);

    const handleExplain = async (e) => {
        if (e) e.stopPropagation();
        setIsExplaining(true);
        try {
            const prompt = `Explain the grammar and usage of the English word "${word.english}" in simple terms. Include a common example sentence. Provide the explanation in ${isAr ? 'Arabic' : 'English'}.`;
            const result = await callAI(prompt, "You are a helpful English grammar tutor.");
            setExplanation(result);
        } catch (error) {
            setExplanation(isAr ? 'عذراً، فشل تحميل التوضيح.' : 'Sorry, failed to load explanation.');
        } finally {
            setIsExplaining(false);
        }
    };

    const handleSpeak = (e) => {
        if (e) e.stopPropagation();
        const utterance = new SpeechSynthesisUtterance(word.english);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    const handlePronounce = (e) => {
        if (e) e.stopPropagation();
        setSpeechFeedback(null);
        startListening();
    };

    return (
        <div className="w-full max-w-sm h-[450px] perspective-1000">
            <div className={`relative w-full h-full transition-all duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}>
                
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden glass rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <span className="text-6xl mb-6 animate-bounce-slow">{word.emoji}</span>
                    <h3 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">{word.english}</h3>
                    <p className="text-slate-400 text-sm font-bold mb-6 italic">{word.phonetic}</p>
                    <div className="flex gap-4">
                        <button onClick={handleSpeak} className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform">
                            <Icons.Volume2 className="w-6 h-6" />
                        </button>
                        <button onClick={handlePronounce} className={`p-4 rounded-full transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            <Icons.Mic className="w-6 h-6" />
                        </button>
                    </div>
                    {speechFeedback && (
                        <div className={`mt-6 px-4 py-2 rounded-lg text-sm font-bold animate-float-up ${speechFeedback.status === 'perfect' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                            {speechFeedback.text}
                        </div>
                    )}
                    <p className="mt-8 text-slate-400 text-sm font-bold animate-pulse">{t('tapToFlip')}</p>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 glass rounded-3xl p-8 flex flex-col items-center justify-between text-center border-2 border-indigo-500/30">
                    <div className="w-full flex flex-col items-center">
                        <h3 className="text-5xl font-bold font-ar text-indigo-600 dark:text-indigo-400 mb-8">{word.arabic}</h3>
                        
                        <div className="w-full bg-slate-50/80 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-left relative group">
                            <button 
                                onClick={(e) => {
                                    if (e) e.stopPropagation();
                                    const ut = new SpeechSynthesisUtterance(word.example_en || word.english);
                                    ut.lang = 'en-US';
                                    window.speechSynthesis.speak(ut);
                                }}
                                className="absolute right-4 top-4 p-2 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Icons.Volume2 className="w-4 h-4" />
                            </button>
                            <p className="text-slate-800 dark:text-slate-200 font-semibold mb-2 leading-tight">"{word.example_en || (isAr ? 'مثال غير متوفر' : 'Example not available')}"</p>
                            <p className="text-slate-500 dark:text-slate-400 font-ar text-sm text-right leading-relaxed">{word.example_ar || ''}</p>
                            
                            <button 
                                onClick={(e) => {
                                    if (e) e.stopPropagation();
                                    const ut = new SpeechSynthesisUtterance(word.example_en || word.english);
                                    ut.lang = 'en-US';
                                    window.speechSynthesis.speak(ut);
                                }}
                                className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                <Icons.Volume2 className="w-4 h-4" /> {t('hearExample')}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full mt-6">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onResult(false); setIsFlipped(false); }}
                            className="flex-1 py-4 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/30 font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                            {t('reviewAgain')}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onResult(true); setIsFlipped(false); }}
                            className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all"
                        >
                            {t('iKnowIt')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
