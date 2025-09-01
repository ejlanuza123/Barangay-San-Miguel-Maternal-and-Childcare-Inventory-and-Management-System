import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import SettingsModal from './SettingsModal';

// --- SVG Icons ---
const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const BellIcon = () => (
  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const SettingsIcon = () => (
  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);




export default function Header() {
  const { profile } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
    const fetchActivities = async () => {
        const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

        setActivities(data || []);
        // count unread
        setUnreadCount((data || []).filter(a => !a.read).length);
    };
    fetchActivities();
    }, []);

    const handleNotifClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
        // mark as read
        const ids = activities.map(a => a.id);
        if (ids.length > 0) {
        await supabase.from('activity_log').update({ read: true }).in('id', ids);
        setUnreadCount(0);
        }
    }
    };



  const getTitle = () => {
    if (!profile) return 'Loading...';
    switch (profile.role) {
      case 'BHW': return 'Barangay Health Worker';
      case 'BNS': return 'Barangay Nutrition Scholar';
      case 'Admin': return 'Administrator';
      case 'USER/MOTHER/GUARDIAN': return 'My Health Portal';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      </AnimatePresence>

      <header className="bg-white px-4 py-3 flex justify-between items-center border-b">
        {/* Left: Role Title */}
        <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>

        {/* Right: Controls */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 text-sm w-48 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
                <button onClick={handleNotifClick} className="p-2 rounded-full hover:bg-gray-100 relative">
                    <BellIcon />
                    {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5">
                        {unreadCount}
                    </span>
                    )}
                </button>
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20"
                >
                  <div className="p-4 font-bold border-b">Notifications</div>
                  <div className="p-2 max-h-96 overflow-y-auto">
                    {activities.length > 0 ? activities.map(act => (
                      <div key={act.id} className="p-2 border-b hover:bg-gray-50">
                        <p className="font-semibold text-sm">{act.action}</p>
                        <p className="text-xs text-gray-500">{act.details}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(act.created_at).toLocaleString()}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 p-4 text-center">No new notifications.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-100">
            <SettingsIcon />
          </button>

          {/* Avatar */}
          <button className="flex items-center space-x-2">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random`}
              alt="User Avatar"
              className="w-9 h-9 rounded-full border-2 border-gray-200"
            />
          </button>
        </div>
      </header>
    </>
  );
}
