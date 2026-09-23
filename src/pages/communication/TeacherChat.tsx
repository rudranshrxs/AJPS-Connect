import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Send, ArrowLeft, MessageSquare } from 'lucide-react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  timestamp: string;
}

// Dummy data for Teacher's assigned class students
const CLASS_PARENTS = [
  { id: 'parent_1', name: 'Ravi Kumar (Parent of Santosh)', studentName: 'Santosh Kumar', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ravi' },
  { id: 'parent_2', name: 'Sunita Sharma (Parent of Priya)', studentName: 'Priya Sharma', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sunita' },
  { id: 'parent_3', name: 'Amit Singh (Parent of Rahul)', studentName: 'Rahul Singh', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Amit' },
];

export function TeacherChat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages, selectedParentId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedParentId || !currentUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      recipientId: selectedParentId,
      text: inputText,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    localStorage.setItem('ajps_chats', JSON.stringify(updated));
    setMessages(updated);
    window.dispatchEvent(new Event('storage'));
    setInputText('');
  };

  const selectedParent = CLASS_PARENTS.find(p => p.id === selectedParentId);

  // Filter messages for the current conversation
  const currentConversation = messages.filter(
    m => (m.senderId === currentUser?.id && m.recipientId === selectedParentId) ||
         (m.senderId === selectedParentId && m.recipientId === currentUser?.id)
  );

  return (
    <div className="flex h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] bg-[#FDFBF7] rounded-2xl overflow-hidden border border-white/60 shadow-sm relative">
      
      {/* Inbox List (Left / Main on mobile if no chat selected) */}
      <div className={`w-full md:w-80 bg-white/40 backdrop-blur-md border-r border-white/50 flex flex-col transition-transform duration-300 ${selectedParentId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100/50 bg-white/50">
          <h2 className="text-lg font-bold text-[#1F2937] mb-3">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search parents..." 
              className="w-full bg-white/60 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 focus:border-[#A05C2B]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {CLASS_PARENTS.map(parent => {
            const parentMsgs = messages.filter(m => m.senderId === parent.id || m.recipientId === parent.id);
            const lastMsg = parentMsgs[parentMsgs.length - 1];
            
            return (
              <button 
                key={parent.id}
                onClick={() => setSelectedParentId(parent.id)}
                className={`w-full text-left p-4 border-b border-gray-100/30 hover:bg-white/60 transition-colors flex items-center gap-3 ${selectedParentId === parent.id ? 'bg-white/80 shadow-sm border-l-4 border-l-[#A05C2B]' : ''}`}
              >
                <img src={parent.avatar} alt={parent.name} className="w-12 h-12 rounded-full border border-white bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#1F2937] truncate">{parent.name}</h3>
                  <p className="text-[11px] text-[#A05C2B] font-semibold truncate mb-0.5">Parent of {parent.studentName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{lastMsg ? lastMsg.text : 'Tap to start conversation'}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat Window (Right / Active on mobile if selected) */}
      <div className={`flex-1 flex-col bg-transparent relative ${selectedParentId ? 'flex' : 'hidden md:flex'}`}>
        {selectedParent ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 bg-white/70 backdrop-blur-xl border-b border-white/60 flex items-center gap-3 z-10 shrink-0 shadow-sm">
              <button 
                onClick={() => setSelectedParentId(null)}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img src={selectedParent.avatar} alt={selectedParent.name} className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-[#1F2937] leading-tight">{selectedParent.name}</h2>
                <p className="text-xs text-[#A05C2B] font-medium">Class 10th Parent</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24 md:pb-20">
              {currentConversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
                  <MessageSquare className="w-12 h-12 text-[#A05C2B]/40 mb-3" />
                  <p className="text-sm font-semibold text-[#1F2937]">No messages yet</p>
                  <p className="text-xs text-[#6B7280]">Send a message to start the conversation.</p>
                </div>
              ) : (
                currentConversation.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm backdrop-blur-md ${isMe ? 'bg-white/20 text-[#1F2937] border border-white/40 rounded-br-sm' : 'bg-black/10 border border-white/20 text-[#1F2937] rounded-bl-sm'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[9px] mt-1 font-medium text-right ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>
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
            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/90 to-transparent pt-10">
              <form onSubmit={handleSend} className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_4px_24px_-4px_rgba(160,92,43,0.1)] rounded-full p-1.5 flex items-center gap-2 relative z-20">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-[#1F2937] focus:outline-none placeholder:text-gray-400"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-[#A05C2B] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8e5025] transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <MessageSquare className="w-16 h-16 text-[#A05C2B]/30 mb-4" />
            <p className="font-bold text-[#1F2937]">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
