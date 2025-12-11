import { NextResponse } from 'next/server';
import { getCategories, getSubcategories, getMenuItems, getOffers, getEvents } from '@/lib/firestore';

// إعدادات DeepSeek API
// ملاحظة: نستخدم المتغير بدون NEXT_PUBLIC ليكون سرياً
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://router.huggingface.co/v1/chat/completions';

// Force this route to be dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

// --- Intelligent Input Validation Firewall ---
function validateInput(text: string): { isValid: boolean; error?: string } {
    if (!text || typeof text !== 'string') {
        return { isValid: false, error: 'Input cannot be empty' };
    }

    // 1. Length Limitation
    if (text.length > 500) {
        return { isValid: false, error: 'Message is too long (max 500 chars)' };
    }

    // 2. Deep Sanitization (Remove HTML & Scripts)
    const hasHTML = /<[^>]*>/g.test(text);
    const hasScripts = /javascript:|data:|vbscript:|on\w+=/i.test(text);

    if (hasHTML || hasScripts) {
        console.warn(`[Security Block] Potential XSS attempt detected: ${text}`);
        return { isValid: false, error: 'Security Alert: Malicious content detected.' };
    }

    // 3. Pattern Detection (SQL Injection & Command Injection specific patterns)
    // Even for NoSQL, detecting these patterns adds a layer of defense.
    const dangerousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|TABLE|INTO)\b)/i,
        /(\.\.\/|\/etc\/passwd|cmd\.exe|bin\/sh)/i
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
            console.warn(`[Security Block] Threat pattern detected: ${text}`);
            return { isValid: false, error: 'Security Alert: Threat pattern rejected.' };
        }
    }

    return { isValid: true };
}

export async function POST(req: Request) {
    try {
        // التحقق من وجود المفتاح
        if (!DEEPSEEK_API_KEY) {
            return NextResponse.json(
                { error: 'API key is not configured' },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { message, messagesHistory } = body;

        // --- Activate Input Firewall ---
        const validation = validateInput(message);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: validation.error || 'Invalid input' },
                { status: 400 }
            );
        }

        // 1. جلب البيانات لبناء الـ System Prompt
        const systemPrompt = await buildSystemPrompt();

        // 2. تجهيز تاريخ المحادثة
        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...(messagesHistory || []),
            { role: 'user', content: message }
        ];

        // 3. الاتصال بـ DeepSeek API
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
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        const botResponse = data.choices[0]?.message?.content ||
            'عذراً، لم أتمكن من فهم سؤالك. هل يمكنك إعادة صياغته؟';

        return NextResponse.json({ response: botResponse });

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}

// دالة بناء الـ Prompt (منقولة من Chatbot.tsx)
async function buildSystemPrompt() {
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
        console.error('Error constructing prompt:', error);
        return `أنت المساعد الذكي لمطعم كوكيان. الموقع: جدة، أبحر الجنوبية.`;
    }
}
