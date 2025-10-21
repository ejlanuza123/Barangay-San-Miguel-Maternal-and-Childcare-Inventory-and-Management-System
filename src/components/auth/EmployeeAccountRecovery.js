import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export default function AccountRecovery() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BHW"); // --- 1. ADDED: State for selected role, defaults to BHW
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. Sign in with your credentials
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setMessage(`Error: ${loginError.message}`);
      setLoading(false);
      return;
    }

    if (loginData.user) {
      // 2. Immediately update the profile role back to the selected role
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: role }) // --- 2. MODIFIED: Use the selected role from state
        .eq("id", loginData.user.id);

      if (updateError) {
        setMessage(
          `Logged in, but could not update role: ${updateError.message}`
        );
      } else {
        setMessage(
          `Success! Your account has been reactivated. Redirecting to login...`
        );
        // 3. Log out and redirect to the normal login page with the correct role
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate("/login", { state: { role: role } }); // --- 3. MODIFIED: Use the selected role for navigation
        }, 2000);
      }
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
          {/* --- 4. NEW: Role Selection Dropdown --- */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
            >
              <option value="BHW">Barangay Health Worker</option>
              <option value="BNS">Barangay Nutrition Scholar</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

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
