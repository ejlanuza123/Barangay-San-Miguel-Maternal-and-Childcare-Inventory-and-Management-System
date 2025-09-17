import { supabase } from './supabase';

/**
 * Logs an activity to the database.
 * @param {string} action - The title of the action (e.g., "New Patient Added").
 * @param {string} details - A short description of the event (e.g., "Patient Name: Juan Dela Cruz").
 * @param {string | null} targetUserId - Optional. The ID of the user the activity should be logged for. Defaults to the current user.
 */
export const logActivity = async (action, details, targetUserId = null) => {
  try {
    // Get the current user to see who is performing the action
    const { data: { user } } = await supabase.auth.getUser();

    // --- MODIFIED: Use the target user's ID if provided, otherwise default to the current user ---
    const userIdToLog = targetUserId || user?.id;

    if (!userIdToLog) {
        console.warn("No user ID provided for activity log.");
        return;
    }

    const { error } = await supabase
      .from('activity_log')
      .insert([{ action, details, user_id: userIdToLog }]); // Use the determined user_id

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('An unexpected error occurred while logging activity:', error);
  }
};