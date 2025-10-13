import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { supabase } from '../lib/supabase';

export function ChatRoom() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userName, setUserName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMessages();

      const channel = supabase
        .channel('chat_messages_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !newMessage.trim()) return;

    setLoading(true);
    localStorage.setItem('userName', userName);

    const { error } = await supabase.from('chat_messages').insert([
      {
        user_name: userName,
        message: newMessage,
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      await loadMessages();
    }
    setLoading(false);
  };

  const handleDeleteHistory = async () => {
    if (!confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .gte('created_at', '1970-01-01');

    if (error) {
      console.error('Error deleting chat history:', error);
    } else {
      setMessages([]);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Chat Room"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] sm:w-96 sm:max-w-96 h-[calc(100vh-2rem)] sm:h-[600px] sm:max-h-[600px] bg-slate-800 rounded-lg shadow-2xl flex flex-col z-50 border border-slate-700">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-slate-100">Chat Room</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeleteHistory}
            disabled={loading || messages.length === 0}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.user_name === userName ? 'items-end' : 'items-start'
            }`}
          >
            <span className="text-xs font-medium text-slate-400 mb-1">
              {msg.user_name}
            </span>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg ${
                msg.user_name === userName
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(msg.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !userName.trim() || !newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
