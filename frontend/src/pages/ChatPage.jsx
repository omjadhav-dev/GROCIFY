import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API from '../api';

// Single socket connection for the app
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

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Setup socket connection
  useEffect(() => {
    socket = io('http://localhost:5000');
    socket.emit('user_online', user._id);

    // Listen for incoming real-time messages
    socket.on('receive_message', (data) => {
      // Only update messages if we're in that conversation
      setActiveContact((current) => {
        if (current && (data.senderId === current._id || data.receiverId === current._id)) {
          setMessages((prev) => [...prev, {
            _id: Date.now().toString(),
            sender: data.senderId,
            text: data.message,
            createdAt: new Date().toISOString(),
          }]);
        }
        return current;
      });

      // Refresh contacts to update last message
      loadContacts();
    });

    return () => {
      socket.disconnect();
    };
  }, [user._id]);

  const loadContacts = async () => {
    try {
      const res = await API.get('/chat/contacts/list');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load contacts on mount
  useEffect(() => { loadContacts(); }, []);

  // Load browse users (opposite type)
  useEffect(() => {
    if (showBrowse) {
      API.get('/chat/users/browse').then((res) => setBrowseUsers(res.data)).catch(console.error);
    }
  }, [showBrowse]);

  // Load messages when a contact is selected
  const openChat = async (contact) => {
    setActiveContact(contact);
    setShowBrowse(false);
    try {
      const res = await API.get(`/chat/${contact._id}`);
      setMessages(res.data);
      // Refresh contacts to clear unread badge
      loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeContact) return;

    const text = newMessage.trim();
    setNewMessage('');

    // Optimistic UI: add message immediately
    const tempMsg = {
      _id: Date.now().toString(),
      sender: user._id,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      // Save to DB
      await API.post('/chat/send', { receiverId: activeContact._id, text });

      // Emit via socket for real-time delivery
      socket.emit('send_message', {
        senderId: user._id,
        receiverId: activeContact._id,
        message: text,
      });

      // Refresh contacts sidebar
      loadContacts();
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBrowse = browseUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content" style={{ padding: '20px' }}>
        <div className="chat-wrapper">

          {/* ---- Left Sidebar: Contact List ---- */}
          <div className="chat-sidebar">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Toggle: Chats / Browse */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
              <button
                onClick={() => setShowBrowse(false)}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  background: !showBrowse ? '#eff6ff' : 'white',
                  color: !showBrowse ? '#2563eb' : '#94a3b8',
                  borderBottom: !showBrowse ? '2px solid #2563eb' : '2px solid transparent',
                }}
              >
                💬 Chats
              </button>
              <button
                onClick={() => setShowBrowse(true)}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  background: showBrowse ? '#eff6ff' : 'white',
                  color: showBrowse ? '#2563eb' : '#94a3b8',
                  borderBottom: showBrowse ? '2px solid #2563eb' : '2px solid transparent',
                }}
              >
                🔎 Browse
              </button>
            </div>

            <div className="chat-list">
              {showBrowse ? (
                // Browse all wholesalers/shopkeepers
                filteredBrowse.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No users found
                  </div>
                ) : (
                  filteredBrowse.map((u) => (
                    <div
                      key={u._id}
                      className={`chat-item ${activeContact?._id === u._id ? 'active' : ''}`}
                      onClick={() => openChat(u)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-details">
                          <h4>{u.name}</h4>
                          <p style={{ color: '#94a3b8', fontSize: '12px' }}>{u.type} · {u.mobile}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                // Recent chats
                filteredContacts.length === 0 ? (
                  <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>💬</div>
                    No chats yet. Use Browse to start a conversation!
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className={`chat-item ${activeContact?._id === contact._id ? 'active' : ''}`}
                      onClick={() => openChat(contact)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-details" style={{ flex: 1, minWidth: 0 }}>
                          <h4>{contact.name}</h4>
                          <p>{contact.lastMessage || 'No messages yet'}</p>
                        </div>
                      </div>
                      <div className="chat-meta">
                        {contact.lastMessageTime && formatTime(contact.lastMessageTime)}
                        {contact.unreadCount > 0 && (
                          <div><span className="badge">{contact.unreadCount}</span></div>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          {/* ---- Right: Chat Window ---- */}
          {activeContact ? (
            <div className="chat-main">
              {/* Header */}
              <div className="chat-header">
                <h3>{activeContact.name}</h3>
                <p className="status">● Online</p>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>👋</div>
                    <p>Say hello to {activeContact.name}!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.sender === user._id || msg.sender?._id === user._id;
                    return (
                      <div key={msg._id} className={`message ${isSent ? 'sent' : 'received'}`}>
                        {msg.text}
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          ) : (
            <div className="chat-main">
              <div className="chat-empty">
                <div style={{ fontSize: '60px' }}>💬</div>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>Select a conversation</p>
                <p style={{ fontSize: '13px' }}>
                  Choose from your chats or browse {user.type === 'shopkeeper' ? 'wholesalers' : 'shopkeepers'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
