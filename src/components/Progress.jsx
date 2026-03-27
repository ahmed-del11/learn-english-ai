import React from 'react';
import { Icons } from './Icons';
import { T } from '../utils/constants';

const calculateLevel = (xp) => {
    if (xp < 500) return { name: 'Beginner (A1/A2)', ar: 'مبتدئ (A1/A2)', next: 500 };
    if (xp < 1500) return { name: 'Intermediate (B1/B2)', ar: 'متوسط (B1/B2)', next: 1500 };
    if (xp < 3000) return { name: 'Advanced (C1)', ar: 'متقدم (C1)', next: 3000 };
    return { name: 'Fluent (C2)', ar: 'طليق (C2)', next: 'Max' };
};

export default function Progress({ state }) {
    const t = (key) => T[key][state.lang];
    const isAr = state.lang === 'ar';
    const levelInfo = calculateLevel(state.xp);
    const learnedCount = state.words.filter(w => w.learned).length;

    return (
        <div className="space-y-8 page-transition-enter-active">
            <h2 className="text-2xl font-bold">{t('progress')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-6 rounded-2xl text-center">
                    <span className="text-4xl font-black text-indigo-500 mb-2 block">{state.xp}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase">{t('totalXp')}</span>
                </div>
                <div className="glass p-6 rounded-2xl text-center">
                    <span className="text-4xl font-black text-orange-500 mb-2 block flex items-center justify-center">{state.streak} <Icons.Flame className="w-8 h-8 ml-1" /></span>
                    <span className="text-xs text-slate-500 font-bold uppercase">{t('streak')}</span>
                </div>
                <div className="glass p-6 rounded-2xl text-center">
                    <span className="text-4xl font-black text-emerald-500 mb-2 block">{learnedCount}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase">{t('wordsLearned')}</span>
                </div>
                <div className="glass p-6 rounded-2xl text-center">
                    <span className="text-lg font-bold text-purple-500 mb-2 block">{levelInfo.name}</span>
                    <span className="text-xs text-slate-500 font-bold uppercase">{t('level')}</span>
                </div>
            </div>
            <div className="glass p-8 rounded-3xl">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-lg font-bold">{isAr ? 'مسار التعلم' : 'Learning Path'}</h3>
                        <p className="text-slate-500 text-sm">{state.xp} / {levelInfo.next} XP</p>
                    </div>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${Math.min(100, (state.xp / (levelInfo.next === 'Max' ? state.xp : levelInfo.next)) * 100)}%` }}></div>
                </div>
            </div>

            {/* Quiz History */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Icons.Brain className="text-rose-500 w-5 h-5" />
                    <h3 className="text-xl font-bold">{isAr ? 'سجل الاختبارات' : 'Quiz History'}</h3>
                </div>
                
                {state.quizHistory && state.quizHistory.length > 0 ? (
                    <div className="grid gap-3">
                        {state.quizHistory.map((quiz, idx) => {
                            const date = new Date(quiz.date);
                            const formattedDate = date.toLocaleDateString(state.lang === 'ar' ? 'ar-EG' : 'en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            const percentage = Math.round((quiz.score / quiz.total) * 100);
                            
                            return (
                                <div key={idx} className="glass p-4 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${percentage >= 80 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : percentage >= 50 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                            {quiz.score}/{quiz.total}
                                        </div>
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {quiz.type}
                                                {quiz.mode === 'ai' && <Icons.Sparkles className="w-3 h-3 text-indigo-500" />}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{formattedDate}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black ${percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-orange-500' : 'text-rose-500'}`}>
                                            {percentage}%
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{isAr ? 'الدقة' : 'ACCURACY'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
                        <Icons.Brain className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-400 font-medium">{isAr ? 'لم تقم بأي اختبارات بعد' : 'No quizzes completed yet'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
