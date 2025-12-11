'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// نوع الرسالة
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

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

    // إرسال الرسالة إلى API الخادم
    const sendMessageToAPI = async (userMessage: string): Promise<string> => {
        try {
            // بناء تاريخ المحادثة
            const messagesHistory = messages
                .filter(msg => msg.sender !== 'bot' || !msg.text.includes('مرحباً بك'))
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                }));

            // الاتصال بالخادم الخاص بنا
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    messagesHistory: messagesHistory
                }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.response;

        } catch (error) {
            console.error('Error calling Chat API:', error);

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
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`
              fixed right-6 bottom-24 md:bottom-6 z-[60]
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
                    <Bot className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110" />

                    {/* نقطة الإشعار */}
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                </button>
            )}

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
                                <Bot className="w-6 h-6" />
                            </div>
                            <div className={isRTL ? 'text-right' : 'text-left'}>
                                <h3 className={`font-bold text-base ${isRTL ? 'font-arabic' : ''}`}>
                                    {language === 'ar' ? 'المساعد الذكي (Kokian AI)' : 'Kokian AI Assistant'}
                                </h3>
                                <p className="text-xs text-white/90">
                                    {language === 'ar' ? 'متصل الآن' : 'Online now'}
                                </p>
                            </div>
                        </div>

                        {/* Close Button Mobile */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
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
