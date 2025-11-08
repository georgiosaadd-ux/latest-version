// pages/EbookReader.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const EbookReader: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [error, setError] = useState('');
  const [ebookTitle, setEbookTitle] = useState('');

  useEffect(() => {
    loadEbook();

    // Refresh signed URL every 4 minutes (expires in 5 min)
    const interval = setInterval(() => {
      refreshSignedUrl();
    }, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, [productId]);

  const loadEbook = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/portal/login');
        return;
      }

      // Verify user owns this ebook
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!customers) throw new Error('Customer not found');

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', customers.id)
        .eq('status', 'paid');

      if (!orders || orders.length === 0) throw new Error('No purchases found');

      const orderIds = orders.map(o => o.id);

      const { data: item } = await supabase
        .from('order_items')
        .select('title')
        .in('order_id', orderIds)
        .eq('product_id', productId)
        .single();

      if (!item) throw new Error('You do not own this ebook');

      setEbookTitle(item.title);

      // Generate signed URL (expires in 5 minutes)
      const { data, error: urlError } = await supabase.storage
        .from('ebooks')
        .createSignedUrl(`${productId}.pdf`, 300); // 300 seconds = 5 min

      if (urlError) throw urlError;
      if (!data.signedUrl) throw new Error('Failed to generate download URL');

      setPdfUrl(data.signedUrl);
    } catch (err: any) {
      console.error('Error loading ebook:', err);
      setError(err.message || 'Failed to load ebook');
    } finally {
      setLoading(false);
    }
  };

  const refreshSignedUrl = async () => {
    try {
      const { data } = await supabase.storage
        .from('ebooks')
        .createSignedUrl(`${productId}.pdf`, 300);

      if (data?.signedUrl) {
        setPdfUrl(data.signedUrl);
      }
    } catch (err) {
      console.error('Error refreshing URL:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading your ebook...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/portal/dashboard')}
            className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 text-white px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate('/portal/dashboard')}
          className="flex items-center gap-2 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back to Library</span>
        </button>
        <h1 className="text-lg font-semibold truncate flex-1">{ebookTitle}</h1>
      </header>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        {pdfUrl && (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={ebookTitle}
            onContextMenu={(e) => e.preventDefault()} // Disable right-click
          />
        )}
      </div>

      {/* Security note */}
      <div className="bg-gray-800 text-gray-400 text-xs text-center py-2 px-4">
        This content is protected and for your personal use only
      </div>
    </div>
  );
};

export default EbookReader;