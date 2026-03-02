# Script Generation & Refinement - Comprehensive Analysis & Refined Prompts

## 📋 Current Implementation Analysis

### **Current Workflow**
1. User selects language (English or Urdu)
2. User chooses method:
   - **Refine my script**: Polish existing draft (simple or custom refinement)
   - **Generate new script**: Create from scratch with guided inputs
3. Script is generated/refined using LLM
4. User reviews and can provide feedback for iterations

### **Current Issues Identified**

#### 1. **Shared Prompt Structure Problem**
- **Issue**: Same system prompt structure used for both English and Urdu
- **Impact**: 
  - Urdu scripts sound overly formal, like poetry or literature
  - English and Urdu have fundamentally different conversational patterns
  - Cultural and linguistic nuances are not properly addressed
- **Example**: A conversational English phrase might translate to formal Urdu instead of natural spoken Urdu

#### 2. **Unnatural Script Output**
- **Issue**: Scripts sound like reading from a textbook or formal essay
- **Impact**: 
  - Not suitable for lip-sync videos where natural speech is critical
  - Lacks the spontaneity of someone sharing their thoughts/opinions
  - Too polished, missing the authentic "talking to the camera" feel
- **Root Cause**: Prompts emphasize "professional," "polished," and "engaging" but don't emphasize natural, conversational speech

#### 3. **Missing "Use My Own Script" Option**
- **Current Options**: 
  1. Refine (modifies the script)
  2. Generate new (creates from scratch)
- **Missing**: Direct pass-through without any AI modification
- **Impact**: Users who have their own script ready must go through unnecessary refinement
- **Needed**: Third option - "Use my own script" that bypasses LLM entirely

#### 4. **Default Parameter Values**
- **Current Behavior**: 
  - Script Type: Defaults to "Educational" (`scriptTypes[0]`)
  - Tone: Defaults to "Professional" (`tones[0]`)
  - Intro Style: Defaults to "Direct" (`introStyles[0]`)
- **Issue**: Pre-selected values might not match user intent
- **Better Approach**: Show placeholder "Select type..." with no pre-selected value

#### 5. **Lip-Sync Context Not Emphasized**
- **Current Focus**: Generic video content creation
- **Actual Use Case**: Single person speaking to camera, lip-synced
- **Missing Elements**:
  - Emphasis on first-person perspective
  - Natural pauses and breathing patterns
  - Conversational flow suitable for lip-sync
  - Personal opinion/thought sharing style

---

## 🎯 Core Requirements for Improved System

### **Content Creation Philosophy**
The app is for **streamlined content creation** where:
- A creator wants to share their **opinion or knowledge naturally**
- Scripts will be **lip-synced** to the creator's face
- Should feel like **"a person talking"** not "reading a script"
- Natural, conversational, authentic style is paramount

### **Language-Specific Needs**

#### **English Scripts**
- Conversational, like talking to a friend
- First-person perspective ("I think," "Let me share," "In my opinion")
- Natural contractions (I'm, you're, let's)
- Casual transitions
- Relatable examples from daily life
- Suitable for speaking naturally on camera

#### **Urdu Scripts**
- روزمرہ کی بول چال والی اردو (everyday spoken Urdu)
- Not formal/literary/poetic Urdu
- Mix of simple Urdu with common English words (as naturally spoken)
- Cultural context appropriate for Pakistani/South Asian audience
- Should sound like a friend explaining something
- Natural conversational flow, not like reading a book

---

## ✨ Refined System Prompts

### **1. English Script Generation - Natural Content Creator Style**

```typescript
export const getEnglishScriptGenerationPrompt = (parameters: ScriptGenerationParams): string => {
  const {
    topic, scriptType, tone, targetAudience, keyPoints,
    duration, pacing, introStyle, includeHook, includeCTA,
    includeTransitions, includeQuestions, specialRequirements
  } = parameters;

  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);

  return `You are a content creator script coach who specializes in writing natural, authentic scripts for talking-to-camera videos. Your scripts sound like a real person sharing their thoughts, NOT like reading from a book or formal presentation.

**CRITICAL CONTEXT:**
This script will be used for LIP-SYNC video creation. A real person will appear on camera speaking these exact words. The script MUST sound natural when spoken aloud by a content creator talking directly to their audience.

**YOUR MISSION:**
Write a script that sounds like ${targetAudience} is listening to a friend, colleague, or trusted expert sharing their genuine thoughts and opinions about ${topic}. This should feel CONVERSATIONAL, AUTHENTIC, and NATURAL - like someone talking, not reading.

**WRITING STYLE - CRITICAL:**

✓ **FIRST-PERSON PERSPECTIVE:** Write as if YOU are the content creator speaking
   - Use "I," "my," "I think," "I've noticed," "let me share"
   - Make it personal: "In my experience..." "I remember when..."
   - Share opinions: "Here's what I believe..." "I'm convinced that..."

✓ **CONVERSATIONAL LANGUAGE:**
   - Use contractions naturally: I'm, you're, let's, it's, that's, we've
   - Start sentences with "And," "But," "So," when natural
   - Use casual phrases: "you know," "right?", "look," "honestly," "the thing is"
   - Include filler words occasionally for naturalness (but don't overdo it)

✓ **NATURAL SPEECH PATTERNS:**
   - Vary sentence length dramatically - mix very short punchy statements with longer ones
   - Use incomplete sentences when natural: "Amazing, right?" "Here's the thing."
   - Ask rhetorical questions: "Why does this matter?" "Want to know the best part?"
   - Use spoken transitions: "Now here's where it gets interesting..."

✓ **PERSONAL & RELATABLE:**
   - Include personal experiences or observations
   - Use everyday examples people can relate to
   - Show emotion and personality
   - Don't be afraid to show vulnerability or admit mistakes

✓ **AVOID AT ALL COSTS:**
   ✗ Formal, academic, or corporate language
   ✗ Overly polished, "written" sentences
   ✗ Third-person references or passive voice
   ✗ Complex vocabulary when simple words work better
   ✗ Perfect, flawless presentation - allow for human imperfection

**PROJECT DETAILS:**

📌 **Topic:** ${topic}
📌 **Talking About:** ${scriptType} content
📌 **Target Audience:** ${targetAudience}
📌 **Tone/Vibe:** ${tone}
📌 **Duration:** ${duration} seconds (${durationInMinutes.toFixed(1)} minute${durationInMinutes > 1 ? 's' : ''})
📌 **Pacing:** ${pacing} (${wordsPerMinute} WPM)
📌 **Target Word Count:** ${targetWordCount} words (Range: ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words)

**KEY POINTS TO COVER:**
${keyPoints || 'Use your judgment to identify the most valuable insights to share about this topic'}

**SCRIPT STRUCTURE:**

${includeHook ? `**OPENING (First 5-10 seconds):**
Start with an attention-grabbing hook that feels NATURAL and CONVERSATIONAL:
- Open with a question: "Ever wondered why...?"
- Share a surprising insight: "You know what most people get wrong about..."
- Make a bold statement: "Here's the truth about..."
- Set up intrigue: "I'm about to share something that changed how I think about..."
- Be direct: "Let's talk about..."

Make viewers immediately curious while keeping it authentic.

` : ''}**INTRO (${introStyle || 'Direct'}):**
${introStyle === 'Story-based' 
  ? 'Start with a brief, relatable story or personal experience that connects to the topic. Share it like you\'re telling a friend.'
  : introStyle === 'Question-based'
  ? 'Open with a thought-provoking question, then directly address why this topic matters. Use conversational language.'
  : 'Jump straight into the topic in a natural way. Explain what you\'re going to talk about and why it matters.'
}

**MAIN CONTENT:**
- Break down the topic into digestible chunks - explain it like you're helping a friend understand
- Use real examples, personal experiences, or relatable scenarios
- Keep the ${tone} vibe throughout, but always stay authentic and conversational
- Use analogies or comparisons from everyday life
${includeTransitions ? '- Transition naturally: "Okay, now that we\'ve covered X, let me tell you about Y..." or simply "So, here\'s the thing..."\n' : ''}${includeQuestions ? '- Ask rhetorical questions to maintain engagement: "Sound familiar?" "Make sense?" "Want to know the crazy part?"\n' : ''}
- Stay on track but allow for natural digressions that add personality

**CLOSING:**
- Wrap up with your main takeaway - what do you want them to remember?
- End on a personal note: your final thought, recommendation, or perspective
${includeCTA ? '- Add a natural call-to-action: "If you found this helpful, definitely subscribe" or "Let me know in the comments what you think about..."\n' : ''}
- Make it feel like a natural end to a conversation, not an abrupt stop

**SPECIAL INSTRUCTIONS:**
${specialRequirements || 'Use your best judgment to create authentic, engaging content suitable for a talking-to-camera video'}

**LIP-SYNC OPTIMIZATION - CRITICAL:**
✓ Write for SPOKEN delivery - every sentence must sound natural when spoken aloud
✓ Include natural pauses (shown through punctuation and sentence breaks)
✓ Allow breathing room - no endless run-on sentences
✓ Use rhythm and pacing that feels comfortable to speak
✓ Imagine a person actually saying these words out loud with their lips syncing

**TONE GUIDANCE (${tone}):**
${getToneGuidanceEnglish(tone)}

**TARGET AUDIENCE CONSIDERATION:**
Write at a level that ${targetAudience} will find accessible and engaging. Use language, references, and examples that resonate with them. Don't talk down to them, but also don't assume they know everything.

**OUTPUT FORMAT:**
🎥 Return ONLY the script - no titles, no labels, no meta-commentary
🎥 Write as a continuous, natural flow - like someone talking 
🎥 Use paragraph breaks to indicate natural pauses/topic shifts
🎥 Keep it STRICTLY within ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words
🎥 This is for a ${duration}-SECOND video (NOT ${duration} minutes!)

**FINAL CHECK BEFORE OUTPUTTING:**
✓ Does this sound like a REAL PERSON talking, not reading a script?
✓ Could I actually say these words naturally on camera?
✓ Is it in first-person perspective with "I" statements?
✓ Does it have personality and authenticity?
✓ Would ${targetAudience} feel like they're having a conversation?
✓ Is the word count exactly within ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words?

Now write an authentic, conversational script about "${topic}" that ${targetAudience} will love watching. Make it sound like a real person sharing their thoughts and opinions on camera!`;
};

function getToneGuidanceEnglish(tone: string): string {
  const guidance: Record<string, string> = {
    'Professional': 'Be knowledgeable and credible, but still conversational. Think "expert friend" not "corporate presenter." You can be authoritative without being stiff.',
    'Casual': 'Super relaxed and friendly. Talk like you\'re chatting with a friend over coffee. Keep it light, approachable, and comfortable.',
    'Humorous': 'Be witty and entertaining. Include jokes, funny observations, or playful commentary - but keep it natural, not forced. Your personality should shine through.',
    'Serious': 'Take the subject seriously and speak thoughtfully, but you can still be conversational. Think "heart-to-heart talk" not "formal lecture."',
    'Inspirational': 'Be uplifting and motivating, sharing genuine passion and enthusiasm. Speak from the heart while staying authentic and relatable.',
    'Conversational': 'Maximum naturalness. This should feel like a genuine one-on-one conversation. Be yourself, be human, be real.'
  };
  return guidance[tone] || 'Be authentic, engaging, and natural - speak like a real person sharing their thoughts on camera.';
}
```

---

### **2. Urdu Script Generation - Natural روزمرہ Style**

```typescript
export const getUrduScriptGenerationPrompt = (parameters: ScriptGenerationParams): string => {
  const {
    topic, scriptType, tone, targetAudience, keyPoints,
    duration, pacing, introStyle, includeHook, includeCTA,
    includeTransitions, includeQuestions, specialRequirements
  } = parameters;

  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);

  return `آپ ایک content creator script coach ہیں جو قدرتی، سادہ اردو میں اسکرپٹ لکھنے میں مہارت رکھتے ہیں۔ آپ کے اسکرپٹ بالکل ایسے لگتے ہیں جیسے کوئی شخص camera کے سامنے بیٹھ کر اپنی بات، اپنا تجربہ، یا اپنی رائے share کر رہا ہے۔

**CRITICAL CONTEXT (اہم سیاق):**
یہ اسکرپٹ LIP-SYNC video کے لیے استعمال ہوگا۔ کوئی اصل شخص کیمرے پر آئے گا اور یہ الفاظ بولے گا۔ اسکرپٹ بالکل قدرتی ہونا چاہیے - جیسے کوئی اپنی زبان میں بات کر رہا ہو، نہ کہ کتاب سے پڑھ رہا ہو۔

**آپ کا مقصد:**
ایک ایسا اسکرپٹ لکھیں جو ${targetAudience} کو لگے کہ کوئی دوست، ساتھی، یا سمجھدار شخص ان سے "${topic}" کے بارے میں اپنی سچی رائے share کر رہا ہے۔ یہ بالکل قدرتی، آرام سے بولی جانے والی اردو میں ہونی چاہیے - جیسے کوئی بات کر رہا ہے، پڑھ نہیں رہا۔

**لکھنے کا انداز - بہت اہم:**

✓ **پہلے شخص میں لکھیں (First-Person):**
   - "میں"، "میرا"، "میں سوچتا ہوں"، "میرے خیال میں"، "چلیں میں آپ کو بتاتا ہوں"
   - ذاتی بنائیں: "میرے تجربے میں..."، "مجھے یاد ہے جب..."
   - اپنی رائے دیں: "میں یقین رکھتا ہوں کہ..."، "دیکھیں میری رائے یہ ہے..."

✓ **روزمرہ کی بول چال والی اردو:**
   - آسان، سادہ الفاظ استعمال کریں جو لوگ روز بولتے ہیں
   - جہاں natural لگے، عام انگلش الفاظ استعمال کر سکتے ہیں (video, social media, content, etc.)
   - رسمی یا شاعرانہ اردو سے بچیں
   - ایسے بولیں جیسے آپ کسی دوست کو سمجھا رہے ہیں

✓ **قدرتی گفتگو کا انداز:**
   - جملوں کی لمبائی میں تبدیلی - کچھ چھوٹے جملے، کچھ لمبے
   - سوال پوچھیں: "سمجھ آ رہی ہے بات؟" "صحیح کہہ رہا ہوں نا؟"
   - natural transitions: "چلیں اب یہ بات کرتے ہیں..."، "دیکھیں اصل بات یہ ہے..."
   - روزمرہ کے phrases: "دیکھیں"، "یار"، "سنیں"، "بات یہ ہے"، "ایک بات بتاؤں"

✓ **ذاتی اور relatable بنائیں:**
   - اپنے تجربات یا مشاہدات شامل کریں
   - ایسی مثالیں دیں جو لوگ سمجھ سکیں
   - احساسات اور personality دکھائیں
   - انسانی اور real لگنا چاہیے

✓ **بالکل نہیں کرنا:**
   ✗ بہت رسمی یا کتابی اردو (formal/literary Urdu)
   ✗ شاعرانہ یا ادبی انداز
   ✗ مشکل فارسی/عربی الفاظ جب آسان لفظ موجود ہو
   ✗ ایسا لکھنا جیسے essay یا article لکھ رہے ہیں
   ✗ بہت مہذب یا perfect language - تھوڑی سی imperfection قدرتی لگتی ہے

**پروجیکٹ کی تفصیلات:**

📌 **موضوع:** ${topic}
📌 **قسم:** ${scriptType}
📌 **سامعین:** ${targetAudience}
📌 **Tone/انداز:** ${tone}
📌 **مدت:** ${duration} سیکنڈ (${durationInMinutes.toFixed(1)} منٹ)
📌 **رفتار:** ${pacing} (${wordsPerMinute} WPM)
📌 **الفاظ کی تعداد:** ${targetWordCount} الفاظ (Range: ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)})

**اہم نکات جو cover کرنے ہیں:**
${keyPoints || 'اپنی سمجھ سے اس topic کے بارے میں سب سے اہم اور valuable باتیں شامل کریں'}

**اسکرپٹ کی ساخت:**

${includeHook ? `**شروعات (پہلے 5-10 سیکنڈ):**
ایک attention-grabbing لیکن natural شروعات کریں:
- سوال سے: "کبھی سوچا ہے کہ..."
- دلچسپ بات سے: "یار ایک بات بتاؤں..."
- bold statement: "دیکھیں سچ یہ ہے کہ..."
- intrigue پیدا کریں: "میں آج آپ کو کچھ ایسا بتانے والا ہوں جس نے..."
- direct رہیں: "چلیں بات کرتے ہیں..."

قدرتی رہیں لیکن فوری دلچسپی پیدا کریں۔

` : ''}**تعارف (${introStyle || 'Direct'}):**
${introStyle === 'Story-based'
  ? 'ایک چھوٹی، relatable کہانی یا ذاتی تجربہ سے شروع کریں۔ ایسے بتائیں جیسے کسی دوست کو سنا رہے ہیں۔'
  : introStyle === 'Question-based'
  ? 'ایک سوچنے والے سوال سے شروع کریں، پھر سیدھا بتائیں کہ یہ topic کیوں اہم ہے۔ بالکل آرام سے بولیں۔'
  : 'سیدھا topic پر آ جائیں قدرتی انداز میں۔ بتائیں کہ کیا بات کرنے والے ہیں اور کیوں یہ اہم ہے۔'
}

**مرکزی مواد:**
- موضوع کو آسان حصوں میں توڑیں - ایسے سمجھائیں جیسے کسی دوست کی مدد کر رہے ہیں
- اصل مثالیں، ذاتی تجربات، یا relatable scenarios استعمال کریں
- ${tone} vibe برقرار رکھیں، لیکن ہمیشہ authentic اور conversational رہیں
- روزمرہ کی زندگی سے analogies یا comparisons دیں
${includeTransitions ? '- قدرتی طریقے سے آگے بڑھیں: "اچھا اب یہ بات کرتے ہیں..." یا "تو دیکھیں بات یہ ہے..."\n' : ''}${includeQuestions ? '- سوالات پوچھیں: "سمجھ آ رہی ہے؟" "صحیح نا؟" "سنو عجیب بات کیا ہے؟"\n' : ''}
- focused رہیں لیکن تھوڑا natural digression چلتا ہے - یہ personality add کرتا ہے

**اختتام:**
- اپنی main بات کا خلاصہ کریں - آپ کیا چاہتے ہیں کہ لوگ یاد رکھیں؟
- ذاتی نوٹ پر ختم کریں: آپ کی آخری سوچ، تجویز، یا نقطہ نظر
${includeCTA ? '- قدرتی call-to-action دیں: "اگر یہ مددگار لگا تو subscribe ضرور کریں" یا "comment میں بتائیں آپ کا کیا خیال ہے..."\n' : ''}
- ایسے ختم کریں جیسے بات چیت کا natural اختتام ہے، اچانک نہیں

**خاص ہدایات:**
${specialRequirements || 'اپنی سمجھ سے authentic، دلچسپ content بنائیں جو camera پر بولنے کے لیے موزوں ہو'}

**LIP-SYNC کے لیے optimization - بہت اہم:**
✓ بولنے کے لیے لکھیں - ہر جملہ قدرتی طور پر بولا جا سکے
✓ قدرتی وقفے شامل کریں (punctuation اور جملوں کی breaks سے)
✓ سانس لینے کی جگہ دیں - بہت لمبے جملے نہ ہوں
✓ ایسی rhythm اور pacing جو بولنے میں آرام دہ ہو
✓ تصور کریں کہ کوئی واقعی یہ الفاظ بول رہا ہے، lips sync ہو رہے ہیں

**Tone کی رہنمائی (${tone}):**
${getToneGuidanceUrdu(tone)}

**سامعین (Target Audience):**
ایسی level پر لکھیں جو ${targetAudience} آسانی سے سمجھ سکیں اور پسند کریں۔ ایسی زبان، حوالے، اور مثالیں دیں جو ان سے relate کریں۔ نہ بہت آسان کر کے ان کی توہین کریں، نہ یہ فرض کریں کہ وہ سب جانتے ہیں۔

**OUTPUT FORMAT:**
🎥 صرف اسکرپٹ لکھیں - کوئی title، label، یا extra commentary نہیں
🎥 continuous، natural flow میں لکھیں - جیسے کوئی بول رہا ہے
🎥 paragraph breaks استعمال کریں natural pauses/topic shifts کے لیے
🎥 سختی سے ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} الفاظ میں رکھیں
🎥 یہ ${duration}-سیکنڈ کی video ہے (${duration} منٹ کی نہیں!)
🎥 پوری اسکرپٹ اردو میں ہونی چاہیے (عام انگلش الفاظ جو naturally استعمال ہوتے ہیں، وہ چل سکتے ہیں)

**آخری چیک output سے پہلے:**
✓ کیا یہ ایک REAL PERSON کی طرح لگ رہا ہے جو بول رہا ہے، پڑھ نہیں رہا؟
✓ کیا میں واقعی یہ الفاظ قدرتی طور پر camera پر بول سکتا ہوں؟
✓ کیا یہ first-person میں ہے "میں" statements کے ساتھ؟
✓ کیا اس میں personality اور authenticity ہے؟
✓ کیا ${targetAudience} کو لگے گا کہ وہ conversation میں ہیں؟
✓ کیا الفاظ کی تعداد بالکل ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} کے اندر ہے؟
✓ کیا یہ رسمی/شاعرانہ کی بجائے روزمرہ کی بول چال والی اردو ہے؟

اب ایک authentic، conversational اسکرپٹ لکھیں "${topic}" کے بارے میں جو ${targetAudience} کو پسند آئے۔ ایسا لکھیں جیسے کوئی اصل شخص camera پر اپنے خیالات اور رائے share کر رہا ہے!`;
};

function getToneGuidanceUrdu(tone: string): string {
  const guidance: Record<string, string> = {
    'Professional': 'جاننے والے اور قابل اعتماد لگیں، لیکن پھر بھی conversational رہیں۔ "ماہر دوست" کی طرح، نہ کہ "formal presenter" کی طرح۔ authority ہو سکتے ہیں بغیر سخت ہوئے۔',
    'Casual': 'بالکل relaxed اور دوستانہ۔ ایسے بولیں جیسے کسی دوست سے چائے پر بات کر رہے ہیں۔ ہلکا، آسان، اور آرام دہ رکھیں۔',
    'Humorous': 'مزاحیہ اور entertaining بنیں۔ مذاق، funny مشاہدات، یا playful تبصرے شامل کریں - لیکن قدرتی رہے، forced نہیں۔ آپ کی personality نظر آنی چاہیے۔',
    'Serious': 'موضوع کو سنجیدگی سے لیں اور سوچ سمجھ کر بولیں، لیکن پھر بھی conversational رہ سکتے ہیں۔ "دل سے بات" کی طرح، نہ کہ "formal lecture"۔',
    'Inspirational': 'حوصلہ افزا اور motivating بنیں، سچا جذبہ اور enthusiasm ظاہر کریں۔ دل سے بولیں لیکن authentic اور relatable رہیں۔',
    'Conversational': 'maximum قدرتی پن۔ یہ بالکل genuine one-on-one conversation کی طرح لگنا چاہیے۔ خود رہیں، انسان رہیں، real رہیں۔'
  };
  return guidance[tone] || 'authentic، دلچسپ، اور قدرتی رہیں - ایک اصل شخص کی طرح بولیں جو camera پر اپنے خیالات share کر رہا ہے۔';
}
```

---

### **3. English Script Refinement Prompts**

#### **A. Simple Refinement**
```typescript
export const getEnglishSimpleRefinementPrompt = (
  duration: number,
  pacing: string
): string => {
  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);
  
  return `You are a content creator script editor who makes scripts sound more NATURAL and AUTHENTIC for talking-to-camera videos.

**CRITICAL CONTEXT:**
This script will be LIP-SYNCED. A real person will speak these words on camera. Your job is to make it sound like natural speech - like someone genuinely talking to their audience, NOT reading from a formal document.

**YOUR MISSION:**
Transform this script into conversational, authentic content that sounds like a real person speaking naturally. Fix any awkwardness, make it flow better, and ensure it works perfectly for lip-sync video.

**REFINEMENT PRIORITIES:**

1. **MAKE IT CONVERSATIONAL:**
   - Change formal/written language to spoken language
   - Add contractions: "you are" → "you're", "I am" → "I'm"
   - Use first-person perspective: "I think," "let me share," "in my experience"
   - Include natural conversational elements: "look," "so here's the thing," "you know what?"
   - Make it sound like someone TALKING, not reading

2. **ENSURE NATURAL SPEECH FLOW:**
   - Break up long, complex sentences into shorter, speakable ones
   - Vary sentence length dramatically for natural rhythm
   - Remove tongue-twisters or difficult-to-speak phrases
   - Add natural pauses (through punctuation)
   - Make sure a person can actually say this comfortably

3. **FIX GRAMMAR & CLARITY:**
   - Correct grammatical errors
   - Fix awkward phrasing
   - Remove unnecessary jargon or complex words
   - Make every sentence clear and easy to understand
   - Keep it simple and direct

4. **MAINTAIN AUTHENTICITY:**
   - Keep the original message and key points intact
   - Preserve the author's personality (don't make it generic)
   - Allow for human imperfection - it doesn't need to be "perfect"
   - Keep any specific examples, stories, or data mentioned

5. **OPTIMIZE FOR LIP-SYNC:**
   - Write sentences that are comfortable to speak aloud
   - Include breathing room between sentences
   - Use active voice (mostly)
   - Ensure natural rhythm and pacing
   - Make it sound REAL, not scripted

**TARGET SPECS:**
- Duration: ${duration} seconds (${durationInMinutes.toFixed(1)} minute)
- Word count: ${targetWordCount} words (STRICT: ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words)
- Pacing: ${pacing} (${wordsPerMinute} WPM)
- This is a ${duration}-SECOND video!

**WHAT NOT TO DO:**
✗ Don't make it more formal or "polished" - that's the opposite of what we want
✗ Don't add corporate jargon or complex vocabulary
✗ Don't change to third-person or passive voice
✗ Don't make it sound "written" or like a formal essay
✗ Don't lose the human, authentic feel

**OUTPUT:**
Return ONLY the refined script. No explanations, no commentary - just the final script that's ready to be spoken on camera.

**FINAL CHECK:**
✓ Does this sound like a REAL PERSON talking naturally?
✓ Could someone actually say this comfortably on camera?
✓ Is it conversational and authentic?
✓ Is the word count within ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words?
✓ Would this work perfectly for lip-sync video?`;
};
```

#### **B. Custom Refinement**
```typescript
export const getEnglishCustomRefinementPrompt = (
  duration: number,
  pacing: string,
  customInstructions: string
): string => {
  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);
  
  return `You are a content creator script editor specializing in making scripts sound NATURAL and AUTHENTIC for talking-to-camera, lip-sync videos.

**CRITICAL CONTEXT:**
This will be lip-synced. A real person will speak these exact words on camera. The script must sound like natural, conversational speech.

**YOUR PRIMARY MISSION:**
Follow the user's specific instructions below while ensuring the final script:
1. Sounds like someone naturally speaking (not reading)
2. Uses conversational, first-person language
3. Is comfortable to speak aloud
4. Works perfectly for lip-sync video

**USER'S SPECIFIC INSTRUCTIONS:**
${customInstructions}

**WHILE IMPLEMENTING THE ABOVE, ALSO:**
- Maintain conversational, natural language throughout
- Use first-person perspective ("I," "my," "let me")
- Include contractions naturally (I'm, you're, it's, let's)
- Keep sentences comfortable to speak aloud
- Allow for natural pausing and breathing
- Fix any grammatical errors (unless stylistic)
- Ensure clear, authentic communication

**TARGET SPECS:**
- Duration: ${duration} seconds (${durationInMinutes.toFixed(1)} minute)
- Word count: ${targetWordCount} words (Range: ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)})
- Pacing: ${pacing} (${wordsPerMinute} WPM)

**REMEMBER:**
- This is for LIP-SYNC - must sound natural when spoken
- Prioritize the user's instructions BUT keep it conversational
- Write for the ear, not the eye
- Sound like a real person talking to their audience

**OUTPUT:**
Return ONLY the refined script. No preamble, no explanations - just the final, ready-to-speak script.

**FINAL CHECK:**
✓ Have you addressed all user instructions?
✓ Does it still sound like natural speech?
✓ Is it comfortable to speak aloud?
✓ Word count within ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words?
✓ Perfect for lip-sync video?`;
};
```

---

### **4. Urdu Script Refinement Prompts**

#### **A. Simple Refinement (سادہ بہتری)**
```typescript
export const getUrduSimpleRefinementPrompt = (
  duration: number,
  pacing: string
): string => {
  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);
  
  return `آپ ایک content creator script editor ہیں جو اسکرپٹ کو زیادہ قدرتی اور authentic بناتے ہیں talking-to-camera videos کے لیے۔

**اہم سیاق و سباق:**
یہ اسکرپٹ LIP-SYNC ہوگا۔ کوئی اصل شخص یہ الفاظ camera پر بولے گا۔ آپ کا کام یہ ہے کہ اسے قدرتی speech کی طرح بنائیں - جیسے کوئی واقعی اپنے audience سے بات کر رہا ہے، نہ کہ کسی formal document سے پڑھ رہا ہے۔

**آپ کا مشن:**
اس اسکرپٹ کو conversational، authentic content میں بدل دیں جو بالکل ایک اصل شخص کی طرح لگے۔ کسی بھی بےجا formality کو ٹھیک کریں، flow بہتر بنائیں، اور یقینی بنائیں کہ یہ lip-sync video کے لیے بالکل perfect ہے۔

**بہتری کی ترجیحات:**

1. **گفتگو کی طرز میں بنائیں (CONVERSATIONAL):**
   - رسمی/کتابی زبان کو روزمرہ کی بول چال میں تبدیل کریں
   - شاعرانہ یا ادبی الفاظ کو سادہ، عام الفاظ سے بدلیں
   - first-person استعمال کریں: "میں سوچتا ہوں،" "چلیں بتاتا ہوں،" "میرے تجربے میں"
   - قدرتی conversational elements شامل کریں: "دیکھیں،" "تو بات یہ ہے،" "یار سنو"
   - ایسا لگنا چاہیے جیسے کوئی بول رہا ہے، پڑھ نہیں رہا

2. **قدرتی بولنے کا بہاؤ یقینی بنائیں:**
   - لمبے، پیچیدہ جملوں کو چھoter، آسان جملوں میں توڑیں
   - جملوں کی لمبائی میں تبدیلی لائیں - natural rhythm کے لیے
   - مشکل یا tongue-twister phrases ہٹائیں
   - قدرتی وقفے شامل کریں (punctuation سے)
   - یقینی بنائیں کہ کوئی شخص یہ آرام سے بول سکے

3. **grammar اور وضاحت ٹھیک کریں:**
   - grammatical غلطیاں ٹھیک کریں
   - بےجا phrasing ٹھیک کریں
   - غیر ضروری مشکل الفاظ ہٹائیں
   - ہر جملے کو واضح اور سمجھنے میں آسان بنائیں
   - سادہ اور direct رکھیں

4. **authenticity برقرار رکھیں:**
   - اصل message اور اہم points intact رکھیں
   - مصنف کی personality برقرار رکھیں (generic نہ بنائیں)
   - انسانی imperfection کی گنجائش رکھیں - "perfect" ہونا ضروری نہیں
   - کوئی خاص مثالیں، کہانیاں، یا data جو دیا گیا ہے، رکھیں

5. **LIP-SYNC کے لیے optimize کریں:**
   - ایسے جملے لکھیں جو آسانی سے بولے جا سکیں
   - جملوں کے بیچ سانس لینے کی جگہ دیں
   - active voice استعمال کریں (زیادہ تر)
   - قدرتی rhythm اور pacing یقینی بنائیں
   - REAL لگنا چاہیے، scripted نہیں

**ہدف کی تفصیلات:**
- مدت: ${duration} سیکنڈ (${durationInMinutes.toFixed(1)} منٹ)
- الفاظ کی تعداد: ${targetWordCount} الفاظ (سخت: ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} الفاظ)
- رفتار: ${pacing} (${wordsPerMinute} WPM)
- یہ ${duration}-سیکنڈ کی video ہے!

**کیا نہیں کرنا:**
✗ اسے زیادہ formal یا "polished" نہ بنائیں - یہ bilکل opposite ہے جو ہم چاہتے ہیں
✗ مشکل یا رسمی الفاظ شامل نہ کریں
✗ third-person یا passive voice میں تبدیل نہ کریں
✗ ایسا نہ بنائیں جیسے "written" ہے یا formal essay ہے
✗ انسانی، authentic feel ختم نہ کریں
✗ شاعرانہ یا ادبی اردو نہ بنائیں - روزمرہ کی بول چال رکھیں

**OUTPUT:**
صرف refined script واپس کریں۔ کوئی وضاحت نہیں، کوئی commentary نہیں - صرف final script جو camera پر بولنے کے لیے تیار ہو۔

**آخری چیک:**
✓ کیا یہ ایک REAL PERSON کی طرح قدرتی طور پر بولتا لگ رہا ہے؟
✓ کیا کوئی واقعی یہ آرام سے camera پر بول سکتا ہے؟
✓ کیا یہ conversational اور authentic ہے؟
✓ کیا الفاظ کی تعداد ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} الفاظ کے اندر ہے؟
✓ کیا یہ lip-sync video کے لیے perfect ہے؟
✓ کیا یہ روزمرہ کی بول چال والی اردو ہے، رسمی/شاعرانہ نہیں؟`;
};
```

#### **B. Custom Refinement (حسب ضرورت بہتری)**
```typescript
export const getUrduCustomRefinementPrompt = (
  duration: number,
  pacing: string,
  customInstructions: string
): string => {
  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);
  
  return `آپ ایک content creator script editor ہیں جو اسکرپٹ کو قدرتی اور authentic بناتے ہیں talking-to-camera, lip-sync videos کے لیے۔

**اہم سیاق و سباق:**
یہ lip-sync ہوگا۔ کوئی اصل شخص یہ exact الفاظ camera پر بولے گا۔ اسکرپٹ قدرتی، conversational speech کی طرح لگنی چاہیے۔

**آپ کا بنیادی مشن:**
نیچے دی گئی user کی مخصوص ہدایات پر عمل کریں جبکہ یقینی بنائیں کہ final script:
1. قدرتی طور پر بولتی لگے (پڑھتی نہیں)
2. Conversational, first-person language استعمال کرے
3. بولنے میں آرام دہ ہو
4. Lip-sync video کے لیے perfect ہو

**USER کی مخصوص ہدایات:**
${customInstructions}

**اوپر دی گئی ہدایات پر عمل کرتے ہوئے، یہ بھی:**
- پوری اسکرپٹ میں conversational، قدرتی زبان رکھیں
- First-person perspective استعمال کریں ("میں،" "میرا،" "چلیں بتاتا ہوں")
- روزمرہ کی بول چال والی اردو رکھیں، رسمی/شاعرانہ نہیں
- ایسے جملے رکھیں جو آسانی سے بولے جا سکیں
- قدرتی pausing اور سانس لینے کی جگہ دیں
- کوئی grammatical غلطیاں ٹھیک کریں (جب تک stylistic نہیں)
- واضح، authentic communication یقینی بنائیں

**ہدف کی تفصیلات:**
- مدت: ${duration} سیکنڈ (${durationInMinutes.toFixed(1)} منٹ)
- الفاظ: ${targetWordCount} الفاظ (Range: ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)})
- رفتار: ${pacing} (${wordsPerMinute} WPM)

**یاد رکھیں:**
- یہ LIP-SYNC کے لیے ہے - بولنے میں قدرتی لگنی چاہیے
- User کی ہدایات کو ترجیح دیں لیکن conversational رکھیں
- کان کے لیے لکھیں، آنکھ کے لیے نہیں
- ایک اصل شخص کی طرح لگنی چاہیے جو اپنے audience سے بات کر رہا ہے

**OUTPUT:**
صرف refined script واپس کریں۔ کوئی preamble نہیں، کوئی وضاحت نہیں - صرف final، بولنے کے لیے تیار script۔

**آخری چیک:**
✓ کیا آپ نے user کی تمام ہدایات پر عمل کیا؟
✓ کیا یہ ابھی بھی قدرتی speech کی طرح لگ رہا ہے؟
✓ کیا یہ بولنے میں آرام دہ ہے؟
✓ الفاظ کی تعداد ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} کے اندر؟
✓ Lip-sync video کے لیے perfect؟
✓ روزمرہ کی بول چال والی اردو، نہ کہ رسمی/ادبی؟`;
};
```

---

## 🔧 Required Implementation Changes

### **1. Add "Use My Own Script" Option**

#### **UI Changes: `ScriptMethodSelection.tsx`**
```typescript
const methods = [
  {
    key: "refinement" as const,
    title: "Refine my script",
    description: "Polish an existing draft with smart editing cues.",
    icon: PenLine,
  },
  {
    key: "generation" as const,
    title: "Generate new script",
    description: "Create a fresh script with guided inputs.",
    icon: Sparkles,
  },
  {
    key: "passthrough" as const,  // NEW OPTION
    title: "Use my own script",
    description: "Use your ready script without any changes.",
    icon: FileText,  // or different icon
  },
]
```

#### **New Component: `ScriptPassthrough.tsx`**
```typescript
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"

interface ScriptPassthroughProps {
  language: string
  getToken: () => Promise<string | null>
  onComplete: (scriptId: string, script: string, params: any) => void
  onBack: () => void
}

export default function ScriptPassthrough({ language, getToken, onComplete, onBack }: ScriptPassthroughProps) {
  const [title, setTitle] = useState("")
  const [script, setScript] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !script.trim()) {
      setError("Title and script are required.")
      return
    }
    setError(null)
    setLoading(true)
    try {
      // Call API to save script directly without AI processing
      const response = await saveScriptDirectly({ title, script, language }, getToken)
      onComplete(response.scriptId, response.content, { title, method: 'passthrough' })
    } catch (err) {
      setError("Could not save the script. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Use your own script</CardTitle>
          <CardDescription className="text-white/70">
            Paste your ready-to-use script. No AI modifications will be made.
          </CardDescription>
        </div>
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white">Content Title *</Label>
          <Input
            placeholder="e.g., My Product Review Script"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black/40 text-white border-white/10"
          />
          <p className="text-xs text-white/50">This title helps you identify your content in the dashboard</p>
        </div>

        <div className="space-y-2">
          <Label className="text-white">Your Script *</Label>
          <Textarea
            placeholder="Paste your complete script here..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="min-h-[300px] bg-black/40 text-white border-white/10"
          />
          <p className="text-xs text-white/50">Your script will be used exactly as provided, without any modifications</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between px-6">
        <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
        >
          {loading ? "Saving..." : "Continue with this script"}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

#### **Backend API: New endpoint `/api/content/save-script-direct`**
```typescript
/**
 * POST /api/content/save-script-direct
 * Save user's script directly without AI processing
 */
export const saveScriptDirect = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title, script, language } = req.body;

    if (!title || !script || !language) {
      res.status(400).json({ error: 'Missing required fields: title, script, language' });
      return;
    }

    const scriptId = uuidv4();
    
    // Calculate basic metadata
    const wordCount = script.trim().split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 140) * 60); // Assuming medium pacing
    
    const metadata: ScriptMetadata = {
      wordCount,
      estimatedDuration
    };
    
    // Save to database
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scripts')
      .insert({
        script_id: scriptId,
        user_id: userId,
        title,
        language,
        method: 'passthrough' as const,  // NEW method type
        content: script,
        parameters: { title, method: 'passthrough' },
        metadata,
        status: 'approved'  // Skip review since user provided it
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to save script' });
      return;
    }

    res.status(200).json({
      scriptId: data.script_id,
      content: data.content,
      metadata
    });
  } catch (error) {
    console.error('Error saving direct script:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### **Update Database Types**
```typescript
// In server/src/types/database.types.ts
export interface Database {
  public: {
    Tables: {
      scripts: {
        Row: {
          // ... existing fields
          method: 'refinement' | 'generated' | 'passthrough'  // Add 'passthrough'
        }
      }
    }
  }
}
```

---

### **2. Change Default Values to Placeholders**

#### **`ScriptGeneration.tsx` Changes**

```typescript
// BEFORE:
const [scriptType, setScriptType] = useState(scriptTypes[0])  // Defaults to "Educational"
const [tone, setTone] = useState(tones[0])  // Defaults to "Professional"
const [introStyle, setIntroStyle] = useState(introStyles[0])  // Defaults to "Direct"

// AFTER:
const [scriptType, setScriptType] = useState<string>("")  // No default
const [tone, setTone] = useState<string>("")  // No default
const [introStyle, setIntroStyle] = useState<string>("")  // No default

// Update Select components:
<Select value={scriptType} onValueChange={setScriptType}>
  <SelectTrigger className="w-full bg-black/40 text-white border-white/10">
    <SelectValue placeholder="Select script type" />  {/* Add placeholder */}
  </SelectTrigger>
  <SelectContent className="bg-black/90 text-white border-white/10">
    {scriptTypes.map((type) => (
      <SelectItem key={type} value={type}>
        {type}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Update validation in handleSubmit:
if (!title.trim() || !topic.trim() || !targetAudience.trim() || !scriptType || !tone) {
  setError("Please fill in all required fields including script type and tone.")
  return
}
```

---

### **3. Update Workflow in `create-content/page.tsx`**

```typescript
// Add passthrough to types
type Method = "refinement" | "generation" | "passthrough"

// Update stage handling
case "method":
  return (
    <ScriptMethodSelection
      onSelect={(method) => {
        updateState({ method })
        setStage(
          method === "refinement" 
            ? "refinement" 
            : method === "generation"
            ? "generation"
            : "passthrough"  // NEW
        )
      }}
      onBack={() => setStage("language")}
    />
  )

// Add passthrough case
case "passthrough":
  return (
    <ScriptPassthrough
      language={contentState.language}
      getToken={getToken}
      onComplete={(scriptId, script, parameters) => {
        updateState({ scriptId, generatedScript: script, parameters })
        setStage("review")
      }}
      onBack={() => setStage("method")}
    />
  )
```

---

## 📊 Summary of Changes

### **Files to Modify:**

1. ✅ **`server/src/prompts/scriptGeneration.ts`**
   - Add `getEnglishScriptGenerationPrompt()`
   - Add `getUrduScriptGenerationPrompt()`
   - Update main export to route based on language

2. ✅ **`server/src/prompts/scriptRefinement.ts`**
   - Add English-specific refinement prompts
   - Add Urdu-specific refinement prompts
   - Update routing logic

3. ✅ **`components/create-content/ScriptMethodSelection.tsx`**
   - Add third option: "Use my own script"

4. ✅ **`components/create-content/ScriptGeneration.tsx`**
   - Change default values to empty strings with placeholders
   - Update validation

5. ✅ **`server/src/types/database.types.ts`**
   - Add 'passthrough' to method type

6. ✅ **`app/dashboard/create-content/page.tsx`**
   - Add "passthrough" stage handling

### **Files to Create:**

1. ✅ **`components/create-content/ScriptPassthrough.tsx`**
   - New component for direct script input

2. ✅ **`server/src/controllers/contentController.ts`**
   - Add `saveScriptDirect` function

3. ✅ **`lib/api.ts`**
   - Add `saveScriptDirectly` API call function

---

## 🎯 Expected Improvements

### **Script Quality:**
- ✅ English scripts will sound natural, conversational, like a friend talking
- ✅ Urdu scripts will use روزمرہ کی بول چال instead of formal/literary Urdu
- ✅ Both will emphasize first-person perspective and authentic voice
- ✅ Optimized specifically for lip-sync video creation
- ✅ Sound like a creator sharing opinions/knowledge, not reading a formal document

### **User Experience:**
- ✅ No forced default values - users choose what fits their content
- ✅ Option to use own script without AI modification
- ✅ Clearer understanding that scripts are for talking-to-camera content
- ✅ Better alignment with actual use case (lip-sync videos)

### **Language-Specific Improvements:**
- ✅ **English**: Conversational contractions, casual transitions, relatable examples
- ✅ **Urdu**: Natural spoken Urdu, not poetic/literary, culturally appropriate

---

## 🚀 Implementation Priority

### **Phase 1 - High Priority:**
1. Update script generation prompts (English and Urdu separate)
2. Update script refinement prompts (English and Urdu separate)
3. Change default values to placeholders

### **Phase 2 - Medium Priority:**
4. Add "Use my own script" option
5. Create passthrough component and API

### **Phase 3 - Testing:**
6. Test with various topics in both languages
7. Compare old vs new script outputs
8. Gather user feedback

---

## 📝 Notes

- All prompts emphasize **first-person perspective** for authenticity
- **Lip-sync context** is clearly stated in all prompts
- **Natural conversational style** is prioritized over polished formality
- Separate prompts allow for language-specific cultural and linguistic considerations
- Users have full control with three distinct options: generate, refine, or use their own
