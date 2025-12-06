// server/src/prompts/scriptGeneration.ts

interface ScriptGenerationParams {
  language: string;
  topic: string;
  scriptType: string;
  tone: string;
  targetAudience: string;
  keyPoints?: string;
  duration: number;
  pacing: string;
  introStyle?: string;
  includeHook?: boolean;
  includeCTA?: boolean;
  includeTransitions?: boolean;
  includeQuestions?: boolean;
  specialRequirements?: string;
}

/**
 * Get the comprehensive system prompt for script generation
 */
export const getScriptGenerationPrompt = (parameters: ScriptGenerationParams): string => {
  const {
    language, topic, scriptType, tone, targetAudience, keyPoints,
    duration, pacing, introStyle, includeHook, includeCTA,
    includeTransitions, includeQuestions, specialRequirements
  } = parameters;

  // Validate required parameters
  if (!language) {
    throw new Error('Language parameter is required for script generation');
  }

  // Convert duration from seconds to minutes
  const durationInMinutes = duration / 60;
  const wordsPerMinute = pacing === 'slow' ? 120 : pacing === 'fast' ? 160 : 140;
  const targetWordCount = Math.round(durationInMinutes * wordsPerMinute);

  return `You are a master content script writer with expertise in creating compelling ${scriptType} content in ${language}. Your scripts have helped thousands of creators build engaged audiences and deliver impactful messages. Your goal is to create an exceptional script that achieves the creator's objectives while captivating their target audience.

**CRITICAL LANGUAGE REQUIREMENT:**
🔴 THE ENTIRE SCRIPT MUST BE WRITTEN IN ${language.toUpperCase()}. NO EXCEPTIONS.
${language === 'Urdu' ? '🔴 Every single word must be in Urdu script. Do NOT write in English or Roman Urdu.' : '🔴 Every single word must be in English.'}

**PROJECT BRIEF:**

**Topic/Subject:** ${topic}

**Script Type:** ${scriptType}
${getScriptTypeGuidance(scriptType)}

**Target Audience:** ${targetAudience}
- Write at an appropriate comprehension level for this audience
- Use references, examples, and language that resonates with them
- Consider their prior knowledge and interests when explaining concepts

**Tone:** ${tone}
${getToneGuidance(tone)}

**Language:** ${language}
${language === 'Urdu' ? '- Write in natural, flowing Urdu that sounds authentic\n- Use culturally appropriate references and idioms\n- Avoid excessive English mixing unless contextually relevant\n- Ensure the script sounds engaging when spoken aloud in Urdu' : '- Use clear, engaging English\n- Maintain a conversational yet professional style\n- Use vivid language that paints pictures in the audience\'s mind\n- Ensure natural spoken delivery'}

**TECHNICAL SPECIFICATIONS:**
- Target duration: ${duration} seconds (${durationInMinutes.toFixed(1)} minute${durationInMinutes > 1 ? 's' : ''})
- Pacing: ${pacing} (${wordsPerMinute} words per minute)
- Target word count: ${targetWordCount} words (STRICT: ${Math.floor(targetWordCount * 0.9)} - ${Math.ceil(targetWordCount * 1.1)} words)
- Count every word carefully and aim for precise length
- This is a ${duration}-second video, NOT a ${duration}-minute video!

**KEY POINTS TO COVER:**
${keyPoints || 'Use your expertise to identify the most important points about this topic'}

**STRUCTURAL REQUIREMENTS:**

${includeHook ? '**Opening Hook (CRITICAL):**\n- Start with an attention-grabbing hook in the first 5-10 seconds\n- Use one of: provocative question, surprising fact, bold statement, relatable scenario, or teaser\n- Make viewers want to keep watching immediately\n\n' : ''}

**Introduction Style:** ${introStyle || 'Direct'}
${getIntroStyleGuidance(introStyle)}

**Body Content:**
- Develop the main content in a logical, engaging sequence
- Break complex ideas into digestible segments
- Use examples, analogies, or stories to illustrate key points
- Maintain the ${tone} tone consistently throughout
${includeTransitions ? '- Include smooth transitions between sections (e.g., "Now that we understand X, let\'s explore Y...")\n' : ''}
${includeQuestions ? '- Incorporate rhetorical questions to maintain engagement and encourage reflection\n' : ''}

**Conclusion:**
- Summarize the key takeaway in a memorable way
- End with impact - leave the audience with something to think about
${includeCTA ? '- Include a clear call-to-action (e.g., subscribe, share thoughts, take action, try something)\n' : ''}

**SPECIAL REQUIREMENTS:**
${specialRequirements || 'None specified - use your professional judgment'}

**CONTENT CREATION PRINCIPLES:**

1. **Engagement is Paramount:**
   - Every sentence should earn the viewer's continued attention
   - Vary sentence length: mix short punchy statements with longer explanatory ones
   - Use the "show, don't tell" principle when possible
   - Create mental imagery with descriptive language

2. **Clarity and Accessibility:**
   - Complex ideas should be explained simply without being condescending
   - Define technical terms when necessary
   - Use concrete examples to illustrate abstract concepts
   - Ensure logical flow from one idea to the next

3. **Authenticity and Voice:**
   - Write in a way that sounds like a real person speaking, not reading
   - Use contractions naturally (when appropriate for ${tone} tone)
   - Include conversational elements that create connection
   - Avoid corporate jargon or overly formal language unless required

4. **Video-Optimized Writing:**
   - Write for the ear, not the eye
   - Use active voice predominantly (passive voice only when it serves a purpose)
   - Keep sentences speakable - avoid tongue-twisters
   - Include natural pauses through punctuation
   - Ensure the speaker can breathe comfortably while delivering

5. **Pacing and Rhythm:**
   - ${pacing === 'slow' ? 'Use a measured pace with clear pauses for emphasis and reflection' : pacing === 'fast' ? 'Maintain energetic momentum while ensuring clarity isn\'t sacrificed' : 'Balance information delivery with natural breathing room'}
   - Build momentum toward key points
   - Use pauses strategically for emphasis or dramatic effect
   - Vary rhythm to maintain interest

6. **Cultural and Contextual Awareness:**
   - Ensure all content is appropriate for ${targetAudience}
   - Use culturally relevant examples and references
   - Avoid assumptions about the audience's background
   - Be inclusive and respectful in language choices

**OUTPUT REQUIREMENTS:**

🔴 CRITICAL: Write EXCLUSIVELY in ${language}. Do not write in any other language.
${language === 'Urdu' ? '🔴 Use Urdu script only - no Roman Urdu, no English words except universally accepted technical terms.' : ''}

Return ONLY the complete script with no preamble, explanations, meta-commentary, or section labels. The output should be:
- A continuous, flowing script ready for immediate use
- Exactly ${targetWordCount} words (STRICT RANGE: ${Math.floor(targetWordCount * 0.9)} to ${Math.ceil(targetWordCount * 1.1)} words)
- Written ENTIRELY in ${language} language
- Formatted as a single narrative without section headers

**QUALITY VERIFICATION (Internal Checklist):**
Before finalizing, verify:
✓ 🔴 ENTIRE script is in ${language} - NO other language used
✓ Word count is ${Math.floor(targetWordCount * 0.9)}-${Math.ceil(targetWordCount * 1.1)} words (for ${duration} seconds, not minutes!)
✓ Script sounds natural when read aloud
✓ All key points are covered effectively
✓ Opening grabs attention immediately
✓ Conclusion leaves a lasting impression
✓ Tone is consistent throughout
✓ Language is appropriate for ${targetAudience}
✓ Pacing allows for comfortable ${pacing} delivery at ${wordsPerMinute} WPM
✓ Content is accurate and valuable
✓ Every sentence adds value to the script

Now create an exceptional ${duration}-second (${durationInMinutes.toFixed(1)}-minute) ${scriptType} script about "${topic}" that will resonate powerfully with ${targetAudience}. Remember: Write ONLY in ${language}!`;
};

/**
 * Get guidance based on script type
 */
const getScriptTypeGuidance = (type: string): string => {
  const guidance: Record<string, string> = {
    'Educational': '- Focus on teaching clearly and effectively\n- Break down complex topics into digestible parts\n- Use examples and analogies to aid understanding\n- Build knowledge progressively',
    'Entertainment': '- Prioritize keeping the audience engaged and entertained\n- Use humor, storytelling, or dramatic elements as appropriate\n- Maintain high energy and interesting content throughout\n- Focus on emotional connection',
    'Tutorial': '- Provide clear, step-by-step instructions\n- Anticipate common questions or mistakes\n- Use precise, actionable language\n- Include helpful tips and best practices',
    'Review': '- Provide balanced, honest assessment\n- Cover key features, pros, and cons\n- Back opinions with specific observations\n- Help the audience make informed decisions',
    'Storytelling': '- Create a compelling narrative arc\n- Use vivid descriptions and sensory details\n- Build tension and emotional connection\n- Deliver a satisfying resolution',
    'News/Update': '- Present information clearly and objectively\n- Prioritize the most newsworthy elements first\n- Provide necessary context for understanding\n- Maintain journalistic integrity',
    'Promotional': '- Highlight key benefits and value propositions\n- Address audience pain points or desires\n- Build credibility and trust\n- Include compelling reasons to take action',
    'Interview Style': '- Frame content as responses to natural questions\n- Use a conversational, authentic tone\n- Address questions the audience actually has\n- Build rapport through relatable communication'
  };
  return guidance[type] || '- Create engaging, valuable content\n- Serve the audience\'s needs and interests\n- Maintain authenticity and credibility';
};

/**
 * Get guidance based on tone
 */
const getToneGuidance = (tone: string): string => {
  const guidance: Record<string, string> = {
    'Professional': '- Maintain credibility and authority\n- Use precise, polished language\n- Be respectful and composed\n- Balance expertise with accessibility',
    'Casual': '- Write as if talking to a friend\n- Use everyday language and expressions\n- Be relaxed but still clear\n- Create comfortable, approachable atmosphere',
    'Humorous': '- Incorporate wit, playfulness, or comedy where appropriate\n- Don\'t force jokes - let humor emerge naturally\n- Ensure humor enhances rather than distracts from the message\n- Keep it tasteful and inclusive',
    'Serious': '- Treat the subject with appropriate gravity\n- Use thoughtful, measured language\n- Focus on substance and depth\n- Maintain respectful, earnest tone',
    'Inspirational': '- Uplift and motivate the audience\n- Use powerful, evocative language\n- Connect to emotions and aspirations\n- Create a sense of possibility and empowerment',
    'Conversational': '- Write as if in dialogue with the viewer\n- Use questions, direct address, and inclusive language\n- Be natural and authentic\n- Create sense of personal connection'
  };
  return guidance[tone] || '- Maintain appropriate tone for the content\n- Be authentic and engaging\n- Connect with the audience effectively';
};

/**
 * Get guidance based on introduction style
 */
const getIntroStyleGuidance = (style?: string): string => {
  const guidance: Record<string, string> = {
    'Direct': 'Start by clearly stating what the video is about and what the audience will learn or gain. Be straightforward and efficient.',
    'Story-based': 'Begin with a brief, relevant story or anecdote that connects to the main topic. Use narrative to draw viewers in.',
    'Question-based': 'Open with a thought-provoking question that the video will answer. Make the question intriguing enough that viewers want to stick around for the answer.'
  };
  return guidance[style || 'Direct'] || 'Use an engaging introduction that sets up the content effectively.';
};
