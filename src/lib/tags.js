export const normalizeTags = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((tag) => tag?.trim())
      .filter(Boolean)
      .map((tag) => tag.toLowerCase());
  }

  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());
};
