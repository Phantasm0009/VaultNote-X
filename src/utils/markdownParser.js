import { marked } from 'marked';
import DOMPurify from 'dompurify';


marked.use({
  breaks: true, 
  gfm: true, 
  headerIds: true, 
  mangle: false, 
  sanitize: false, 
  smartypants: true, 
});


export const renderMarkdown = (markdown) => {
  if (!markdown) return '';
  
  
  const html = marked(markdown);
  
  
  const sanitized = DOMPurify.sanitize(html);
  
  return sanitized;
};