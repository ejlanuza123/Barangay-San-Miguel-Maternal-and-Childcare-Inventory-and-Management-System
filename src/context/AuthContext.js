import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';

// Create the authentication context
const AuthContext = createContext();

// Create the provider component that will wrap our app
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect runs only once to get the initial session and set up the listener.
        // This is the most reliable way to get the user's auth state.
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth listener fired. Session:", session);
            // Set the user state based on the session from the listener
            setUser(session?.user ?? null);
            // Crucially, we set loading to false here. The app now knows if a user is logged in or not.
            setLoading(false);
        });

        // Cleanup function to unsubscribe from the listener when the component unmounts
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // A separate effect to fetch the user's profile.
    // This runs whenever the 'user' state changes (i.e., after login or logout).
    useEffect(() => {
        // If there's a user, fetch their profile from the 'profiles' table
        if (user) {
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching profile:', error);
                    } else {
                        console.log('Profile fetched:', data);
                        setProfile(data);
                    }
                });
        } else {
            // If there's no user, clear the profile
            setProfile(null);
        }
    }, [user]); // This effect depends on the user state

    // The value object holds the auth state and functions to be shared
    const value = {
        user,
        setProfile,
        profile,
        loading,
        signOut: () => supabase.auth.signOut(),
    };

    // We don't render the app until the initial loading is false.
    // This prevents UI flickers while the session is being checked.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// A custom hook for easy access to the auth context from any component
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
