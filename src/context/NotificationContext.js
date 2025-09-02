import React, { createContext, useState, useContext } from 'react';
import Notification from '../components/layout/Notification';
import { AnimatePresence } from 'framer-motion'; // <-- 1. IMPORT AnimatePresence

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success') => {
    const id = Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50">
        {/* --- 2. WRAP THE LIST WITH AnimatePresence --- */}
        <AnimatePresence>
          {notifications.map(n => (
            <Notification key={n.id} notification={n} onClear={removeNotification} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};