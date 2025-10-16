import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent = ({ content, className = "" }: MarkdownContentProps) => {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
        // Style headers
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-6 mt-8 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mb-4 mt-6 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mb-3 mt-5 text-foreground">{children}</h3>,
        
        // Style paragraphs
        p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground/90">{children}</p>,
        
        // Style lists
        ul: ({ children }) => <ul className="mb-4 space-y-2 pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 space-y-2 list-decimal pl-6">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed text-foreground/90">{children}</li>,
        
        // Style emphasis
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
        
        // Style code
        code: ({ children }) => (
          <code className="bg-muted/60 px-2 py-1 rounded text-sm font-mono text-foreground">{children}</code>
        ),
        
        // Style links
        a: ({ href, children }) => (
          <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        
        // Style blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
