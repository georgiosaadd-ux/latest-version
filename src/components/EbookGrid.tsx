import React, { useState } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const ReviewForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [review, setReview] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      // ✅ Call Supabase Edge Function to validate customer
      const res = await fetch(`${supabaseUrl}/functions/v1/verify-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setMessage(data.message || 'Something went wrong.');
        return;
      }

      if (data.exists) {
        // ✅ User found — proceed with saving review
        const reviewRes = await fetch(`${supabaseUrl}/functions/v1/save-review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, review }),
        });

        if (reviewRes.ok) {
          setStatus('success');
          setMessage('Thank you! Your review has been submitted.');
        } else {
          setStatus('error');
          setMessage('Failed to save review.');
        }
      } else {
        setStatus('error');
        setMessage('Email not found. Only verified customers can leave reviews.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Network or server error.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Leave a Review</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />
        <textarea
          placeholder="Write your review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
        >
          {status === 'loading' ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {message && (
        <p
          className={`mt-4 text-center ${
            status === 'success' ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default ReviewForm;
