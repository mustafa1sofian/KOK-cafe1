'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// نوع الرسالة
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}




import { getCategories, getSubcategories, getMenuItems } from '@/lib/firestore';
import { getOffers } from '@/lib/firestore';
import { getEvents } from '@/lib/firestore';

// إعدادات DeepSeek API (يجب تمرير المفتاح من متغير بيئة)
const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://router.huggingface.co/v1/chat/completions';


export default function Chatbot() {
    const { language, isRTL } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // التمرير التلقائي لآخر رسالة
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // رسالة ترحيبية عند فتح الشات لأول مرة
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: Message = {
                id: Date.now().toString(),
                text: language === 'ar'
                    ? 'يا هلا والله! 👋 حياك الله في مطعم كوكيان. أنا هنا لخدمتك، آمرني وش بخاطرك؟'
                    : 'Welcome to Kokian Restaurant! 👋 How can I help you today?',
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, messages.length, language]);

    // دالة لجلب البيانات وتكوين الـ System Prompt
    const buildSystemPrompt = async () => {
        try {
            // جلب البيانات بشكل متوازي
            const [categories, subcategories, menuItems, offers, events] = await Promise.all([
                getCategories(),
                getSubcategories(),
                getMenuItems(),
                getOffers(true),
                getEvents(true)
            ]);

            // بناء هيكل المنيو
            let menuText = "📋 **المنيو والأطباق المتوفرة:**\n";

            categories.forEach(cat => {
                const catSubcats = subcategories.filter(sub => sub.categoryId === cat.id);
                if (catSubcats.length > 0) {
                    menuText += `\n- قسم ${cat.nameAr}:\n`;
                    catSubcats.forEach(sub => {
                        const subItems = menuItems.filter(item => item.subcategoryId === sub.id && item.isAvailable);
                        if (subItems.length > 0) {
                            menuText += `  * ${sub.nameAr}:\n`;
                            subItems.forEach(item => {
                                menuText += `    • ${item.nameAr} (${item.price} ر.س)${item.descriptionAr ? ` - ${item.descriptionAr}` : ''}\n`;
                            });
                        }
                    });
                }
            });

            // تنسيق العروض
            let offersText = "\n🔥 **العروض الحالية:**\n";
            const activeOffers = offers.filter(o => new Date(o.validUntil) >= new Date());
            if (activeOffers.length > 0) {
                activeOffers.forEach(offer => {
                    offersText += `• ${offer.titleAr}: ${offer.descriptionAr} بسعر ${offer.price} ر.س (ينتهي في ${new Date(offer.validUntil).toLocaleDateString('ar-SA')})\n`;
                });
            } else {
                offersText += "لا توجد عروض خاصة حالياً.\n";
            }

            // تنسيق الفعاليات
            let eventsText = "\n🎉 **الفعاليات القادمة:**\n";
            const upcomingEvents = events.filter(e => new Date(e.date) >= new Date());
            if (upcomingEvents.length > 0) {
                upcomingEvents.forEach(event => {
                    eventsText += `• ${event.titleAr}: بتاريخ ${new Date(event.date).toLocaleDateString('ar-SA')} الساعة ${event.time}، السعر ${event.price} ر.س للشخص.\n`;
                });
            } else {
                eventsText += "لا توجد فعاليات قادمة حالياً.\n";
            }

            // الـ Prompt النهائي
            return `
أنت "محمد"، موظف استقبال في مطعم "كوكيان" (Kokian Cuisine).

🌍 **قاعدة اللغة (Language Rule):**
1. **العربية**: تكلم بلهجة سعودية "عفوية" جداً ومحترمة (يا هلا، سم، أبشر، على خشمي).
2. **Other Languages**: If the user speaks ANY other language (English, French, Spanish, Chinese, etc.), **reply in the SAME language** fluently and professionally but keep a warm, friendly tone.

⛔ **Business Rules (Apply in ALL languages):**
1. **Answer Scope**: Only answer questions about the restaurant and food. Ignore off-topic queries politely.
2. **Reservations**: ALWAYS encourage booking a table (for individuals & groups). "Booking online is best to guarantee your spot."
3. **Gallery**: Suggest checking the website gallery for food/venue photos. "Check the Gallery section to see our vibes!"
4. **Delivery**: ⛔ NEVER suggest delivery. We want them to visit us.
5. **Conciseness**: Keep answers short and to the point.

📋 **Restaurant Info:**
- **Hours**: 7:00 AM - 3:00 AM (Daily).
- **Location**: Jeddah, Obhur Al Janobiyah, King Abdulaziz Road.
- **Booking**: Available for all (Singles & Families).

${menuText}

${offersText}

${eventsText}

**Simulation Examples:**
- User (Ar): "فيه طاولات؟" -> You: "يا هلا! عشان ترتاح وتضمن مكانك، احجز من الزر فوق 👆. ولا يفوتك تشوف صور الجلسات بالمعرض 📸."
- User (En): "Do you have tables?" -> You: "Welcome! To guarantee your spot, it's best to book via the button above 👆. You can also check our Gallery to see the venue! 📸"
- User (Indonesian): "Ada meja kosong?" -> You: "Selamat datang! Untuk memastikan tempat, silakan pesan melalui tombol di atas 👆. Lihat juga Galeri kami! 📸"
`;
        } catch (error) {
            console.error('Error fetching data for system prompt:', error);
            // Fallback prompt in case of error
            return `
أنت المساعد الذكي لمطعم كوكيان.
الموقع: جدة، أبحر الجنوبية.
ساعات العمل: 7 صباحاً - 3 فجراً.
لأي استفسار عن المنيو أو الحجز يرجى التواصل على: 0558121096.
            `;
        }
    };


    // إرسال الرسالة إلى DeepSeek API مباشرة
    const sendMessageToAPI = async (userMessage: string): Promise<string> => {
        try {
            // بناء System Prompt ديناميكي
            const dynamicSystemPrompt = await buildSystemPrompt();

            // بناء تاريخ المحادثة
            const conversationHistory = messages
                .filter(msg => msg.sender !== 'bot' || !msg.text.includes('مرحباً بك'))
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));

            // تجهيز الرسائل
            const apiMessages = [
                { role: 'system', content: dynamicSystemPrompt },
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            // الاتصال بـ DeepSeek API
            const response = await fetch(DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'deepseek-ai/DeepSeek-V3',
                    messages: apiMessages,
                    max_tokens: 500,
                    temperature: 0.7,
                    top_p: 0.9,
                }),
            });


            if (!response.ok) {
                const errorText = await response.text();
                console.error('DeepSeek API error:', response.status, errorText);
                throw new Error('API request failed');
            }

            const data = await response.json();

            // استخراج الرد
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            }

            // رد افتراضي في حالة عدم وجود استجابة
            return language === 'ar'
                ? 'عذراً، لم أتمكن من فهم سؤالك. هل يمكنك إعادة صياغته؟'
                : 'Sorry, I couldn\'t understand your question. Could you rephrase it?';

        } catch (error) {
            console.error('Error calling DeepSeek API:', error);

            // رد افتراضي عند حدوث خطأ
            return language === 'ar'
                ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى لاحقاً.'
                : 'Sorry, a connection error occurred. Please try again later.';
        }
    };

    // معالجة إرسال الرسالة
    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        // الحصول على الرد من API
        const botResponse = await sendMessageToAPI(userMessage.text);

        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: botResponse,
            sender: 'bot',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
    };

    // معالجة الضغط على Enter
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* زر الشات العائم */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          fixed right-6 bottom-6 z-50
          w-12 h-12 md:w-14 md:h-14
          bg-gradient-to-br from-blue-700 to-blue-900
          hover:from-blue-800 hover:to-blue-950
          text-white rounded-full shadow-2xl
          flex items-center justify-center
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          group
        `}
                aria-label={language === 'ar' ? 'فتح الشات' : 'Open Chat'}
            >
                {isOpen ? (
                    <X className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:rotate-90" />
                ) : (
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110" />
                )}

                {/* نقطة الإشعار */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {/* نافذة الشات المنبثقة */}
            <div
                className={`
          fixed right-6 bottom-20 z-50
          w-[calc(100vw-3rem)] sm:w-72 md:w-[360px]
          h-[480px] md:h-[500px]
          bg-white rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        `}
            >
                {/* رأس الشات */}
                <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 text-white">
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                                <h3 className={`font-bold text-base ${isRTL ? 'font-arabic' : ''}`}>
                                    {language === 'ar' ? 'مساعد كوكيان' : 'Kokian Assistant'}
                                </h3>
                                <p className="text-xs text-white/90">
                                    {language === 'ar' ? 'متصل الآن' : 'Online now'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* منطقة الرسائل */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                        >
                            <div
                                className={`
                  max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm
                  ${message.sender === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'
                                        : 'bg-white text-gray-800 border border-gray-200'
                                    }
                  ${isRTL ? 'font-arabic' : ''}
                `}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {message.text}
                                </p>
                                <span className={`text-xs mt-1 block ${message.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                                    {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* مؤشر الكتابة */}
                    {isLoading && (
                        <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* منطقة الإدخال */}
                <div className="p-3 bg-white border-t border-gray-200">
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                            disabled={isLoading}
                            className={`
                flex-1 px-3 py-2
                border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-sm
                ${isRTL ? 'text-right font-arabic' : 'text-left'}
              `}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className={`
                px-4 py-2
                bg-gradient-to-br from-blue-600 to-blue-800
                hover:from-blue-700 hover:to-blue-900
                text-white rounded-xl
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center
                min-w-[44px]
              `}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
