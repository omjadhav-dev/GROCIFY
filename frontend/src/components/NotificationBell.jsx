import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { Bell, Package, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const timeAgo = (dateStr) => {
  const diffSec = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load existing notifications, then open a socket to receive new ones live
  useEffect(() => {
    loadNotifications();

    const socket = io(SOCKET_URL);
    socket.emit('user_online', user.id);
    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, [user.id]);

  // The sidebar scrolls (overflow-y-auto), and per the CSS spec setting
  // overflow on one axis clips the other axis too — so a dropdown absolutely
  // positioned inside the sidebar gets silently cut off. Rendering it in a
  // portal (attached to <body>, positioned with fixed coords from the
  // button's own bounding box) sidesteps that entirely.
  const openPanel = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
    setOpen((o) => !o);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (notification) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      try {
        await API.put(`/notifications/${notification.id}/read`);
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(false);
    if (notification.orderId) navigate('/orders');
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await API.put('/notifications/read-all');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openPanel}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left }}
            className="z-[999] w-80 rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-leaf-700 hover:underline"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  <Package className="mx-auto mb-2" size={26} />
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleSelect(n)}
                    className={`block w-full border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      !n.read ? 'bg-leaf-50/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-600" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">{n.title}</div>
                        <div className="truncate text-xs text-slate-500">{n.message}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default NotificationBell;
