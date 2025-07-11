import OpenAI from 'openai';

export default class OpenAIService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async chatCompletion(model, temperature, prompt) {
    const defaultSystem = 
    "You are an automated AI code reviewer. Analyze ONLY the provided code diff and user instructions. Do NOT guess, invent, or assume any code outside the given diff or input. " +
    "Respond strictly according to the format in the user prompt. Output in English.";

    try {
      const options = {
        model,
        messages: [
          { role: "system", content: systemMessage || defaultSystem },
          { role: "user", content: prompt }
        ],
        temperature
      };

      const response = await this.openai.chat.completions.create(options);
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error during chat completion:", error.message);
      return null;
    }
  }
}
