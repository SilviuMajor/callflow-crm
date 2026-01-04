import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Seller field colors - each field gets a consistent color based on its name
const SELLER_FIELD_COLORS = [
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', hover: 'hover:bg-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', hover: 'hover:bg-rose-200' },
  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', hover: 'hover:bg-violet-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', hover: 'hover:bg-cyan-200' },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', hover: 'hover:bg-orange-200' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-300', hover: 'hover:bg-fuchsia-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', hover: 'hover:bg-teal-200' },
  { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300', hover: 'hover:bg-sky-200' },
  { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300', hover: 'hover:bg-lime-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', hover: 'hover:bg-indigo-200' },
];

export function getSellerFieldColor(fieldName: string) {
  // Simple hash function to get consistent color per field
  let hash = 0;
  for (let i = 0; i < fieldName.length; i++) {
    hash = ((hash << 5) - hash) + fieldName.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % SELLER_FIELD_COLORS.length;
  return SELLER_FIELD_COLORS[index];
}

export function getSellerFieldColorClasses(fieldName: string): string {
  const color = getSellerFieldColor(fieldName);
  return `${color.bg} ${color.text} ${color.border} ${color.hover}`;
}
