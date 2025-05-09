import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Set options for markdown parsing
marked.use({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: true, // Add IDs to headers
  mangle: false, // Don't escape HTML
  sanitize: false, // Don't sanitize (we'll use DOMPurify)
  smartypants: true, // Typographic punctuation like quotes and dashes
});

// Function to render markdown to HTML
export const renderMarkdown = (markdown) => {
  if (!markdown) return '';
  
  // Parse markdown to HTML
  const html = marked(markdown);
  
  // Sanitize HTML to prevent XSS attacks
  const sanitized = DOMPurify.sanitize(html);
  
  return sanitized;
};