import { json } from '@sveltejs/kit';
import Groq from "groq-sdk";
//import { GROQ_API_KEY } from '$env/static/private'
const groq = new Groq(
    {
        apiKey: import.meta.env.VITE_GROQ_API_KEY
    }
);

const askBot = async (bot, history) => {
    let filteredHistory = history.map(({['timestamp']: _, ...rest}) => rest)
    return groq.chat.completions.create({
  
      messages: [
        {
  
          role: "system",
  
          content: `your a fictional character named ${bot.name}, with the following personality: ${bot.personality}, your chatting with the user over a social media platform, your relationship with the user is: ${bot.relationship}, act and respond in character `,
  
        },
  
        ...filteredHistory,
  

  
      ],
  
      model: "llama-3.3-70b-versatile",

      temperature: 0.5,

    });
  
};

export async function POST({ request }) {
    const { bot, history } = await request.json();
    const response = await askBot(bot, history);
    return json({ message: response.choices[0].message.content });
}
