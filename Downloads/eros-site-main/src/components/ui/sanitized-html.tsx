import React from "react";
import DOMPurify from "dompurify";

interface SanitizedHtmlProps extends React.HTMLAttributes<HTMLDivElement> {
  html: string;
}

/**
 * Renderiza HTML sanitizado para prevenir ataques de XSS (Cross-Site Scripting).
 * Utilize este componente no lugar de dangerouslySetInnerHTML direto.
 */
export function SanitizedHtml({ html, ...props }: SanitizedHtmlProps) {
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} {...props} />;
}
