import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { T, PUBLIC_DOMAIN_STORIES } from '../utils/constants';

export default function Stories({ state, dispatch }) {
    const t = (key) => T[key] ? T[key][state.lang] : key;
    const isAr = state.lang === 'ar';
    const [selectedStory, setSelectedStory] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showTranslation, setShowTranslation] = useState(false);
    const [isRead, setIsRead] = useState(false);

    // Reading session state
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlayAudio = (text) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
    };

    const nextSentence = () => {
        if (selectedStory && currentIndex < selectedStory.sentences.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowTranslation(false);
        } else if (currentIndex === selectedStory.sentences.length - 1) {
            setIsRead(true);
            if (!state.storyProgress.includes(selectedStory.id)) {
                dispatch({ type: 'MARK_STORY_COMPLETE', payload: selectedStory.id });
                dispatch({ type: 'ADD_XP', payload: 50 });
            }
        }
    };

    const prevSentence = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowTranslation(false);
        }
    };

    if (selectedStory) {
        const sentence = selectedStory.sentences[currentIndex];
        const progress = ((currentIndex + 1) / selectedStory.sentences.length) * 100;

        return (
            <div className="max-w-3xl mx-auto space-y-6 page-transition-enter-active pb-12">
                {/* Reader Header */}
                <div className="flex items-center justify-between bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md sticky top-0 z-10">
                    <button 
                        onClick={() => { setSelectedStory(null); setIsRead(false); setCurrentIndex(0); }}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-indigo-600"
                    >
                        {isAr ? <Icons.ChevronRight className="w-6 h-6" /> : <Icons.ChevronLeft className="w-6 h-6" />}
                    </button>
                    <div className="text-center">
                        <h2 className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{selectedStory.title}</h2>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{selectedStory.author}</p>
                    </div>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Main Content Area */}
                <div className="glass p-8 md:p-12 rounded-[2.5rem] min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    
                    {!isRead ? (
                        <>
                            <div className="space-y-8 animate-slide-up">
                                <div className="relative group/text">
                                    <p className="text-3xl md:text-4xl font-serif font-medium leading-relaxed text-slate-800 dark:text-slate-100 transition-all duration-300">
                                        {sentence.en}
                                    </p>
                                    <button 
                                        onClick={() => handlePlayAudio(sentence.en)}
                                        className={`mt-6 p-4 rounded-full transition-all ${isPlaying ? 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'}`}
                                    >
                                        <Icons.Volume2 className={`w-6 h-6 ${isPlaying ? 'animate-pulse' : ''}`} />
                                    </button>
                                </div>

                                <div className={`transition-all duration-500 transform ${showTranslation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'} animate-fade-in`}>
                                    <p className="text-xl md:text-2xl font-ar text-slate-500 dark:text-slate-400 leading-loose" dir="rtl">
                                        {sentence.ar}
                                    </p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4 mt-12 w-full max-w-sm">
                                <button 
                                    onClick={prevSentence}
                                    disabled={currentIndex === 0}
                                    className="flex-1 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold transition-all hover:border-indigo-500 active:scale-95 disabled:opacity-30"
                                >
                                    {isAr ? 'التالي' : 'Prev'}
                                </button>
                                <button 
                                    onClick={() => setShowTranslation(!showTranslation)}
                                    className={`flex-1 p-4 rounded-2xl font-bold transition-all active:scale-95 border ${showTranslation ? 'border-orange-500 bg-orange-50 text-orange-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {isAr ? 'ترجمة' : 'Translate'}
                                </button>
                                <button 
                                    onClick={nextSentence}
                                    className="flex-[2] p-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
                                >
                                    {currentIndex === selectedStory.sentences.length - 1 ? (isAr ? 'إنهاء' : 'Finish') : (isAr ? 'التالي' : 'Next')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-slide-up">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/20">
                                <Icons.Check className="w-12 h-12" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{t('storyCompleted')}</h3>
                                <p className="text-slate-500 font-bold">+50 XP Earned</p>
                            </div>
                            <button 
                                onClick={() => { setSelectedStory(null); setIsRead(false); setCurrentIndex(0); }}
                                className="mt-4 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all"
                            >
                                {isAr ? 'عودة للمكتبة' : 'Back to Library'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-transition-enter-active">
            {/* Library Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600 p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                             <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm border border-white/10">{t('publicDomain')}</span>
                             <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('classicLibrary')}</h1>
                        <p className="max-w-md text-indigo-100 font-medium leading-relaxed opacity-80">
                            {isAr ? 'انغمس في روائع الأدب العالمي. نصوص حقيقية، كتاب خالدون، وتجربة تعلم غامرة.' : 'Immerse yourself in world literature. Real texts, timeless authors, and a truly immersive learning experience.'}
                        </p>
                    </div>
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center -rotate-6 shadow-2xl relative">
                         <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent"></div>
                         <Icons.BookOpen className="w-16 h-16 md:w-20 md:h-20 text-indigo-200" />
                    </div>
                </div>
            </div>

            {/* Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {PUBLIC_DOMAIN_STORIES.map((story) => {
                    const isCompleted = state.storyProgress.includes(story.id);
                    return (
                        <div 
                            key={story.id}
                            onClick={() => setSelectedStory(story)}
                            className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 active:scale-[0.98]"
                        >
                            {/* Image Header */}
                            <div className="h-56 relative overflow-hidden">
                                <img 
                                    src={story.cover} 
                                    alt={story.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent"></div>
                                
                                {/* Status Chip */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                                        story.level === 'Beginner' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/20' : 
                                        story.level === 'Intermediate' ? 'bg-orange-500/20 text-orange-100 border-orange-500/20' : 
                                        'bg-rose-500/20 text-rose-100 border-rose-500/20'
                                    }`}>
                                        {story.level}
                                    </span>
                                    {isCompleted && (
                                        <span className="px-3 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-bold shadow-lg shadow-green-500/20 flex items-center gap-1.5">
                                            <Icons.Check className="w-3 h-3" /> {isAr ? 'تم' : 'Read'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4 flex-1 flex flex-col">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">{story.title}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                        <Icons.User className="w-3 h-3" /> {story.author} • <Icons.Calendar className="w-3 h-3" /> {story.year}
                                    </p>
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {isAr ? story.descriptionAr : story.description}
                                </p>

                                <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex justify-between items-center group-hover:pt-6 transition-all">
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-tighter flex items-center gap-1">
                                        {t('readStory')} {isAr ? <Icons.ChevronLeft className="w-3 h-3" /> : <Icons.ChevronRight className="w-3 h-3" />}
                                    </span>
                                    <div className="flex -space-x-1.5 overflow-hidden text-[9px] font-bold items-center text-slate-400">
                                         {story.sentences.length} {isAr ? 'جُمل' : 'sentences'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Discover Section */}
            <div className="glass p-10 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-6 group hover:border-indigo-500/50 transition-colors">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center text-slate-300 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                      <Icons.Sparkles className="w-10 h-10" />
                 </div>
                 <div className="space-y-2">
                     <h3 className="text-2xl font-black text-slate-800 dark:text-white">{t('discoverMore')}</h3>
                     <p className="text-slate-500 max-w-sm font-medium">
                         {isAr ? 'هل تبحث عن عمل لكاتب معين؟ ابحث عنه في مكتبتنا وسنحاول توفير أفضل أعماله لك.' : 'Looking for a specific author? Search our database and we will bring their best public works to you.'}
                     </p>
                 </div>
                 <button className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all">
                      {isAr ? 'قريباً...' : 'Coming Soon...'}
                 </button>
            </div>
        </div>
    );
}
