"use client";

import { Sparkles, Brain, Zap } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export type AIModel = "gpt4" | "claude" | "gemini";

interface AIChatbotSelectorProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

const AI_MODELS = [
  {
    id: "gpt4" as AIModel,
    name: "GPT-4",
    icon: Sparkles,
    description: "OpenAI's most capable model",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "claude" as AIModel,
    name: "Claude 3",
    icon: Brain,
    description: "Anthropic's advanced AI",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: "gemini" as AIModel,
    name: "Gemini",
    icon: Zap,
    description: "Google's latest model",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
];

export function AIChatbotSelector({ selectedModel, onSelectModel }: AIChatbotSelectorProps) {
  const currentModel = AI_MODELS.find((m) => m.id === selectedModel) ?? AI_MODELS[0];
  const Icon = currentModel?.icon ?? Sparkles;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between h-10 border-gray-300"
        >
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${currentModel?.color ?? "text-green-600"}`} />
            <span className="text-sm">{currentModel?.name ?? "GPT-4"}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white">
        <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AI_MODELS.map((model) => {
          const ModelIcon = model.icon;
          const isSelected = model.id === selectedModel;
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`cursor-pointer ${isSelected ? model.bgColor : ""}`}
            >
              <div className="flex items-start gap-3 py-1">
                <ModelIcon className={`w-5 h-5 mt-0.5 ${model.color}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{model.name}</span>
                    {isSelected && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
