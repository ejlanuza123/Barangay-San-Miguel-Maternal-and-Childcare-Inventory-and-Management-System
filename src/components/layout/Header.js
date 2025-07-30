import React from 'react';

const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;

export default function Header({ fullName }) {
    const pageTitle = "Dashboard"; // This can be made dynamic later

    return (
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
                <p className="text-sm text-gray-500">Welcome back, {fullName || 'User'}</p>
            </div>
            <div className="flex items-center space-x-4">
                <button className="p-2 rounded-full hover:bg-gray-100">
                    <BellIcon />
                </button>
                <img src={`https://i.pravatar.cc/40?u=${fullName}`} alt="User Avatar" className="w-10 h-10 rounded-full"/>
            </div>
        </header>
    );
}
