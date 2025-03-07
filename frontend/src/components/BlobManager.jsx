import React, { useState, useEffect } from 'react';
import { Trash2, Download, Loader, AlertCircle } from 'lucide-react';
import axios from 'axios';
const BlobManager = () => {
  const [blobs, setBlobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlobs();
  }, []);

  const getAuthToken = () => localStorage.getItem('token');

  const fetchBlobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/storage/blobs`);

      if (response.status === 401) throw new Error('Unauthorized. Please log in again.');

      const data = await response.data;
      console.log(response.data.blobs[0])
      setBlobs(data.blobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blobUrl) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
  
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/storage/blobs`, {
        params: { url: blobUrl }, // Send the full URL as a query parameter
      });
  
      if (response.status === 200) {
        setBlobs((prev) => prev.filter((blob) => blob.url !== blobUrl));
      }
    } catch (err) {
      console.error('Error deleting blob:', err);
      setError(err.message);
    }
  };
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <p className="font-medium flex items-center">
          <AlertCircle className="mr-2" /> Error:
        </p>
        <p className="mt-1">{error}</p>
        {error.includes('Unauthorized') && (
          <button
            onClick={() => (window.location.href = '/login')}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Blob Storage Manager</h2>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="animate-spin mr-2" />
          <span>Loading files...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {blobs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No files found in blob storage
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {blobs.map((blob, index) => (
                <div
                  key={blob.pathname + index}
                  className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between"
                >
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 break-all">
                      {blob.pathname}
                    </div>
                    <img src={blob.url}></img>
                    <div className="text-sm text-gray-500 mt-1">
                      Size: {blob.size || 'Unknown'} • Uploaded:{' '}
                      {blob.uploadedAt || 'Unknown'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    <a
                      href={blob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Download size={20} />
                    </a>
                    <button
                      onClick={() => handleDelete(blob.url)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BlobManager