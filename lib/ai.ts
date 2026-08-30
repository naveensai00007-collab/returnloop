import { ExtractedFieldsSchema } from "./validation";
import { ExtractedReceiptData } from "@/types/purchase";

interface ExtractReceiptOptions {
  imageBase64: string;
  mimeType: string;
}

const VISION_SYSTEM_PROMPT = `
You are a receipt data extraction engine.
Analyze the provided receipt or order screenshot image.
Extract the purchase details and return ONLY a single valid JSON object matching this exact schema:
{
  "storeName": "string or null",
  "purchaseDate": "YYYY-MM-DD or null",
  "itemName": "string or null",
  "amount": number or null,
  "currency": "USD",
  "returnPolicyText": "string or null",
  "confidence": number between 0.0 and 1.0
}

Rules:
1. Return ONLY the JSON object. No markdown codeblocks, no formatting, no commentary.
2. If a field is not visible or uncertain, use null. Do not guess or invent data.
3. purchaseDate MUST be formatted as YYYY-MM-DD.
4. amount MUST be a positive number representing the total paid.
5. confidence must reflect how clearly the receipt was parsed (0.0 to 1.0).
`.trim();

export async function extractReceiptFromImage({
  imageBase64,
  mimeType,
}: ExtractReceiptOptions): Promise<ExtractedReceiptData> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const model = process.env.AI_MODEL || "meta-llama/llama-3.2-11b-vision-instruct:free";
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "20000", 10);

  // If no AI keys are provided in local environment, provide a realistic simulated extraction
  if (!openRouterKey && !groqKey) {
    // Simulated realistic fallback for development / local demo
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      storeName: "Target",
      purchaseDate: new Date().toISOString().split("T")[0],
      itemName: "Wireless Headphones",
      amount: 49.99,
      currency: "USD",
      returnPolicyText: "90 days return window with receipt",
      confidence: 0.92,
      needsReview: true,
    };
  }

  const endpoint = openRouterKey
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";

  const apiKey = openRouterKey || groqKey;

  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "ReturnLoop Receipt Parser",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: VISION_SYSTEM_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Provider returned error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from AI provider.");
    }

    // Clean JSON content if wrapped in backticks
    const cleanedContent = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedJson = JSON.parse(cleanedContent);
    const validated = ExtractedFieldsSchema.parse(parsedJson);

    return {
      storeName: validated.storeName,
      purchaseDate: validated.purchaseDate,
      itemName: validated.itemName,
      amount: validated.amount,
      currency: validated.currency || "USD",
      returnPolicyText: validated.returnPolicyText,
      confidence: validated.confidence,
      needsReview: true,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "AI extraction failed.";
    throw new Error(message);
  }
}
