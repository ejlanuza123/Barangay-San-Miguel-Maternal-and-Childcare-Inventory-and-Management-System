import { supabase } from './supabase';

/**
 * Logs an activity to the database.
 * @param {string} action - The title of the action (e.g., "New Patient Added").
 * @param {string} details - A short description of the event (e.g., "Patient Name: Juan Dela Cruz").
 */
export const logActivity = async (action, details) => {
  try {
    const { error } = await supabase
      .from('activity_log')
      .insert([{ action, details }]);

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('An unexpected error occurred while logging activity:', error);
  }
};
