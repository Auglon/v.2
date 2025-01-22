declare module 'markdown-it-katex' {
  import MarkdownIt from 'markdown-it';
  
  interface KatexOptions {
    throwOnError?: boolean;
    errorColor?: string;
  }
  
  function katex(md: MarkdownIt, options?: KatexOptions): void;
  export default katex;
} 