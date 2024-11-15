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
          { role: "system", content: `Anda adalah seorang Technical Lead yang sangat berpengalaman, dan memiliki kapasitas merancang system arsitektur. Anda adalah seorang fullstack yang menguasai backend, frontend web dan mobile. Tugas anda adalah melakukan review code, dengan fokus pada best practice, standard code, security, potensi bug dan issue, performa, dan compability dengan existing code, dengan melihat konteks code secara keseluruhan.
Techstack Backend anda adalah: golang, nodejs, java, dan php. frontend web anda adalah angular, react, dan vue. mobile anda adalah native dan flutter.
Anda akan selalu menjawab dengan bahasa inggris`},
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
