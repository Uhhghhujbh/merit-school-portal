const supabase = require('../config/supabaseClient');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// You need to get a FREE API KEY from https://aistudio.google.com/app/apikey
// And put it in your .env file as GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateQuestions = async (req, res) => {
  const { subjects, topics, count, difficulty } = req.body;

  try {
    // 1. Check DB first to save AI tokens
    let { data: existingQuestions } = await supabase
      .from('cbt_questions')
      .select('*')
      .in('subject', subjects)
      .in('topic', topics)
      .eq('difficulty', difficulty)
      .limit(count);

    if (existingQuestions && existingQuestions.length >= count) {
      // Shuffle and return if we have enough
      return res.json(existingQuestions.sort(() => 0.5 - Math.random()).slice(0, count));
    }

    // 2. If not enough, ASK AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `Generate ${count} multiple-choice questions for JAMB/WAEC level students.
    Subjects: ${subjects.join(', ')}.
    Topics: ${topics.join(', ')}.
    Difficulty: ${difficulty}.
    Return strictly a JSON array. Format: 
    [{"question_text": "...", "options": ["A", "B", "C", "D"], "correct_option": 0, "explanation": "..."}]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up markdown formatting if AI adds it
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '');
    const newQuestions = JSON.parse(jsonString);

    // 3. Save to DB for next time (Caching)
    const questionsToSave = newQuestions.map(q => ({
      subject: subjects[0], // Simplified for demo
      topic: topics[0],
      difficulty,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation
    }));

    await supabase.from('cbt_questions').insert(questionsToSave);

    res.json(questionsToSave);

  } catch (error) {
    console.error("AI Gen Error:", error);
    res.status(500).json({ error: "Failed to generate questions. Try creating a manual quiz." });
  }
};

exports.getTopics = async (req, res) => {
  const { subject } = req.body;
  // Simple static list or ask AI for topics
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `List 20 major academic topics for ${subject} at High School level. JSON Array of strings only.`;
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    res.json(JSON.parse(cleanText));
  } catch(e) {
    res.json(["General", "Introductory", "Advanced"]); // Fallback
  }
};
