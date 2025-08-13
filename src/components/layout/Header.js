import React from 'react';

// --- SVG Icons for UI elements ---
const SearchIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>;
const BellIcon = () => <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>;
const UserCircleIcon = () => <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd"></path></svg>;


export default function Header({ role }) {
    const getTitle = () => {
        switch(role) {
            case 'BHW': return 'Barangay Health Worker';
            case 'BNS': return 'Barangay Nutrition Scholar';
            case 'Admin': return 'Administrator';
            default: return 'Dashboard';
        }
    };

    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
            <h1 className="text-2xl font-bold text-gray-800">{getTitle()}</h1>
            <div className="flex items-center space-x-4">
                <div className="relative">
                    {/* This is the corrected search bar structure */}
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input type="text" placeholder="Search" className="pl-10 pr-4 py-2 rounded-lg border bg-gray-50 focus:bg-white" />
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <BellIcon />
                </button>
                <button className="p-1 rounded-full hover:bg-gray-100">
                    <UserCircleIcon />
                </button>
            </div>
        </header>
    );
}
