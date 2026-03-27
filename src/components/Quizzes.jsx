import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { T } from '../utils/constants';
import { callAI } from '../utils/api';

export default function Quizzes({ state, dispatch, t }) {
    const isAr = state.lang === 'ar';
    const [quizState, setQuizState] = useState('menu'); // 'menu', 'loading', 'playing', 'finished'
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeMode, setActiveMode] = useState(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const timerRef = useRef(null);

    useEffect(() => {
        if (quizState === 'playing' && selectedAnswer === null) {
            setTimeLeft(15);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleAnswer(null); // Timeout
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [quizState, currentIndex]);

    const handleStartLocalQuiz = (mode) => {
        // mode: 'en-ar', 'ar-en', 'mix'
        if (state.words.length < 5) {
            alert(isAr ? 'برجاء إضافة 5 كلمات على الأقل للقاموس أولاً.' : 'Please add at least 5 words to your dictionary first.');
            return;
        }

        const selectedWords = [...state.words].sort(() => Math.random() - 0.5).slice(0, 5);
        const newQuestions = selectedWords.map(word => {
            const currentMode = mode === 'mix' ? (Math.random() > 0.5 ? 'en-ar' : 'ar-en') : mode;
            const isEnQuestion = currentMode === 'en-ar';
            
            // Get 3 distractors
            const distractors = state.words
                .filter(w => w.id !== word.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(w => isEnQuestion ? w.arabic : w.english);

            const options = [...distractors, isEnQuestion ? word.arabic : word.english].sort(() => Math.random() - 0.5);

            return {
                question: isEnQuestion ? word.english : word.arabic,
                options,
                correctAnswer: isEnQuestion ? word.arabic : word.english,
                explanation: isAr ? `ترجمة "${word.english}" هي "${word.arabic}" (${word.emoji})` : `The translation of "${word.english}" is "${word.arabic}" (${word.emoji})`,
                isArQuestion: !isEnQuestion
            };
        });

        setQuestions(newQuestions);
        setQuizState('playing');
        setCurrentIndex(0);
        setScore(0);
        setActiveMode('local');
        setSelectedAnswer(null);
        setIsCorrect(null);
    };

    const handleStartAIQuiz = async () => {
        setIsGenerating(true);
        setQuizState('loading');
        try {
            const quizSchema = {
                type: "OBJECT",
                properties: {
                    questions: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                question: { type: "STRING" },
                                options: { type: "ARRAY", items: { type: "STRING" } },
                                correctAnswer: { type: "STRING" },
                                explanation: { type: "STRING" }
                            },
                            required: ["question", "options", "correctAnswer", "explanation"]
                        }
                    }
                },
                required: ["questions"]
            };

            const knownWords = state.words.slice(0, 20).map(w => w.english).join(', ');
            const prompt = `Generate a 5-question multiple choice English quiz focused on sentence completion and contextual usage for a student who knows these words: [${knownWords}]. 
Instead of simple one-word translations, create practical sentences with a blank (e.g. "I need to buy a ___ for school").
Provide 4 options for each question. 
The explanation should be in ${isAr ? 'Arabic' : 'English'}.
Ensure the response follows the JSON schema exactly.`;

            const response = await callAI(prompt, "You are a professional English language examiner specializing in context-based learning.", true, quizSchema);
            
            if (response && response.questions) {
                setQuestions(response.questions);
                setQuizState('playing');
                setCurrentIndex(0);
                setScore(0);
                setActiveMode('ai');
                setSelectedAnswer(null);
                setIsCorrect(null);
            } else {
                throw new Error("Invalid AI response");
            }
        } catch (error) {
            alert(isAr ? 'فشل تحميل الاختبار. جرب مرة أخرى.' : 'Failed to load quiz. Try again.');
            setQuizState('menu');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswer = (option) => {
        if (selectedAnswer !== null) return;
        if (timerRef.current) clearInterval(timerRef.current);
        
        setSelectedAnswer(option || 'TIMEOUT');
        const correct = option === questions[currentIndex].correctAnswer;
        setIsCorrect(correct);
        
        if (correct) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
            } else {
                setQuizState('finished');
                const finalScore = correct ? score + 1 : score;
                const xpGain = activeMode === 'ai' ? (finalScore * 15 + 30) : (finalScore * 10 + 20);
                dispatch({ type: 'ADD_XP', payload: xpGain });
                dispatch({ 
                    type: 'SAVE_QUIZ_RESULT', 
                    payload: { 
                        date: new Date().toISOString(), 
                        score: finalScore, 
                        total: questions.length, 
                        mode: activeMode,
                        type: activeMode === 'ai' ? 'AI Mastery' : 'Rapid Challenge'
                    } 
                });
            }
        }, 2500);
    };

    if (quizState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-20 h-20 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl font-bold animate-pulse text-slate-600 dark:text-slate-400">
                    {isAr ? 'جاري تحضير الأسئلة لك...' : 'Preparing your personalized quiz...'}
                </p>
            </div>
        );
    }

    if (quizState === 'finished') {
        const finalScore = score; // score is already updated by setScore
        const xpGain = activeMode === 'ai' ? (finalScore * 15 + 30) : (finalScore * 10 + 20);
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in text-center px-4">
                <div className="w-40 h-40 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-500 shadow-xl relative">
                    <Icons.Award className="w-24 h-24" />
                    {activeMode === 'ai' && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">AI BONUS</div>}
                </div>
                <div>
                    <h2 className="text-4xl font-black mb-2">{isAr ? 'عمل رائع!' : 'Amazing Job!'}</h2>
                    <p className="text-xl text-slate-500 mb-6">{isAr ? `لقد حصلت على ${score} من ${questions.length}` : `You scored ${score} out of ${questions.length}`}</p>
                    <div className="bg-rose-500 text-white px-6 py-2 rounded-full font-bold inline-block animate-bounce">
                        +{xpGain} XP
                    </div>
                </div>
                <button onClick={() => setQuizState('menu')} className="bg-slate-800 text-white px-10 py-4 rounded-2xl font-bold hover:scale-105 transition-transform mt-4">
                    {isAr ? 'العودة للقائمة' : 'Back to Menu'}
                </button>
            </div>
        );
    }

    if (quizState === 'playing') {
        const q = questions[currentIndex];
        const timerColor = timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-600 dark:text-slate-400';
        
        return (
            <div className="max-w-3xl mx-auto space-y-6 page-transition-enter-active">
                {/* Header Info */}
                <div className="flex justify-between items-end px-2">
                    <div className="space-y-1">
                         <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-400 tracking-widest">{currentIndex + 1} / {questions.length}</span>
                            {activeMode === 'ai' && <Icons.Sparkles className="w-4 h-4 text-indigo-500" />}
                         </div>
                         {/* Progress bar */}
                         <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                         </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className={`text-4xl font-mono font-black ${timerColor}`}>
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </span>
                    </div>
                </div>

                {/* Question Card */}
                <div className="glass p-12 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    <span className="text-slate-400 text-xs font-bold tracking-[0.3em] mb-4 uppercase">Multiple Choice</span>
                    
                    <h3 className={`text-5xl md:text-6xl font-black mb-12 text-center leading-tight ${q.isArQuestion ? 'font-ar pr-4' : ''}`} dir={q.isArQuestion ? 'rtl' : 'ltr'}>
                        {q.question}
                    </h3>

                    {/* Options Grid 2x2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                        {q.options.map((opt, idx) => {
                            const isSelected = selectedAnswer === opt;
                            const isCorrectOpt = opt === q.correctAnswer;
                            const showResult = selectedAnswer !== null;
                            const isArabicOption = /[\u0600-\u06FF]/.test(opt);
                            
                            let btnClass = "p-6 rounded-2xl text-center font-bold border-2 transition-all flex items-center justify-center min-h-[80px] text-lg ";
                            if (isArabicOption) btnClass += "font-ar ";
                            
                            if (!showResult) btnClass += "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:scale-[1.02] active:scale-95";
                            else if (isCorrectOpt) btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20";
                            else if (isSelected) btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/20";
                            else btnClass += "border-slate-100 dark:border-slate-800 opacity-40 grayscale";

                            return (
                                <button key={idx} onClick={() => handleAnswer(opt)} disabled={showResult} className={btnClass} dir={isArabicOption ? 'rtl' : 'ltr'}>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Explanation Overlay/Toast */}
                {selectedAnswer !== null && (
                    <div className="bg-indigo-600 text-white p-6 rounded-3xl border border-indigo-400 shadow-xl animate-slide-up">
                        <div className="flex items-center gap-3 mb-2">
                             {isCorrect ? <Icons.CheckCircle className="w-6 h-6" /> : <Icons.X className="w-6 h-6" />}
                             <span className="font-bold text-lg">{isCorrect ? (isAr ? 'إجابة ممتازة!' : 'Excellent!') : (isAr ? 'الإجابة الصحيحة هي:' : 'Correct Answer:') + ' ' + q.correctAnswer}</span>
                        </div>
                        <p className="text-indigo-100 text-sm leading-relaxed">{q.explanation}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 page-transition-enter-active">
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-500 animate-pulse-glow shadow-xl shadow-rose-500/20">
                <Icons.Brain className="w-12 h-12" />
            </div>
            <div className="text-center max-w-2xl w-full px-4">
                <h2 className="text-4xl font-black mb-3 text-slate-800 dark:text-white">{t('quizzes')}</h2>
                <p className="text-slate-500 mb-10 text-lg leading-relaxed">{isAr ? 'اختر نمط التحدي المفضل لديك' : 'Choose your preferred challenge mode'}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {/* Local Modes */}
                    <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                             <Icons.RefreshCw className="text-emerald-500 w-5 h-5" />
                             <h3 className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'تحديات سريعة (بدون نت)' : 'Rapid Challenges (Offline)'}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <button onClick={() => handleStartLocalQuiz('en-ar')} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-2xl font-bold transition-all group">
                                <span>English ➔ Arabic</span>
                                <Icons.ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button onClick={() => handleStartLocalQuiz('ar-en')} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-2xl font-bold transition-all group">
                                <span>Arabic ➔ English</span>
                                <Icons.ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button onClick={() => handleStartLocalQuiz('mix')} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white rounded-2xl font-bold transition-all group">
                                <span>Ultimate Mix</span>
                                <Icons.Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                            </button>
                        </div>
                    </div>

                    {/* AI Mode */}
                    <div className="glass p-6 rounded-3xl border-2 border-indigo-500/20 bg-indigo-500/5 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 bg-indigo-500 text-white text-[10px] font-bold rounded-bl-xl">PREMIUM AI</div>
                        <div className="flex items-center gap-2 mb-2">
                             <Icons.Brain className="text-rose-500 w-5 h-5" />
                             <h3 className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'وضع الإتقان بالذكاء الاصطناعي' : 'AI Mastery Mode'}</h3>
                        </div>
                        <p className="text-xs text-slate-500">{isAr ? 'أسئلة سياقية عميقة مع شرح مفصل من خبير لكل إجابة.' : 'Deep contextual questions with expert explanations for every answer.'}</p>
                        <button 
                            onClick={handleStartAIQuiz}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-2xl font-bold text-xl transition-all hover:scale-105 shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3"
                        >
                            <Icons.Sparkles />
                            {isAr ? 'ابدأ تحدي الإتقان' : 'Start Mastery'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
