"use client"

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: (message: string) => void
}

export const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, onSend, ...props }, ref) => {
    const [message, setMessage] = React.useState("");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleSend = () => {
      if (message.trim() && onSend) {
        onSend(message);
        setMessage("");
      }
    };

    return (
      <div className="flex gap-2">
        <Textarea
          ref={ref}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="resize-none"
          {...props}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || props.disabled}
          onClick={handleSend}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);
ChatInput.displayName = "ChatInput";
