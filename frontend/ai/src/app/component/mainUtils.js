export function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildConversationTitle(prompt) {
  const trimmed = prompt.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "New Chat";
  }

  if (trimmed.length <= 56) {
    return trimmed;
  }

  return `${trimmed.slice(0, 56).trimEnd()}...`;
}

export function getErrorMessage(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export function normalizeMessage(message) {
  return {
    id: message.id,
    role: message.role,
    text: message.content,
    time: formatMessageTime(message.created_at),
  };
}

export function splitMessageContent(content) {
  if (!content) {
    return [];
  }

  const segments = content.split("```");

  return segments.flatMap((segment, index) => {
    if (!segment.trim()) {
      return [];
    }

    if (index % 2 === 1) {
      const trimmedSegment = segment.replace(/^\n+|\n+$/g, "");
      const firstNewlineIndex = trimmedSegment.indexOf("\n");

      if (firstNewlineIndex === -1) {
        return [
          {
            type: "code",
            language: "text",
            content: trimmedSegment,
          },
        ];
      }

      const firstLine = trimmedSegment.slice(0, firstNewlineIndex).trim();
      const remainingContent = trimmedSegment.slice(firstNewlineIndex + 1);
      const hasLanguageTag = /^[a-zA-Z0-9_+#.-]+$/.test(firstLine);

      return [
        {
          type: "code",
          language: hasLanguageTag ? firstLine : "text",
          content: hasLanguageTag ? remainingContent : trimmedSegment,
        },
      ];
    }

    return segment
      .trim()
      .split(/\n{2,}/)
      .map((block) => ({
        type: "text",
        content: block.trim(),
      }))
      .filter((block) => block.content);
  });
}
