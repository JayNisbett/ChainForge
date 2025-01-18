import { v4 as uuid } from "uuid";
import { NativeLLM } from "../backend/models";
import { LLMSpec, LLMGroup } from "../backend/typing";

/** The color palette used for displaying info about different LLMs. */
export const llmColorPalette = [
  "#44d044",
  "#f1b933",
  "#e46161",
  "#8888f9",
  "#33bef0",
  "#bb55f9",
  "#f7ee45",
  "#f955cd",
  "#26e080",
  "#2654e0",
  "#7d8191",
  "#bea5d1",
];

/** The color palette used for displaying variations of prompts and prompt variables (non-LLM differences).
 * Distinct from the LLM color palette in order to avoid confusion around what the data means.
 * Palette adapted from https://lospec.com/palette-list/sness by Space Sandwich */
export const varColorPalette = [
  "#0bdb52",
  "#e71861",
  "#7161de",
  "#f6d714",
  "#80bedb",
  "#ffa995",
  "#a9b399",
  "#dc6f0f",
  "#8d022e",
  "#138e7d",
  "#c6924f",
  "#885818",
  "#616b6d",
];

/** All color palettes in ChainForge. Import to use elsewhere. */
export const colorPalettes = {
  llm: llmColorPalette,
  var: varColorPalette,
};

export const refreshableOutputNodeTypes = new Set([
  "evaluator",
  "processor",
  "prompt",
  "inspect",
  "vis",
  "llmeval",
  "textfields",
  "chat",
  "simpleval",
  "join",
  "split",
  "project",
]);

export const initLLMProviderMenu: (LLMSpec | LLMGroup)[] = [
  {
    group: "OpenAI",
    emoji: "🤖",
    items: [
      {
        id: uuid(),
        name: "GPT3.5",
        emoji: "🤖",
        model: "gpt-3.5-turbo",
        base_model: "gpt-3.5-turbo",
        temp: 1.0,
      }, // The base_model designates what settings form will be used, and must be unique.
      {
        id: uuid(),
        name: "GPT4",
        emoji: "🥵",
        model: "gpt-4",
        base_model: "gpt-4",
        temp: 1.0,
      },
      {
        id: uuid(),
        name: "GPT4o",
        emoji: "👄",
        model: "gpt-4o",
        base_model: "gpt-4",
        temp: 1.0,
      },
      {
        id: uuid(),
        name: "GPT4o-mini",
        emoji: "👄",
        model: "gpt-4o-mini",
        base_model: "gpt-4",
        temp: 1.0,
      },
      {
        id: uuid(),
        name: "Dall-E",
        emoji: "🖼",
        model: "dall-e-2",
        base_model: "dall-e",
        temp: 0.0,
      },
    ],
  },
  {
    group: "Claude",
    emoji: "📚",
    items: [
      {
        id: uuid(),
        name: "Claude 3.5 Sonnet",
        emoji: "📚",
        model: "claude-3-5-sonnet-latest",
        base_model: "claude-v1",
        temp: 0.5,
      },
      {
        id: uuid(),
        name: "Claude 3.5 Haiku",
        emoji: "📗",
        model: "claude-3-5-haiku-latest",
        base_model: "claude-v1",
        temp: 0.5,
      },
      {
        id: uuid(),
        name: "Claude 3 Opus",
        emoji: "📙",
        model: "claude-3-opus-latest",
        base_model: "claude-v1",
        temp: 0.5,
      },
      {
        id: uuid(),
        name: "Claude 2",
        emoji: "📓",
        model: "claude-2",
        base_model: "claude-v1",
        temp: 0.5,
      },
    ],
  },
  {
    group: "Gemini",
    emoji: "♊",
    items: [
      {
        id: uuid(),
        name: "Gemini 1.5",
        emoji: "♊",
        model: "gemini-1.5-pro",
        base_model: "palm2-bison",
        temp: 0.7,
      },
      {
        id: uuid(),
        name: "Gemini 1.5 Flash",
        emoji: "📸",
        model: "gemini-1.5-flash",
        base_model: "palm2-bison",
        temp: 0.7,
      },
      {
        id: uuid(),
        name: "Gemini 1.5 Flash 8B",
        emoji: "⚡️",
        model: "gemini-1.5-flash-8b",
        base_model: "palm2-bison",
        temp: 0.7,
      },
    ],
  },
  {
    group: "HuggingFace",
    emoji: "🤗",
    items: [
      {
        id: uuid(),
        name: "Mistral.7B",
        emoji: "🤗",
        model: "mistralai/Mistral-7B-Instruct-v0.1",
        base_model: "hf",
        temp: 1.0,
      },
      {
        id: uuid(),
        name: "Falcon.7B",
        emoji: "🤗",
        model: "tiiuae/falcon-7b-instruct",
        base_model: "hf",
        temp: 1.0,
      },
    ],
  },
  {
    id: uuid(),
    name: "Aleph Alpha",
    emoji: "💡",
    model: "luminous-base",
    base_model: "luminous-base",
    temp: 0.0,
  },
  {
    id: uuid(),
    name: "Azure OpenAI",
    emoji: "🔷",
    model: "azure-openai",
    base_model: "azure-openai",
    temp: 1.0,
  },
  {
    group: "Bedrock",
    emoji: "🪨",
    items: [
      {
        id: uuid(),
        name: "Anthropic Claude",
        emoji: "👨‍🏫",
        model: NativeLLM.Bedrock_Claude_3_Haiku,
        base_model: "br.anthropic.claude",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "AI21 Jurassic 2",
        emoji: "🦖",
        model: NativeLLM.Bedrock_Jurassic_Ultra,
        base_model: "br.ai21.j2",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "Amazon Titan",
        emoji: "🏛️",
        model: NativeLLM.Bedrock_Titan_Large,
        base_model: "br.amazon.titan",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "Cohere Command Text 14",
        emoji: "📚",
        model: NativeLLM.Bedrock_Command_Text,
        base_model: "br.cohere.command",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "Mistral Mistral",
        emoji: "💨",
        model: NativeLLM.Bedrock_Mistral_Mistral,
        base_model: "br.mistral.mistral",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "Mistral Mixtral",
        emoji: "🌪️",
        model: NativeLLM.Bedrock_Mistral_Mixtral,
        base_model: "br.mistral.mixtral",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "Meta Llama2 Chat",
        emoji: "🦙",
        model: NativeLLM.Bedrock_Meta_LLama2Chat_13b,
        base_model: "br.meta.llama2",
        temp: 0.9,
      },
      {
        id: uuid(),
        name: "Meta Llama3 Instruct",
        emoji: "🦙",
        model: NativeLLM.Bedrock_Meta_LLama3Instruct_8b,
        base_model: "br.meta.llama3",
        temp: 0.9,
      },
    ],
  },
];
