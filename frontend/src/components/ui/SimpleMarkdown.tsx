import React, { useEffect, useRef } from "react";

interface SimpleMarkdownProps {
  content: string;
}

// Minimal renderer:
// - Strips markdown headers (####) and bold (**...**)
// - Preserves fenced code blocks (```lang ... ```)
// - Renders inline math ($...$) and block math ($$...$$) with MathJax
export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Configure and load MathJax if not already loaded
    if (typeof window !== 'undefined') {
      if (!(window as any).MathJax) {
        // Configure MathJax before loading
        (window as any).MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            processEscapes: true,
            processEnvironments: true
          },
          options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
          }
        };
        
        const mathJaxScript = document.createElement('script');
        mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        mathJaxScript.async = true;
        mathJaxScript.id = 'MathJax-script';
        document.head.appendChild(mathJaxScript);
        
        mathJaxScript.onload = () => {
          const MathJax = (window as any).MathJax;
          if (MathJax && containerRef.current) {
            if (typeof MathJax.typesetPromise === 'function') {
              MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
                console.error('MathJax typeset error:', err);
              });
            } else if (MathJax.Hub && typeof MathJax.Hub.Queue === 'function') {
              // Fallback for MathJax v2
              MathJax.Hub.Queue(['Typeset', MathJax.Hub, containerRef.current]);
            }
          }
        };
      } else if (containerRef.current) {
        // MathJax already loaded, just typeset
        const MathJax = (window as any).MathJax;
        if (MathJax && typeof MathJax.typesetPromise === 'function') {
          MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
            console.error('MathJax typeset error:', err);
          });
        } else if (MathJax && MathJax.Hub && typeof MathJax.Hub.Queue === 'function') {
          // Fallback for MathJax v2
          MathJax.Hub.Queue(['Typeset', MathJax.Hub, containerRef.current]);
        }
      }
    }
  }, [content]);
  // Split content by any HTML table so we can process text around it
  const tableRegex = /(<table[\s\S]*?<\/table>)/i;
  const segments = content.split(tableRegex);
  const elements: React.ReactNode[] = [];
  let key = 0;

  const renderText = (text: string) => {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Fenced code blocks
      if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <pre key={key++} className="rounded-md bg-gray-900 text-gray-100 text-sm p-3 overflow-auto">
            <code data-lang={language || 'text'}>{codeLines.join('\n')}</code>
          </pre>
        );
        continue;
      }

      // Strip headers and bold markers
      line = line.replace(/^\s*#{1,6}\s*/g, '');
      line = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1');
      // Remove :** pattern (colon followed by bold markers)
      line = line.replace(/:\*\*(.*?)\*\*/g, ':$1');
      line = line.replace(/:\*\*/g, ':');
      
      // Preserve math equations - don't strip $ or $$ patterns
      // MathJax will handle rendering these

      // Inline code formatting
      if (line.includes('`')) {
        const formatted = line.replace(/`([^`]+)`/g, (_m, codeContent) => {
          return `<code class=\"inline-code bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono\">${codeContent}</code>`;
        });
        elements.push(
          <div key={key++} className="mb-1 text-gray-800" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
        continue;
      }

      // Render bullets when a line contains multiple "• " segments
      if (line.includes('• ')) {
        line.split('• ').filter(Boolean).forEach((b) => {
          elements.push(<div key={key++} className="ml-3 mb-0.5 text-gray-800">• {b.trim()}</div>);
        });
        continue;
      }

      // If there are inline numbered items like "1. ... 2. ..." render them as separate lines
      if (/\d+\.\s/.test(line) && line.split(/\d+\.\s/).length > 2) {
        line.split(/(?=\d+\.\s)/).filter(Boolean).forEach((it) => {
          elements.push(<div key={key++} className="ml-3 mb-0.5 text-gray-800">{it.trim()}</div>);
        });
        continue;
      }

      // Empty line spacing
      if (line.trim() === '') {
        elements.push(<div key={key++} className="mb-1" />);
        continue;
      }

      elements.push(<div key={key++} className="mb-1 text-gray-800 whitespace-pre-wrap">{line}</div>);
    }
  };

  segments.forEach((seg) => {
    if (!seg) return;
    if (tableRegex.test(seg)) {
      elements.push(<div key={key++} className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: seg }} />);
    } else {
      renderText(seg);
    }
  });

  return <div ref={containerRef}>{elements}</div>;
};

export default SimpleMarkdown;


