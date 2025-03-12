import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to a human-readable string
 * @param bytes The number of bytes
 * @param decimals The number of decimal places (default: 2)
 * @returns A string representation of the bytes with appropriate units
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format AI response text to highlight bracketed references
 * @param result The AI analysis result or text string
 * @returns Formatted HTML string with highlighted references
 */
export function formatAIResponse(result: any): string {
  // Handle different result formats
  let text = '';
  
  if (typeof result === 'string') {
    text = result;
  } else if (result && result.result) {
    // For complete result objects
    const aiData = result.result;
    
    // For chat completions format (new format)
    if (aiData.choices && aiData.choices.length > 0 && aiData.choices[0].message) {
      text = aiData.choices[0].message.content;
    } else if (aiData.choices && aiData.choices.length > 0 && aiData.choices[0].text) {
      // For older completion format
      text = aiData.choices[0].text;
    } else {
      // Fallback to string representation
      return JSON.stringify(aiData, null, 2);
    }
  } else {
    return 'No data available';
  }
  
  // Replace {pageXXX} and {symbolXXX} with highlighted spans
  return text.replace(/\{(page|symbol)(\d+)\}/g, (match) => {
    return `<span class="reference-highlight">${match}</span>`;
  });
}
