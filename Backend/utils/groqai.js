import "dotenv/config";
import Groq from "groq-sdk/index.mjs";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getGroqAPIResponse = async (message) => {
  try {
    const chatCompletion = await getGroqChatCompletion(message);
    const aiReply = chatCompletion.choices[0]?.message?.content || "(No content received)";
    return aiReply 
  } catch (err) {
    console.error(err);
    throw new Error(err.message || "Something went wrong");
  }
};

export async function getGroqChatCompletion(message) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: message,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
  });
}

export default getGroqAPIResponse;
