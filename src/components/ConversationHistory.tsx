import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationHistoryProps {
  messages: Message[];
}

export const ConversationHistory = ({ messages }: ConversationHistoryProps) => {
  if (messages.length === 0) {
    return (
      <div className="max-w-sm mx-auto">
        <Card className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Conversation will appear here...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <Card className="h-64">
        <ScrollArea className="h-full p-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                </div>
                <div className={`flex-1 max-w-[75%] ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  <div className={`inline-block p-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p className="text-xs leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};