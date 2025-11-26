import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export default function AccountRecovery() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. Sign in with credentials
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setMessage(`Error: ${loginError.message}`);
      setLoading(false);
      return;
    }

    if (loginData.user) {
      // 2. Fetch profile to check existing role (ensure we aren't creating a new role)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", loginData.user.id)
        .single();

      if (profileError) {
        setMessage(`Logged in, but could not verify profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      // 3. Reactivate logic (assuming reactivation just means logging in successfully here)
      // In a complex system, you might toggle a 'status' field from 'suspended' to 'active'.
      // For now, we just confirm they can access the system.

      setMessage(`Success! Account verified. Redirecting to login...`);
      
      await supabase.auth.signOut(); // Sign out so they have to log in properly through the main gate
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Employee Account Recovery
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Enter your credentials to reactivate your account.
        </p>
        <form onSubmit={handleRecover} className="space-y-4">
          {/* Role Selection Removed - Automatic Detection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          {message && (
            <p className="text-center text-sm font-semibold text-blue-600">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Recovering..." : "Reactivate My Account"}
          </button>
        </form>
      </div>
    </div>
  );
}