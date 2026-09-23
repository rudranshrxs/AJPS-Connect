import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, ShieldCheck } from 'lucide-react';
import { ChatMessage } from './TeacherChat';

export function ParentChat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Define the assigned class teacher (mock logic)
  const classTeacher = {
    id: 'user_2', // Assuming 'user_2' is the Teacher from AuthContext
    name: 'Meera Reddy',
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Meera'
  };

  const loadMessages = () => {
    try {
      const stored = localStorage.getItem('ajps_chats');
      if (stored) {
        setMessages(JSON.parse(stored) || []);
      }
    } catch (e) {
      console.error("Error reading chats", e);
    }
  };

  useEffect(() => {
    loadMessages();
    const handleStorage = () => loadMessages();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: classTeacher.id,
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    localStorage.setItem('ajps_chats', JSON.stringify(updated));
    setMessages(updated);
    window.dispatchEvent(new Event('storage'));
    setInputText('');
  };

  // Filter messages specifically between this parent and the class teacher
  const currentConversation = messages.filter(
    m => (m.senderId === currentUser?.id && m.recipientId === classTeacher.id) ||
         (m.senderId === classTeacher.id && m.recipientId === currentUser?.id)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] bg-[#FDFBF7] rounded-2xl overflow-hidden border border-white/60 shadow-sm relative max-w-3xl mx-auto w-full">
      
      {/* Chat Header */}
      <div className="h-16 px-4 md:px-6 bg-white/70 backdrop-blur-xl border-b border-white/60 flex items-center gap-4 z-10 shrink-0 shadow-sm">
        <img src={classTeacher.avatar} alt={classTeacher.name} className="w-11 h-11 rounded-full border-2 border-white bg-gray-100 shrink-0 shadow-sm" />
        <div className="flex-1">
          <h2 className="text-sm font-bold text-[#1F2937] leading-tight flex items-center gap-1.5">
            {classTeacher.name}
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </h2>
          <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A05C2B] bg-[#FDF7EE] px-2 py-0.5 rounded-full border border-[#A05C2B]/10">
            Class Teacher
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-hide pb-24 md:pb-24">
        {currentConversation.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
              <MessageSquare className="w-8 h-8 text-[#A05C2B]/60" />
            </div>
            <h3 className="text-base font-bold text-[#1F2937] mb-1">Direct Message</h3>
            <p className="text-xs text-[#6B7280] max-w-[200px]">Send a message directly to your child's class teacher.</p>
          </div>
        ) : (
          currentConversation.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm backdrop-blur-md ${isMe ? 'bg-white/20 text-[#1F2937] border border-white/40 rounded-br-sm' : 'bg-black/10 border border-white/20 text-[#1F2937] rounded-bl-sm'}`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1.5 font-medium text-right ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent pt-12">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_32px_-4px_rgba(160,92,43,0.15)] rounded-full p-1.5 md:p-2 flex items-center gap-2 relative z-20">
          <input 
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Write a message to teacher..."
            className="flex-1 bg-transparent px-4 py-2 md:py-2.5 text-sm font-medium text-[#1F2937] focus:outline-none placeholder:text-gray-400"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#A05C2B] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8e5025] transition-colors shadow-md"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
