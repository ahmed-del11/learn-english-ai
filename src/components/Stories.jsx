import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { T } from '../utils/constants';
import { callAI } from '../utils/api';
import StoryReader from './StoryReader';
import { SHERLOCK_COLLECTION } from '../utils/sherlock_canon';

export default function Stories({ state, dispatch }) {
    const t = (key) => T[key] ? T[key][state.lang] : key;
    const isAr = state.lang === 'ar';
    const stories = state.stories || [];
    
    // Discover State
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isInstalling, setIsInstalling] = useState(null); // ID of story being installed

    const [selectedStory, setSelectedStory] = useState(null);
    const [viewMode, setViewMode] = useState('library'); // 'library' | 'canon'
    const [activeCanonCategory, setActiveCanonCategory] = useState(SHERLOCK_COLLECTION[0]);


    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchTerm.trim()) return;
        
        setIsSearching(true);
        setSearchResults([]);
        
        try {
            const prompt = `Search for 3 real public domain short stories or poems by "${searchTerm}". 
            If it's an author, list their most famous public domain works. 
            If it's a specific title, find that one and 2 similar classics.`;
            
            const schema = {
                type: "object",
                properties: {
                    results: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                title: { type: "string" },
                                author: { type: "string" },
                                year: { type: "string" },
                                level: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
                                description: { type: "string" },
                                descriptionAr: { type: "string" },
                                coverHint: { type: "string", description: "Keyword for Unsplash image" }
                            }
                        }
                    }
                }
            };
            
            const response = await callAI(prompt, "You are a literary expert. Return 3 real public domain stories.", true, schema);
            
            if (response && response.results) {
                // Add temporary Unsplash URLs based on hints
                const resultsWithImages = response.results.map(r => ({
                    ...r,
                    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    cover: `https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80` // Fallback
                }));
                setSearchResults(resultsWithImages);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInstall = async (briefStory, isCanon = false) => {
        setIsInstalling(briefStory.id);
        
        try {
            // High-fidelity prompt for restoration of original text
            const prompt = isCanon 
                ? `Restore the COMPLETE original English text of the story "${briefStory.title}" by "${briefStory.author}". 
                   This is a classic public domain work. Provide the full original flow of the story. 
                   Split it into clear, consecutive sentences (at least 50-80 sentences for short stories). 
                   For each sentence, provide the original English and a professional Arabic translation.
                   Return a JSON array of sentences.`
                : `Provide the full text of the story "${briefStory.title}" by "${briefStory.author}". 
                   Split it into 10-15 clear sentences. For each sentence, provide the original English and a high-quality Arabic translation.
                   The tone should be educational. Return a JSON array of sentences.`;
            
            const schema = {
                type: "object",
                properties: {
                    sentences: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                en: { type: "string" },
                                ar: { type: "string" }
                            }
                        }
                    }
                }
            };
            
            const response = await callAI(prompt, "You are a professional translator and literary scholar.", true, schema);
            
            if (response && response.sentences) {
                const fullStory = {
                    ...briefStory,
                    isInitial: false,
                    isCanon,
                    sentences: response.sentences,
                    cover: briefStory.cover || (isCanon ? `https://images.unsplash.com/photo-1544648151-28231920875e?auto=format&fit=crop&w=800&q=80` : `https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80`)
                };
                dispatch({ type: 'ADD_STORY_TO_LIBRARY', payload: fullStory });
                if (!isCanon) {
                    setSearchResults(prev => prev.filter(s => s.id !== briefStory.id));
                }
                // Auto open the newly installed story
                setSelectedStory(fullStory);
            }
        } catch (error) {
            console.error("Install failed:", error);
        } finally {
            setIsInstalling(null);
        }
    };

    if (selectedStory) {
        return (
            <StoryReader 
                story={selectedStory} 
                state={state} 
                dispatch={dispatch} 
                onBack={() => setSelectedStory(null)} 
            />
        );
    }

    return (
        <div className="space-y-8 page-transition-enter-active">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-fit mx-auto sm:mx-0">
                <button 
                    onClick={() => setViewMode('library')}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${viewMode === 'library' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {isAr ? 'مكتبتي' : 'My Library'}
                </button>
                <button 
                    onClick={() => setViewMode('canon')}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'canon' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Icons.BookMarked size={14} />
                    {isAr ? 'مجموعة شارلوك' : 'Sherlock Canon'}
                </button>
            </div>

            {viewMode === 'library' ? (
                <>
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
                                 <Icons.BookOpen className="w-16 h-16 md:w-20 md:h-20 text-indigo-200" />
                            </div>
                        </div>
                    </div>

                    {/* Stories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                        {stories.map((story) => {
                            const isCompleted = state.storyProgress.includes(story.id);
                            return (
                                <div 
                                    key={story.id}
                                    onClick={() => setSelectedStory(story)}
                                    className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 active:scale-[0.98]"
                                >
                                    {/* Image Header with Robust Fallback */}
                                    <div className="h-56 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {/* CSS-based Book Cover Fallback (shown behind and if image fails) */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-indigo-900 to-slate-900">
                                            <div className="w-12 h-12 mb-3 bg-white/10 rounded-full flex items-center justify-center">
                                                <Icons.BookOpen className="text-white/40" size={24} />
                                            </div>
                                            <h4 className="text-white/40 font-black text-xs uppercase tracking-widest line-clamp-2">{story.title}</h4>
                                        </div>

                                        <img 
                                            src={story.cover} 
                                            alt={story.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 relative z-10"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent z-20"></div>
                                        
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

                                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">{story.title}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                                                <Icons.User className="w-3 h-3" /> {story.author} • {story.year}
                                            </p>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {isAr ? story.descriptionAr : story.description}
                                        </p>
                                        <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex justify-between items-center group-hover:pt-6 transition-all">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-tighter flex items-center gap-1">
                                                {t('readStory')} {isAr ? <Icons.ChevronLeft className="w-3 h-3" /> : <Icons.ChevronRight className="w-3 h-3" />}
                                            </span>
                                            <div className="flex gap-3 text-[9px] font-bold items-center text-slate-400 opacity-60">
                                                 <span className="flex items-center gap-1"><Icons.BookOpen className="w-2.5 h-2.5" />{story.sentences.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Discover Section */}
                    <div className="glass p-8 md:p-12 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center text-center gap-8 group hover:border-indigo-500/50 transition-all">
                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center text-indigo-600 transition-all group-hover:scale-110 shadow-xl shadow-indigo-500/10">
                            <Icons.Sparkles className="w-10 h-10" />
                        </div>
                        <div className="space-y-4 max-w-lg">
                            <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{t('discoverMore')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {isAr ? 'هل تبحث عن عمل لكاتب معين؟ ابحث عنه في مكتبتنا وسنحاول توفير أفضل أعماله لك.' : 'Looking for a specific author? Search our database and we will bring their best public works to you.'}
                            </p>
                        </div>
                        <form onSubmit={handleSearch} className="w-full max-w-md relative">
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={isAr ? 'ابحث باسم الكاتب أو الكتاب...' : 'Search author or book...'}
                                className="w-full pl-6 pr-14 py-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 outline-none font-bold transition-all shadow-sm"
                            />
                            <button 
                                type="submit"
                                disabled={isSearching}
                                className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSearching ? <Icons.RefreshCw className="w-5 h-5 animate-spin" /> : <Icons.Search className="w-5 h-5" />}
                            </button>
                        </form>
                        {searchResults.length > 0 && (
                            <div className="w-full grid grid-cols-1 gap-4 mt-4 animate-slide-up">
                                {searchResults.map(result => (
                                    <div key={result.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-left rtl:text-right">
                                        <div className="flex-1 min-w-0 px-2">
                                            <h4 className="font-black text-slate-800 dark:text-white truncate">{result.title}</h4>
                                            <p className="text-xs text-slate-500 font-bold uppercase">{result.author}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleInstall(result)}
                                            disabled={isInstalling === result.id}
                                            className={`px-6 py-2.5 rounded-2xl font-black text-xs transition-all active:scale-95 flex items-center gap-2 ${isInstalling === result.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white'}`}
                                        >
                                            {isInstalling === result.id ? <Icons.RefreshCw className="animate-spin w-3 h-3"/> : <Icons.Plus className="w-3 h-3"/>}
                                            {isAr ? 'إضافة' : 'Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    {/* Canon Categories */}
                    <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
                        {SHERLOCK_COLLECTION.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCanonCategory(cat)}
                                className={`px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 ${activeCanonCategory.id === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-500/50'}`}
                            >
                                {isAr ? cat.titleAr : cat.title}
                            </button>
                        ))}
                    </div>

                    <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-950 p-8 md:p-12 text-white shadow-2xl">
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent"></div>
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-3xl font-black tracking-tight">{isAr ? activeCanonCategory.titleAr : activeCanonCategory.title}</h2>
                            <p className="max-w-xl text-indigo-200 font-medium opacity-80">
                                {isAr ? 'تصفح المجموعة الكاملة من قصص شارلوك هولمز الأصلية. اختر أي قصة لاستعادتها بنصها الكامل وبدء القراءة.' : 'Browse the complete collection of original Sherlock Holmes stories. Choose any story to restore its full text and start reading.'}
                            </p>
                        </div>
                    </div>

                    {/* Canon Items List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeCanonCategory.items.map((item) => {
                            const isInstalled = stories.some(s => s.title === item.title);
                            return (
                                <div key={item.id} className="group flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-xl transition-all">
                                    <div className="flex items-center gap-5 min-w-0">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                            <Icons.Book size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-slate-800 dark:text-white truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.title}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{activeCanonCategory.title} • {item.year}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (isInstalled) {
                                                setSelectedStory(stories.find(s => s.title === item.title));
                                            } else {
                                                handleInstall({ ...item, author: "Arthur Conan Doyle", cover: activeCanonCategory.cover }, true);
                                            }
                                        }}
                                        disabled={isInstalling === item.id}
                                        className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all active:scale-95 flex items-center gap-2 ${isInstalled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800'}`}
                                    >
                                        {isInstalling === item.id ? (
                                            <Icons.RefreshCw className="animate-spin w-3 h-3" />
                                        ) : isInstalled ? (
                                            <Icons.Check className="w-3 h-3" />
                                        ) : (
                                            <Icons.DownloadCloud className="w-3 h-3" />
                                        )}
                                        {isInstalling === item.id ? (isAr ? 'جاري الاستعادة...' : 'Restoring...') : isInstalled ? (isAr ? 'فتح' : 'Open') : (isAr ? 'استعادة النص الكامل' : 'Restore Full Text')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
