/**
 * ChatPage - Page de discussion avec bot ou agent
 * 
 * DEV NOTES:
 * - Endpoint: POST /chat/message (send message)
 * - Endpoint: GET /chat/history (get conversation history)
 * - Event: chat_message_sent, chat_escalated
 * - Responsive mobile-first design
 */

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Paperclip, Send, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface ChatPageProps {
  onBack?: () => void;
  user?: { name?: string; email?: string; phone?: string } | null;
}

interface ChatMessage {
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: Date;
  fileName?: string;
}

export function ChatPage({ onBack, user }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: "Bonjour 👋 Je suis l'assistant virtuel de FasoTravel. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [agentTyping, setAgentTyping] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentTyping]);

  const addMessage = (sender: 'user' | 'bot' | 'agent', text: string, fileName?: string) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date(), fileName }]);
  };

  const simulateBotResponse = (userText: string) => {
    const lower = userText.toLowerCase();

    // Check for escalation keywords
    if (lower.includes('agent') || lower.includes('humain') || lower.includes('personne') || lower.includes('support')) {
      addMessage('bot', 'Je transfère votre conversation à un agent humain...');
      setTimeout(() => {
        setIsEscalated(true);
        setAgentTyping(true);
        setTimeout(() => {
          setAgentConnected(true);
          addMessage('agent', 'Bonjour, je suis un agent du support FasoTravel. Comment puis-je vous aider ?');
          setAgentTyping(false);
        }, 1500);
      }, 800);
      return;
    }

    // Generic bot response
    setTimeout(() => {
      addMessage('bot', `Merci pour votre message. Nous avons noté: "${userText.slice(0, 80)}${userText.length > 80 ? '...' : ''}". Un agent vous répondra dans les 24 heures.`);
    }, 600);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addMessage('user', `📎 ${file.name}`, file.name);
    feedback.success();

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage) {
      feedback.error();
      return;
    }

    if (!user && !email.trim()) {
      feedback.error();
      alert('Veuillez fournir une adresse e-mail pour que nous puissions vous répondre.');
      return;
    }

    // Add user message
    addMessage('user', trimmedMessage);
    feedback.tap();
    setInputMessage('');

    // Simulate response
    if (isEscalated && agentConnected) {
      // Agent response
      setTimeout(() => {
        addMessage('agent', 'Merci, un agent vous répondra dans quelques instants...');
      }, 600);
    } else {
      // Bot response
      simulateBotResponse(trimmedMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onBack?.();
              feedback.tap();
            }}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <div>
              <div className="text-sm font-medium">Support - Chat</div>
              <div className="text-xs opacity-90">
                {agentConnected ? 'Agent connecté' : agentTyping ? 'Agent arrive...' : 'Assistant virtuel'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-4 pb-32">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              {msg.sender !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-green-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow">
                  {msg.sender === 'bot' ? '🤖' : 'AG'}
                </div>
              )}
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow">
                  {user?.name ? user.name.split(' ').map(s => s[0]).slice(0, 2).join('') : 'Vous'}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`px-4 py-2 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : msg.sender === 'bot'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none'
                    : 'bg-amber-600 text-white rounded-bl-none'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">{msg.text}</div>
                <div className={`text-[11px] mt-1 ${msg.sender === 'user' ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Agent Typing Indicator */}
        {agentTyping && (
          <motion.div
            className="flex items-end gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-green-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow">
              AG
            </div>
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="fixed left-0 right-0 bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
          aria-label="Joindre un fichier"
        />

        {/* Email input for non-authenticated users */}
        {!user && (
          <div className="mb-3">
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Votre email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              aria-label="Votre email"
            />
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2 items-end">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="Joindre un fichier"
            title="Joindre un fichier"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
            aria-label="Message"
          />

          <button
            onClick={handleSendMessage}
            className="px-4 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0 shadow flex items-center gap-2"
            aria-label="Envoyer"
            title="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
