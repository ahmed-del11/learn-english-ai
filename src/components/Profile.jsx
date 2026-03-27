import React, { useState } from 'react';
import { Icons } from './Icons';

export default function Profile({ state, dispatch, t }) {
    const [name, setName] = useState(state.user?.name || '');
    const [isSaved, setIsSaved] = useState(false);
    const isAr = state.lang === 'ar';

    const handleSave = () => {
        dispatch({ type: 'UPDATE_USER', payload: { name } });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    if (!state.user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-fade-in p-4 md:p-6">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                    <Icons.User className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    {isAr ? 'برجاء تسجيل الدخول' : 'Please Sign In'}
                </h2>
                <p className="text-slate-500 max-w-xs mx-auto">
                    {isAr ? 'عليك تسجيل الدخول لتتمكن من تعديل ملفك الشخصي وحفظ تقدمك.' : 'You need to sign in to manage your profile and save your learning progress.'}
                </p>
                <button 
                  onClick={() => window.google?.accounts.id.prompt()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                >
                    {isAr ? 'تسجيل الدخول مع جوجل' : 'Sign in with Google'}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-slide-up p-3 md:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-5 p-5 md:p-8 glass rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative">
                    <img src={state.user.picture} alt="" className="w-24 h-24 rounded-3xl object-cover shadow-2xl ring-4 ring-white dark:ring-slate-800" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                </div>
                <div className="text-center md:text-start flex-1">
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{state.user.name}</h2>
                    <p className="text-slate-500 font-medium">{state.user.email}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                        <div className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold border border-indigo-500/20">
                            {isAr ? 'متعلم' : 'Learner'}
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-500 font-bold">
                            <Icons.Flame className="w-5 h-5" />
                            <span>{state.streak} {isAr ? 'يوم' : 'Days'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editing Form */}
            <div className="glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
                        <Icons.User className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                        {isAr ? 'تعديل البيانات' : 'Edit Profile'}
                    </h3>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 ml-4 rtl:ml-0 rtl:mr-4">
                        {isAr ? 'الاسم بالكامل' : 'Full Name'}
                    </label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 dark:text-white"
                        placeholder={isAr ? 'أدخل اسمك هنا...' : 'Enter your name...'}
                    />
                </div>

                <div className="pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={name === state.user.name && !isSaved}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${isSaved ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale'}`}
                    >
                        {isSaved ? <Icons.CheckCircle className="w-6 h-6" /> : null}
                        {isSaved ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ التغييرات' : 'Save Changes')}
                    </button>
                </div>
            </div>

            {/* Logout Option */}
            <button 
                onClick={() => dispatch({ type: 'LOGOUT' })}
                className="w-full p-6 glass rounded-[2rem] border-2 border-dashed border-rose-500/20 text-rose-500 hover:bg-rose-500/5 transition-all font-black flex items-center justify-center gap-3 group"
            >
                <Icons.LogOut className="w-6 h-6 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
                {isAr ? 'تسجيل الخروج من الحساب' : 'Logout from Account'}
            </button>
        </div>
    );
}
