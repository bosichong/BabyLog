import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(date) {
  const now = new Date();
  const createTime = new Date(date);
  const diffMs = now - createTime;
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = (now.getFullYear() - createTime.getFullYear()) * 12 + now.getMonth() - createTime.getMonth();
  const diffYears = now.getFullYear() - createTime.getFullYear();

  if (diffSeconds < 60) {
    return `${diffSeconds}秒`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟`;
  } else if (diffHours < 24) {
    return `${diffHours}小时`;
  } else if (diffDays < 30) {
    return `${diffDays}天`;
  } else if (diffMonths < 12) {
    return `${diffMonths}个月`;
  } else {
    return `${diffYears}年`;
  }
}