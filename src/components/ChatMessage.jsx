import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ChatMessage({ message, isUser }) {
  const [copied, setCopied] = React.useState(false);
  const text = typeof message === 'string' ? message : (message?.content || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`relative max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-slate-800 text-white rounded-br-md'
              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{text}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-slate">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
        </div>
        
        {!isUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute -right-10 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full hover:bg-slate-100"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}