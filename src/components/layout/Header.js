import React from 'react';
import { useAuth } from '../../context/AuthContext';

// --- SVG Icons for UI elements ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const BellIcon = () => <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>;
// --- ADDED: Settings Icon SVG Component ---
const SettingsIcon = () => <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;


export default function Header() {
    const { profile } = useAuth();

    const getTitle = () => {
        if (!profile) return 'Loading...'; 

        switch(profile.role) {
            case 'BHW': return 'Barangay Health Worker';
            case 'BNS': return 'Barangay Nutrition Scholar';
            case 'Admin': return 'Administrator';
            case 'USER/MOTHER/GUARDIAN': return 'My Health Portal';
            default: return 'Dashboard';
        }
    };

    return (
        <header className="bg-white p-4 flex justify-between items-center border-b">
            {/* Left Side: Role Title */}
            <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
            
            {/* Right Side: Controls */}
            <div className="flex items-center space-x-4">
                <div className="relative hidden md:block">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="pl-10 pr-4 py-2 text-sm w-48 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <BellIcon />
                </button>
                {/* --- ADDED: Settings Icon Button --- */}
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <SettingsIcon />
                </button>
                <button className="flex items-center space-x-2">
                     <img 
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'U'}&background=random`} 
                        alt="User Avatar" 
                        className="w-9 h-9 rounded-full border-2 border-gray-200"
                    />
                </button>
            </div>
        </header>
    );
}