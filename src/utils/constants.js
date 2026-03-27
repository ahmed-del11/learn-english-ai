export const T = {
    appName: { en: "FluentUp", ar: "فلوينت أب" },
    home: { en: "Home", ar: "الرئيسية" },
    vocab: { en: "Vocabulary", ar: "المفردات" },
    shadowing: { en: "Shadowing", ar: "المحاكاة" },
    quizzes: { en: "Quizzes", ar: "اختبارات" },
    progress: { en: "Progress", ar: "التقدم" },
    greeting: { en: "Good Morning! 🌟", ar: "صباح الخير! 🌟" },
    greetingEve: { en: "Good Evening! 🌙", ar: "مساء الخير! 🌙" },
    wordOfDay: { en: "Word of the Day", ar: "كلمة اليوم" },
    streak: { en: "Day Streak", ar: "أيام متتالية" },
    xpToday: { en: "XP Today", ar: "نقاط اليوم" },
    dailyGoal: { en: "Daily Goal: 100 XP", ar: "الهدف اليومي: 100 نقطة" },
    startSession: { en: "Start Session", ar: "ابدأ الجلسة" },
    exitSession: { en: "Exit Session", ar: "خروج من الجلسة" },
    level: { en: "Level", ar: "المستوى" },
    reviewDue: { en: "Due for Review", ar: "للمراجعة" },
    iKnowIt: { en: "I Know It", ar: "أعرفها" },
    reviewAgain: { en: "Review Again", ar: "راجعها مجدداً" },
    hearExample: { en: "Hear Example", ar: "استمع للمثال" },
    record: { en: "Record", ar: "تسجيل" },
    stop: { en: "Stop", ar: "إيقاف" },
    playOriginal: { en: "Original", ar: "الأصلي" },
    playYours: { en: "Your Voice", ar: "صوتك" },
    quizMultiple: { en: "Multiple Choice", ar: "خيارات متعددة" },
    quizFill: { en: "Fill in the Blank", ar: "أكمل الفراغ" },
    quizScore: { en: "Your Score", ar: "نتيجتك" },
    achievements: { en: "Achievements", ar: "الإنجازات" },
    wordsLearned: { en: "Words Learned", ar: "الكلمات المتعلمة" },
    totalXp: { en: "Total XP", ar: "إجمالي النقاط" },
    aiGeneratorTitle: { en: "✨ AI Vocab Builder", ar: "✨ منشئ المفردات الذكي" },
    aiTopicPrompt: { en: "What topic do you want to learn? (e.g., Space, Baking)", ar: "ما الموضوع الذي تريد تعلمه؟ (مثال: الفضاء، الطبخ)" },
    generateBtn: { en: "Generate", ar: "توليد" },
    generatingBtn: { en: "Generating...", ar: "جاري التوليد..." },
    explainGrammar: { en: "✨ Explain Grammar", ar: "✨ شرح القواعد" },
    levelPacks: { en: "Smart Level Packs (Infinite Words)", ar: "حزم المستويات الذكية (كلمات لا نهائية)" },
    packBeginner: { en: "Beginner (+10)", ar: "مبتدئ (+10)" },
    packIntermediate: { en: "Intermediate (+10)", ar: "متوسط (+10)" },
    packAdvanced: { en: "Advanced (+10)", ar: "متقدم (+10)" },
    shadowPacks: { en: "Smart Sentence Packs", ar: "حزم الجمل الذكية" },
    shadowFilterAll: { en: "All Levels", ar: "كل المستويات" },
    shadowCompleted: { en: "Completed", ar: "مكتمل" },
    shadowRemaining: { en: "Remaining", ar: "متبقي" },
    shadowSentencesCompleted: { en: "sentences completed", ar: "جملة مكتملة" },
    browseSentences: { en: "Browse Sentences", ar: "تصفح الجمل" },
    nextSentence: { en: "Next Sentence", ar: "الجملة التالية" },
    finishSession: { en: "Finish Session", ar: "إنهاء الجلسة" },
    back: { en: "Back", ar: "عودة" },
    tapToFlip: { en: "Tap to flip", ar: "اضغط للقلب" },
    didNotKnow: { en: "Don't Know", ar: "لا أعرف" },
    knewIt: { en: "I Knew It", ar: "كنت أعرفها" },
    searchPlaceholder: { en: "Search words...", ar: "بحث عن كلمات..." },
    filterAll: { en: "All Levels", ar: "كل المستويات" },
    noWordsFound: { en: "No words found matching your search.", ar: "لم يتم العثور على كلمات مطابقة لبحثك." },
    loadMore: { en: "Load More", ar: "تحميل المزيد" },
    aiTutorTitle: { en: "AI English Tutor", ar: "معلم اللغة الإنجليزية الذكي" },
    aiTutorDesc: { en: "Practice speaking English naturally. I will help you improve!", ar: "تدرب على التحدث بالإنجليزية بشكل طبيعي. سأساعدك على التحسن!" },
    listening: { en: "Listening...", ar: "جاري الاستماع..." },
    thinking: { en: "Thinking...", ar: "جاري التفكير..." },
    tapToTalk: { en: "Tap to Speak", ar: "اضغط للتحدث" },
    stopTalking: { en: "Stop Talking", ar: "إيقاف التحدث" },
    chatInputPlaceholder: { en: "Type your message here...", ar: "اكتب رسالتك هنا..." },
    send: { en: "Send", ar: "إرسال" },
    newChat: { en: "New Chat", ar: "محادثة جديدة" },
    chatHistory: { en: "Chat History", ar: "سجل المحادثات" },
};

const generateWords = () => {
    const bases = [
        // BEGINNER (A1/A2)
        {en: 'water', ar: 'ماء', ph: '/ˈwɔːtər/', em: '💧', exEn: 'I drink water.', exAr: 'أشرب الماء.', lvl: 'Beginner', cat: 'Daily Life'},
        {en: 'house', ar: 'منزل', ph: '/haʊs/', em: '🏠', exEn: 'This is my house.', exAr: 'هذا منزلي.', lvl: 'Beginner', cat: 'Daily Life'},
        {en: 'friend', ar: 'صديق', ph: '/frɛnd/', em: '🤝', exEn: 'He is my friend.', exAr: 'إنه صديقي.', lvl: 'Beginner', cat: 'Daily Life'},
        {en: 'time', ar: 'وقت', ph: '/taɪm/', em: '⏰', exEn: 'What time is it?', exAr: 'كم الوقت؟', lvl: 'Beginner', cat: 'Daily Life'},
        {en: 'money', ar: 'مال', ph: '/ˈmʌni/', em: '💵', exEn: 'I need money.', exAr: 'أحتاج إلى المال.', lvl: 'Beginner', cat: 'Daily Life'},
        {en: 'doctor', ar: 'طبيب', ph: '/ˈdɒktər/', em: '👨⚕️', exEn: 'See a doctor.', exAr: 'راجع طبيباً.', lvl: 'Beginner', cat: 'Health'},
        {en: 'food', ar: 'طعام', ph: '/fuːd/', em: '🍔', exEn: 'I love this food.', exAr: 'أحب هذا الطعام.', lvl: 'Beginner', cat: 'Food'},
        {en: 'happy', ar: 'سعيد', ph: '/ˈhæpi/', em: '😊', exEn: 'I am very happy.', exAr: 'أنا سعيد جداً.', lvl: 'Beginner', cat: 'Emotions'},
        {en: 'book', ar: 'كتاب', ph: '/bʊk/', em: '📖', exEn: 'Read a book.', exAr: 'اقرأ كتاباً.', lvl: 'Beginner', cat: 'Academic'},
        {en: 'car', ar: 'سيارة', ph: '/kɑːr/', em: '🚗', exEn: 'I drive a car.', exAr: 'أنا أقود سيارة.', lvl: 'Beginner', cat: 'Travel'},
        
        // INTERMEDIATE (B1/B2)
        {en: 'meeting', ar: 'اجتماع', ph: '/ˈmiːtɪŋ/', em: '💼', exEn: 'We have an important meeting.', exAr: 'لدينا اجتماع مهم.', lvl: 'Intermediate', cat: 'Work'},
        {en: 'project', ar: 'مشروع', ph: '/ˈpɒdʒɛkt/', em: '📊', exEn: 'This is a new project.', exAr: 'هذا مشروع جديد.', lvl: 'Intermediate', cat: 'Work'},
        {en: 'deadline', ar: 'موعد نهائي', ph: '/ˈdɛdlaɪn/', em: '⏳', exEn: 'We must meet the deadline.', exAr: 'يجب أن نلتزم بالموعد النهائي.', lvl: 'Intermediate', cat: 'Work'},
        {en: 'passenger', ar: 'مسافر', ph: '/ˈpæsɪndʒər/', em: '🧳', exEn: 'The passenger is waiting.', exAr: 'المسافر ينتظر.', lvl: 'Intermediate', cat: 'Travel'},
        {en: 'destination', ar: 'وجهة', ph: '/ˌdɛstɪˈneɪʃn/', em: '📍', exEn: 'Paris is our destination.', exAr: 'باريس هي وجهتنا.', lvl: 'Intermediate', cat: 'Travel'},
        {en: 'delicious', ar: 'لذيذ', ph: '/dɪˈlɪʃəs/', em: '🤤', exEn: 'The meal was delicious.', exAr: 'كانت الوجبة لذيذة.', lvl: 'Intermediate', cat: 'Food'},
        {en: 'software', ar: 'برمجيات', ph: '/ˈsɔːftwɛər/', em: '💿', exEn: 'Update the software.', exAr: 'حدث البرمجيات.', lvl: 'Intermediate', cat: 'Technology'},
        {en: 'environment', ar: 'بيئة', ph: '/ɪnˈvaɪrənmənt/', em: '🌍', exEn: 'Protect the environment.', exAr: 'احمِ البيئة.', lvl: 'Intermediate', cat: 'Daily Life'},

        // ADVANCED (C1/C2)
        {en: 'mitigate', ar: 'يخفف / يقلل', ph: '/ˈmɪtɪɡeɪt/', em: '📉', exEn: 'We need to mitigate the risks.', exAr: 'نحتاج إلى التخفيف من المخاطر.', lvl: 'Advanced', cat: 'Work'},
        {en: 'ubiquitous', ar: 'شائع / موجود في كل مكان', ph: '/juːˈbɪkwɪtəs/', em: '🌐', exEn: 'Smartphones are ubiquitous today.', exAr: 'الهواتف الذكية موجودة في كل مكان اليوم.', lvl: 'Advanced', cat: 'Technology'},
        {en: 'lucrative', ar: 'مربح', ph: '/ˈluːkrətɪv/', em: '💸', exEn: 'It is a highly lucrative business.', exAr: 'إنه عمل مربح للغاية.', lvl: 'Advanced', cat: 'Work'},
        {en: 'pragmatic', ar: 'عملي / واقعي', ph: '/præɡˈmætɪk/', em: '🛠️', exEn: 'We need a pragmatic approach.', exAr: 'نحتاج إلى نهج عملي.', lvl: 'Advanced', cat: 'Work'},
        {en: 'eloquent', ar: 'فصيح / بليغ', ph: '/ˈɛləkwənt/', em: '🗣️', exEn: 'She gave an eloquent speech.', exAr: 'ألقت خطاباً بليغاً.', lvl: 'Advanced', cat: 'Daily Life'}
    ];
    return bases.map((b, i) => ({
        id: i + 1, english: b.en, arabic: b.ar, phonetic: b.ph, emoji: b.em,
        example_en: b.exEn, example_ar: b.exAr, category: b.cat, level: b.lvl,
        learned: false, repetition_count: 0, next_review: null
    }));
};

export const INITIAL_WORDS = generateWords();

export const SENTENCES = [
    // Beginner
    { id: 1, english: "Good morning! How are you doing today?", arabic: "صباح الخير! كيف حالك اليوم؟", words: ["Good", "morning!", "How", "are", "you", "doing", "today?"], topic: "Greetings", level: "Beginner" },
    { id: 2, english: "I would like to order a cup of coffee, please.", arabic: "أود أن أطلب كوباً من القهوة، من فضلك.", words: ["I", "would", "like", "to", "order", "a", "cup", "of", "coffee,", "please."], topic: "Shopping", level: "Beginner" },
    { id: 3, english: "Excuse me, where is the nearest train station?", arabic: "معذرة، أين أقرب محطة قطار؟", words: ["Excuse", "me,", "where", "is", "the", "nearest", "train", "station?"], topic: "Travel", level: "Beginner" },
    { id: 4, english: "My name is Sarah, nice to meet you.", arabic: "اسمي سارة، سررت بلقائك.", words: ["My", "name", "is", "Sarah,", "nice", "to", "meet", "you."], topic: "Introductions", level: "Beginner" },
    { id: 5, english: "Could you please speak a little slower?", arabic: "هل يمكنك التحدث ببطء قليلاً من فضلك؟", words: ["Could", "you", "please", "speak", "a", "little", "slower?"], topic: "Learning", level: "Beginner" },
    
    // Intermediate
    { id: 16, english: "Nice to meet you. I am looking forward to working together.", arabic: "سعدت بلقائك. أتطلع للعمل معاً.", words: ["Nice", "to", "meet", "you.", "I", "am", "looking", "forward", "to", "working", "together."], topic: "Work", level: "Intermediate" },
    { id: 17, english: "My flight departs from terminal three at five PM.", arabic: "تغادر رحلتي من المبنى رقم ثلاثة في الساعة الخامسة مساءً.", words: ["My", "flight", "departs", "from", "terminal", "three", "at", "five", "PM."], topic: "Travel", level: "Intermediate" },
    
    // Advanced
    { id: 31, english: "I think we need to rethink our current strategy.", arabic: "أعتقد أننا بحاجة إلى إعادة التفكير في استراتيجيتنا الحالية.", words: ["I", "think", "we", "need", "to", "rethink", "our", "current", "strategy."], topic: "Work", level: "Advanced" },
    { id: 32, english: "The weather has been quite unpredictable lately, hasn't it?", arabic: "كان الطقس متقلباً جداً مؤخراً، أليس كذلك؟", words: ["The", "weather", "has", "been", "quite", "unpredictable", "lately,", "hasn't", "it?"], topic: "Small Talk", level: "Advanced" }
];
