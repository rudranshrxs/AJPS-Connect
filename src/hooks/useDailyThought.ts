import { useState, useEffect } from 'react';

const THOUGHT_KEY = 'ajps_daily_thought';
const DATE_KEY = 'ajps_daily_thought_date';

export function useDailyThought() {
  const [thought, setThought] = useState<string>("\"Education is the passport to the future.\"");

  useEffect(() => {
    const fetchThought = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const cachedDate = localStorage.getItem(DATE_KEY);
        const cachedThought = localStorage.getItem(THOUGHT_KEY);

        if (cachedDate === today && cachedThought) {
          setThought(cachedThought);
          return;
        }

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          console.warn('No Gemini API key found for Daily Thought');
          return;
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Give a short, inspiring 1-line quote for school students and teachers. No extra text, just the quote."
                    }
                  ]
                }
              ]
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch daily thought');
        }

        const data = await response.json();
        const newThought = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "\"Education is the most powerful weapon which you can use to change the world.\"";
        
        // Ensure it has quotes if not provided by the AI
        let formattedThought = newThought;
        if (!formattedThought.startsWith('"')) {
          formattedThought = `"${formattedThought}`;
        }
        if (!formattedThought.endsWith('"')) {
          formattedThought = `${formattedThought}"`;
        }

        localStorage.setItem(DATE_KEY, today);
        localStorage.setItem(THOUGHT_KEY, formattedThought);
        setThought(formattedThought);

      } catch (error) {
        console.error('Error fetching daily thought:', error);
      }
    };

    fetchThought();
  }, []);

  return thought;
}
