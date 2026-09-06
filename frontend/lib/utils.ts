import { AxiosError } from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleApiError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AxiosError) {
    return {
      success: false as const,
      message: error.response?.data?.message || fallbackMessage,
    };
  }
  return {
    success: false as const,
    message: fallbackMessage,
  };
};
