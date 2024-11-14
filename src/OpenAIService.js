import OpenAI from 'openai';

export default class OpenAIService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async chatCompletion(model, temperature, prompt) {
    try {
      const options = {
        model,
        messages: [
          { role: "system", content: "Anda adalah seorang Technical Lead dan reviewer kode yang berpengalaman." },
          { role: "user", content: prompt },
        ],
        temperature,
      };

      const response = await this.openai.chat.completions.create(options);
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error during chat completion:", error.message);
      return null;
    }
  }
}
