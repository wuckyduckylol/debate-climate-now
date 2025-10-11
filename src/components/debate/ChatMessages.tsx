import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: any[];
  scores?: any;
}

interface ChatMessagesProps {
  messages: Message[];
  personaName: string;
}

export const ChatMessages = ({ messages, personaName }: ChatMessagesProps) => {
  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={cn(
            "flex gap-3 animate-fade-in",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <Avatar className="h-10 w-10 border-2 border-accent">
              <AvatarFallback className="bg-gradient-accent">
                <DollarSign className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}

          <div
            className={cn(
              "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            )}
          >
            {message.role === "assistant" && (
              <div className="text-xs font-semibold text-accent mb-1">{personaName}</div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            
            {message.citations && message.citations.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.citations.map((citation: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    📚 {citation.title}
                  </Badge>
                ))}
              </div>
            )}

            {message.scores && message.role === "user" && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  EQ: {Math.round(message.scores.evidence * 100)}%
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  LI: {Math.round(message.scores.logic * 100)}%
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  TE: {Math.round(message.scores.tone * 100)}%
                </Badge>
              </div>
            )}
          </div>

          {message.role === "user" && (
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  );
};
