import { useState, useEffect } from 'react';
import { Send, MessageSquare, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Suggestion } from '../types';
import { supabase } from '../lib/supabase';

export function Suggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userName, setUserName] = useState('');
  const [newSuggestion, setNewSuggestion] = useState('');
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }

    const channel = supabase
      .channel('suggestions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, () => {
        loadSuggestions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestion_replies' }, () => {
        loadSuggestions();
      });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to suggestions changes');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadSuggestions = async () => {
    const { data: suggestionsData, error: suggestionsError } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (suggestionsError) {
      console.error('Error loading suggestions:', suggestionsError);
      return;
    }

    const { data: repliesData, error: repliesError } = await supabase
      .from('suggestion_replies')
      .select('*')
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Error loading replies:', repliesError);
      return;
    }

    const suggestionsWithReplies = suggestionsData.map((suggestion) => ({
      ...suggestion,
      replies: repliesData.filter((reply) => reply.suggestion_id === suggestion.id),
    }));

    setSuggestions(suggestionsWithReplies);
  };

  const handleAddSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !newSuggestion.trim()) return;

    setLoading(true);
    localStorage.setItem('userName', userName);

    const { error } = await supabase.from('suggestions').insert([
      {
        user_name: userName,
        content: newSuggestion,
      },
    ]);

    if (error) {
      console.error('Error adding suggestion:', error);
    } else {
      setNewSuggestion('');
    }
    setLoading(false);
  };

  const handleAddReply = async (suggestionId: string) => {
    const content = replyContent[suggestionId];
    if (!userName.trim() || !content?.trim()) return;

    setLoading(true);
    localStorage.setItem('userName', userName);

    const { error } = await supabase.from('suggestion_replies').insert([
      {
        suggestion_id: suggestionId,
        user_name: userName,
        content: content,
      },
    ]);

    if (error) {
      console.error('Error adding reply:', error);
    } else {
      setReplyContent({ ...replyContent, [suggestionId]: '' });
    }
    setLoading(false);
  };

  const toggleExpanded = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId);
    } else {
      newExpanded.add(suggestionId);
    }
    setExpandedSuggestions(newExpanded);
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', suggestionId);

    if (error) {
      console.error('Error deleting suggestion:', error);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">Suggestions</h2>
          <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </span>
        </div>

        <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Add Your Suggestion</h3>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2 mb-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <form onSubmit={handleAddSuggestion} className="flex gap-2">
            <input
              type="text"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              placeholder="Share your suggestion..."
              className="flex-1 px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !userName.trim() || !newSuggestion.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Submit</span>
            </button>
          </form>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No suggestions yet</p>
            <p className="text-slate-400 text-sm mt-2">
              Be the first to share your suggestion
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const isExpanded = expandedSuggestions.has(suggestion.id);
              const hasReplies = suggestion.replies && suggestion.replies.length > 0;

              return (
                <div key={suggestion.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 group">
                  <div className="flex items-start gap-3">
                    {hasReplies && (
                      <button
                        onClick={() => toggleExpanded(suggestion.id)}
                        className="mt-1 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-blue-600">
                          {suggestion.user_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(suggestion.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {hasReplies && (
                          <span className="ml-auto px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">
                            {suggestion.replies!.length} {suggestion.replies!.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 mb-3">{suggestion.content}</p>

                      {isExpanded && hasReplies && (
                        <div className="ml-6 space-y-3 mb-3 pb-3 border-l-2 border-slate-300 pl-4">
                          {suggestion.replies!.map((reply) => (
                            <div key={reply.id} className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-green-600">
                                  {reply.user_name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(reply.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyContent[suggestion.id] || ''}
                          onChange={(e) =>
                            setReplyContent({ ...replyContent, [suggestion.id]: e.target.value })
                          }
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAddReply(suggestion.id)}
                          disabled={loading || !userName.trim() || !replyContent[suggestion.id]?.trim()}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSuggestion(suggestion.id)}
                      disabled={loading}
                      className="p-2 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete suggestion"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
