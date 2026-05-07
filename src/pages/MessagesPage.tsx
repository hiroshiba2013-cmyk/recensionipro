import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MessageCircle, Tag, Briefcase, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Profile {
  full_name: string;
  avatar_url: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  ad_id: string | null;
  conversation_type: string;
  reference_id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  profiles?: Profile;
  classified_ads?: {
    title: string;
    images: string[] | null;
  };
  job_seekers?: {
    title: string;
  };
  job_postings?: {
    title: string;
    company_name: string | null;
  };
  unread_count?: number;
}

export function MessagesPage() {
  const { user, loading: authLoading, activeProfile, profile, selectedBusinessLocationId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      window.location.href = '/';
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');

    loadConversations().then(() => {
      if (conversationId) {
        setSelectedConversation(conversationId);
      }
    });

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, activeProfile, selectedBusinessLocationId]);

  useEffect(() => {
    if (!selectedConversation) return;

    loadMessages(selectedConversation);
    markMessagesAsRead(selectedConversation);

    const channel = supabase
      .channel(`conv-messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        () => {
          loadMessages(selectedConversation);
          markMessagesAsRead(selectedConversation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase.from('conversations').select('*');

      if (profile?.user_type === 'customer') {
        const familyMemberId = activeProfile && !activeProfile.isOwner ? activeProfile.id : null;

        if (familyMemberId) {
          query = query.or(
            `and(participant1_id.eq.${user.id},participant1_family_member_id.eq.${familyMemberId}),` +
            `and(participant2_id.eq.${user.id},participant2_family_member_id.eq.${familyMemberId})`
          );
        } else {
          query = query.or(
            `and(participant1_id.eq.${user.id},participant1_family_member_id.is.null),` +
            `and(participant2_id.eq.${user.id},participant2_family_member_id.is.null)`
          );
        }
      } else if (profile?.user_type === 'business') {
        if (selectedBusinessLocationId) {
          // Sede specifica: conversazioni di questa sede + conversazioni senza location (es. annunci classificati)
          query = query.or(
            `and(participant1_id.eq.${user.id},participant1_location_id.eq.${selectedBusinessLocationId}),` +
            `and(participant2_id.eq.${user.id},participant2_location_id.eq.${selectedBusinessLocationId}),` +
            `and(participant1_id.eq.${user.id},participant1_location_id.is.null),` +
            `and(participant2_id.eq.${user.id},participant2_location_id.is.null)`
          );
        } else {
          // Vista tutte le sedi: mostra tutte le conversazioni dell'account
          query = query.or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
        }
      } else {
        query = query.or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
      }

      query = query.order('last_message_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId =
            conv.participant1_id === user.id
              ? conv.participant2_id
              : conv.participant1_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, nickname, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();

          let referenceData = null;

          if (conv.conversation_type === 'classified_ad') {
            const { data: adData } = await supabase
              .from('classified_ads')
              .select('title, images')
              .eq('id', conv.reference_id)
              .maybeSingle();

            referenceData = { classified_ads: adData };
          } else if (conv.conversation_type === 'job_seeker') {
            const { data: jobSeekerData } = await supabase
              .from('job_seekers')
              .select('title')
              .eq('id', conv.reference_id)
              .maybeSingle();

            referenceData = { job_seekers: jobSeekerData };
          } else if (conv.conversation_type === 'job_posting') {
            const { data: jobPostingData } = await supabase
              .from('job_postings')
              .select('title, company_name')
              .eq('id', conv.reference_id)
              .maybeSingle();

            referenceData = { job_postings: jobPostingData };
          }

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          const displayName = profileData?.nickname || profileData?.full_name || 'Utente';

          return {
            ...conv,
            ...referenceData,
            profiles: profileData ? { ...profileData, full_name: displayName } : null,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, content, created_at, is_read')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);

    try {
      const { error: messageError } = await supabase.from('messages').insert([
        {
          conversation_id: selectedConversation,
          sender_id: user.id,
          content: newMessage.trim(),
        },
      ]);

      if (messageError) throw messageError;

      setNewMessage('');
      loadMessages(selectedConversation);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Errore nell\'invio del messaggio');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Ieri';
    } else {
      return date.toLocaleDateString('it-IT');
    }
  };

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState<'all' | 'classified_ad' | 'job_seeker' | 'job_posting'>('all');

  useEffect(() => {
    if (!selectedConversation) {
      setSelectedConv(null);
      return;
    }

    const found = conversations.find((c) => c.id === selectedConversation);
    if (found) {
      setSelectedConv(found);
      return;
    }

    if (!user || loading) return;

    (async () => {
      try {
        const { data: conv, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', selectedConversation)
          .maybeSingle();

        if (error || !conv) return;

        const otherUserId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, nickname, avatar_url')
          .eq('id', otherUserId)
          .maybeSingle();

        let referenceData: any = null;
        if (conv.conversation_type === 'classified_ad') {
          const { data: adData } = await supabase
            .from('classified_ads')
            .select('title, images')
            .eq('id', conv.reference_id)
            .maybeSingle();
          referenceData = { classified_ads: adData };
        } else if (conv.conversation_type === 'job_seeker') {
          const { data: jsData } = await supabase
            .from('job_seekers')
            .select('title')
            .eq('id', conv.reference_id)
            .maybeSingle();
          referenceData = { job_seekers: jsData };
        } else if (conv.conversation_type === 'job_posting') {
          const { data: jpData } = await supabase
            .from('job_postings')
            .select('title, company_name')
            .eq('id', conv.reference_id)
            .maybeSingle();
          referenceData = { job_postings: jpData };
        }

        const displayName = profileData?.nickname || profileData?.full_name || 'Utente';

        const enriched: Conversation = {
          ...conv,
          ...referenceData,
          profiles: profileData ? { ...profileData, full_name: displayName } : undefined,
          unread_count: 0,
        };

        setSelectedConv(enriched);
        setConversations(prev => [enriched, ...prev]);
      } catch (err) {
        console.error('Error loading conversation details:', err);
      }
    })();
  }, [selectedConversation, conversations, user, loading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{height: 'calc(100vh - 0px)'}}>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Le tue conversazioni
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-2">Messaggi</h1>
          <p className="text-lg text-gray-500">Gestisci tutte le tue conversazioni in un unico posto</p>
        </div>
      </section>

      <div className="flex flex-1 overflow-hidden bg-gray-50">
      {/* Conversations List */}
      <div
        className={`w-full md:w-96 bg-white border-r border-gray-200 flex flex-col ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Conversazioni</h1>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { key: 'all', label: 'Tutti', icon: null },
              { key: 'classified_ad', label: 'Annunci', icon: Tag },
              { key: 'job_seeker', label: 'Candidature', icon: Briefcase },
              { key: 'job_posting', label: 'Offerte', icon: Building2 },
            ] as const).map(({ key, label, icon: Icon }) => {
              const count = key === 'all'
                ? conversations.length
                : conversations.filter((c) => c.conversation_type === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    filter === key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${filter === key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(() => {
            const filtered = filter === 'all'
              ? conversations
              : conversations.filter((c) => c.conversation_type === filter);
            return filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'Nessun messaggio' : 'Nessuna conversazione'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' ? 'Inizia una conversazione contattando un venditore' : 'Nessuna conversazione in questa categoria'}
              </p>
            </div>
          ) : (
            filtered.map((conv) => {
              const hasUnread = (conv.unread_count || 0) > 0;
              const isSelected = selectedConversation === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 flex items-start gap-3 transition-colors border-b border-gray-100 relative ${
                    isSelected
                      ? 'bg-blue-50'
                      : hasUnread
                      ? 'bg-blue-50/60 hover:bg-blue-100/60'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {hasUnread && !isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r" />
                  )}

                  <div className="relative flex-shrink-0">
                    {conv.profiles?.avatar_url ? (
                      <img
                        src={conv.profiles.avatar_url}
                        alt={conv.profiles.full_name}
                        className={`w-12 h-12 rounded-full object-cover ${hasUnread ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasUnread ? 'bg-blue-100 ring-2 ring-blue-500 ring-offset-1' : 'bg-gray-200'}`}>
                        <span className={`text-lg font-medium ${hasUnread ? 'text-blue-700' : 'text-gray-600'}`}>
                          {conv.profiles?.full_name.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                        {conv.profiles?.full_name || 'Utente'}
                      </span>
                      {hasUnread && (
                        <span className="ml-2 flex-shrink-0 min-w-[22px] h-[22px] flex items-center justify-center px-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-sm">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.classified_ads && (
                      <div className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {conv.classified_ads.title}
                      </div>
                    )}
                    {conv.job_seekers && (
                      <div className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {conv.job_seekers.title}
                      </div>
                    )}
                    {conv.job_postings && (
                      <div className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-600'}`}>
                        {conv.job_postings.title}
                      </div>
                    )}
                    <div className={`text-xs mt-1 ${hasUnread ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                      {formatMessageTime(conv.last_message_at)}
                    </div>
                  </div>
                </button>
              );
            })
          );
          })()}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          selectedConversation ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedConversation && selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              {selectedConv.profiles?.avatar_url ? (
                <img
                  src={selectedConv.profiles.avatar_url}
                  alt={selectedConv.profiles.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {selectedConv.profiles?.full_name.charAt(0) || '?'}
                  </span>
                </div>
              )}

              <div>
                <div className="font-semibold text-gray-900">
                  {selectedConv.profiles?.full_name || 'Utente'}
                </div>
                {selectedConv.classified_ads && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Tag className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="truncate">{selectedConv.classified_ads.title}</span>
                  </div>
                )}
                {selectedConv.job_seekers && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{selectedConv.job_seekers.title}</span>
                  </div>
                )}
                {selectedConv.job_postings && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Building2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    <span className="truncate">{selectedConv.job_postings.title}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isSender = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                        isSender
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="break-words">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isSender ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={sendMessage}
              className="bg-white border-t border-gray-200 p-4"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrivi un messaggio..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <MessageCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Seleziona una conversazione
              </h3>
              <p className="text-gray-600">
                Scegli una conversazione dalla lista per iniziare a chattare
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
