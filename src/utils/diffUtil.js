import * as Diff from 'diff';

export const diffText = (oldText, newText) => {
  if (!oldText || !newText) return '';
  
  const diff = Diff.diffWords(oldText, newText);
  
  return diff.map(part => {
    if (part.added) {
      return `<span class="diff-added">${part.value}</span>`;
    } else if (part.removed) {
      return `<span class="diff-removed">${part.value}</span>`;
    } else {
      return part.value;
    }
  }).join('');
};