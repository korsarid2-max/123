
import { GoogleGenAI, Modality } from "@google/genai";
import { StyleKey } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const PROMPTS: Record<StyleKey, string> = {
  default: `Преврати эту фотографию продукта в высококачественное изображение в студийном стиле. Используй мягкое, сбалансированное освещение, удали отвлекающие элементы с фона, примени тонкую коррекцию цвета и придай изображению чистый, современный вид, подходящий для каталога электронной коммерции. Сохраняй форму, текстуру и цвета продукта максимально приближенными к реальным.`,
  minimalism: `Создай минималистичное студийное изображение этого продукта. Помести его на идеально чистый, светло-серый или белый фон. Используй мягкий, рассеянный свет, чтобы минимизировать тени. Цвета должны быть естественными. Изображение должно быть очень чистым, простым и сфокусированным исключительно на продукте.`,
  vibrant: `Сделай эту фотографию продукта яркой и энергичной. Используй динамическое освещение, чтобы создать контраст и выделить детали. Фон должен быть цветным, но дополняющим продукт, возможно, с градиентом. Усиль насыщенность цветов, чтобы они выглядели сочными и привлекательными, но оставались реалистичными.`,
  premium: `Придай этой фотографии продукта премиальный и роскошный вид. Используй драматическое, направленное освещение, чтобы создать игру света и тени. Помести продукт на темный, текстурированный фон (например, темный мрамор, шелк или матовый металл). Обработка должна быть элегантной, с глубокими цветами и акцентом на текстуре продукта.`,
};


export const enhanceProductImage = async (base64ImageData: string, mimeType: string, style: StyleKey): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: PROMPTS[style],
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
            return imagePart.inlineData.data;
        } else {
            const textResponse = response.text;
            console.error("No image part in response. Text response:", textResponse);
            const safetyFeedback = response.candidates?.[0]?.safetyRatings;
            let errorMessage = 'Не удалось получить обработанное изображение от API.';
            if(safetyFeedback) {
                 errorMessage += ` Причина: ${safetyFeedback.map(r => `${r.category} was ${r.probability}`).join(', ')}.`;
            } else if (textResponse) {
                errorMessage += ` Ответ: ${textResponse}`;
            }
            throw new Error(errorMessage);
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Ошибка при обращении к Gemini API: ${error.message}`);
        }
        throw new Error("Произошла неизвестная ошибка при обращении к Gemini API.");
    }
};
