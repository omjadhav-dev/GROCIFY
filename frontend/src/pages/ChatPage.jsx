import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Search, MessageCircle, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

// Backend Socket.IO origin — defaults to the dev backend port
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket;

const ChatPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [browseUsers, setBrowseUsers] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showBrowse, setShowBrowse] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    socket = io(SOCKET_URL);
    socket.emit('user_online', user.id);

    socket.on('receive_message', (data) => {
      setActiveContact((current) => {
        if (current && (data.senderId === current.id || data.receiverId === current.id)) {
          setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            senderId: data.senderId,
            text: data.message,
            createdAt: new Date().toISOString(),
          }]);
        }
        return current;
      });
      loadContacts();
    });

    return () => socket.disconnect();
  }, [user.id]);

  const loadContacts = async () => {
    try {
      const res = await API.get('/chat/contacts/list');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  useEffect(() => {
    if (showBrowse) {
      API.get('/chat/users/browse').then((res) => setBrowseUsers(res.data)).catch(console.error);
    }
  }, [showBrowse]);

  const openChat = async (contact) => {
    setActiveContact(contact);
    setShowBrowse(false);
    try {
      const res = await API.get(`/chat/${contact.id}`);
      setMessages(res.data);
      loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeContact) return;
    const text = newMessage.trim();
    setNewMessage('');

    const tempMsg = { id: Date.now().toString(), senderId: user.id, text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await API.post('/chat/send', { receiverId: activeContact.id, text });
      socket.emit('send_message', { senderId: user.id, receiverId: activeContact.id, message: text });
      loadContacts();
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') sendMessage(); };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const filteredContacts = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredBrowse = browseUsers.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-cream-50">
      <Sidebar />
      <div className="flex-1 p-5">
        <div className="flex h-[calc(100vh-2.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          {/* Left: Contact List */}
          <div className="flex w-72 shrink-0 flex-col border-r border-slate-100">
            <div className="relative border-b border-slate-100 p-3">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input py-2 pl-9 text-sm"
              />
            </div>

            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setShowBrowse(false)}
                className={`flex-1 border-b-2 py-2.5 text-xs font-semibold ${
                  !showBrowse ? 'border-leaf-600 bg-leaf-50 text-leaf-700' : 'border-transparent text-slate-400'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setShowBrowse(true)}
                className={`flex-1 border-b-2 py-2.5 text-xs font-semibold ${
                  showBrowse ? 'border-leaf-600 bg-leaf-50 text-leaf-700' : 'border-transparent text-slate-400'
                }`}
              >
                Browse
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {showBrowse ? (
                filteredBrowse.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400">No users found</div>
                ) : (
                  filteredBrowse.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => openChat(u)}
                      className={`flex cursor-pointer items-center gap-2.5 px-4 py-3 hover:bg-slate-50 ${activeContact?.id === u.id ? 'bg-leaf-50' : ''}`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-800">{u.name}</h4>
                        <p className="truncate text-xs text-slate-400">{u.type} · {u.mobile}</p>
                      </div>
                    </div>
                  ))
                )
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <MessageCircle className="mx-auto mb-2" size={26} />
                  No chats yet. Use Browse to start a conversation!
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => openChat(contact)}
                    className={`flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 ${activeContact?.id === contact.id ? 'bg-leaf-50' : ''}`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-white">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold text-slate-800">{contact.name}</h4>
                        <p className="truncate text-xs text-slate-400">{contact.lastMessage || 'No messages yet'}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-slate-400">
                      {contact.lastMessageTime && formatTime(contact.lastMessageTime)}
                      {contact.unreadCount > 0 && (
                        <div className="mt-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-leaf-600 px-1 text-[10px] font-bold text-white">
                          {contact.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Chat Window */}
          {activeContact ? (
            <div className="flex flex-1 flex-col">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-900">{activeContact.name}</h3>
                <p className="text-xs text-leaf-600">● Online</p>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-5">
                {messages.length === 0 ? (
                  <div className="mt-16 text-center text-slate-400">
                    <p>Say hello to {activeContact.name}!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                            isSent ? 'rounded-br-sm bg-leaf-600 text-white' : 'rounded-bl-sm bg-white text-slate-800 shadow-sm'
                          }`}
                        >
                          {msg.text}
                          <div className={`mt-1 text-[10px] ${isSent ? 'text-leaf-100' : 'text-slate-400'}`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 p-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input flex-1"
                />
                <button onClick={sendMessage} className="btn-primary px-4">
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
              <MessageCircle size={56} strokeWidth={1.25} />
              <p className="font-semibold text-slate-600">Select a conversation</p>
              <p className="text-sm">
                Choose from your chats or browse {user.type === 'shopkeeper' ? 'wholesalers' : 'shopkeepers'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
