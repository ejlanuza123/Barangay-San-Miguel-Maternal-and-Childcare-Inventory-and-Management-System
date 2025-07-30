import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

// MODIFIED: The modal now handles scroll detection
const TermsAndConditionsModal = ({ onAccept, onDecline }) => {
  const modalContentRef = useRef(null);
  // New state to track if the user has scrolled to the bottom
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  // This function is called every time the user scrolls inside the terms box
  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = modalContentRef.current;
    // Check if the user's scroll position is at the bottom
    // We add a small buffer (e.g., 5px) to handle rounding issues
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      setIsScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-2xl p-8 m-4 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Terms and Conditions</h2>
        <div 
          ref={modalContentRef}
          onScroll={handleScroll} // Add the onScroll event handler here
          className="prose max-w-none h-64 overflow-y-auto border p-4 rounded-md bg-gray-50 mb-6"
        >
          <h4>1. Introduction</h4>
          <p>Welcome to the Barangay San Miguel Maternal and Childcare Inventory System. By registering, you agree to these terms, which govern your use of this service designed to improve healthcare delivery in our community.</p>
          
          <h4>2. Data Privacy and Consent</h4>
          <p>In compliance with the **Republic Act No. 10173, also known as the Data Privacy Act of 2012**, we are committed to protecting your personal and sensitive health information.</p>
          <ul>
            <li><strong>Collection:</strong> We will collect personal data such as your name, contact details, and health information related to you and your child's maternal and childcare needs.</li>
            <li><strong>Use:</strong> This information will be used exclusively by authorized Barangay Health Workers (BHWs), Barangay Nutrition Scholars (BNS), and Administrators for the purposes of record-keeping, appointment scheduling, inventory management, and healthcare service delivery.</li>
            <li><strong>Confidentiality:</strong> Your data will be treated with the utmost confidentiality and will not be shared with unauthorized third parties without your explicit consent, except as required by law.</li>
          </ul>
          
          <h4>3. User Responsibilities</h4>
          <p>You are responsible for providing accurate and up-to-date information. You are also responsible for maintaining the confidentiality of your account password.</p>

          <h4>4. Service Availability</h4>
          <p>The system is provided to facilitate better healthcare services. While we strive for constant availability, we are not liable for any interruptions or failures in service.</p>

          <h4>5. Acceptance of Terms</h4>
          <p>By clicking "Accept", you confirm that you have read, understood, and consented to these terms and the processing of your personal and health information as described herein.</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={onDecline} 
            className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={onAccept} 
            // MODIFIED: The button is disabled until the user scrolls to the bottom
            disabled={!isScrolledToBottom}
            className="bg-teal-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};


export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!hasAgreedToTerms) {
      setMessage('You must agree to the Terms and Conditions to register.');
      return;
    }
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'USER/MOTHER/GUARDIAN' 
        }
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Registration successful! Please check your email to verify your account.');
    }
    setLoading(false);
  };

  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      setIsTermsModalOpen(true);
    } else {
      setHasAgreedToTerms(false);
    }
  };

  const handleAcceptTerms = () => {
    setHasAgreedToTerms(true);
    setIsTermsModalOpen(false);
  };

  const handleDeclineTerms = () => {
    setHasAgreedToTerms(false);
    setIsTermsModalOpen(false);
  };

  return (
    <>
      {isTermsModalOpen && <TermsAndConditionsModal onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />}
      
      <div className="bg-gray-100 min-h-screen flex items-center justify-center font-sans py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-12">
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
              <p className="text-gray-500">Join the Maternal and Childcare System</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                id="terms-checkbox"
                type="checkbox" 
                checked={hasAgreedToTerms}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="terms-checkbox" className="text-sm text-gray-600">
                I agree to the Terms and Conditions.
              </label>
            </div>
            
            {message && <p className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-md">{message}</p>}
            
            <button 
              type="submit" 
              disabled={loading || !hasAgreedToTerms} 
              className="w-full bg-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Already have an account?{' '}
            <Link to="/login" state={{ role: 'USER/MOTHER/GUARDIAN' }} className="font-medium text-teal-600 hover:text-teal-800">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
