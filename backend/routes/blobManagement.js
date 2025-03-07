import express from 'express';
import { list, del } from '@vercel/blob';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// List all blobs with pagination
router.get('/blobs', async (req, res) => {
  try {
    const { pageSize = 100, cursor } = req.query;
    
    const result = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      limit: parseInt(pageSize),
      cursor: cursor || undefined,
    });

    // Transform the response to include more useful information
    const formattedBlobs = result.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: formatFileSize(blob.size),
      uploadedAt: new Date(blob.uploadedAt).toLocaleString(),
      contentType: blob.contentType,
    }));

    res.json({
      blobs: formattedBlobs,
      hasMore: result.hasMore,
      cursor: result.cursor,
    });
  } catch (error) {
    console.error('Error listing blobs:', error);
    res.status(500).json({ 
      message: 'Error listing blobs', 
      error: error.message 
    });
  }
});

// Delete a specific blob
router.delete('/blobs', async (req, res) => {
    const { url } = req.query; // Expect the full URL from the client
  
    try {
      if (!url) {
        return res.status(400).json({ message: 'Blob URL is required for deletion' });
      }
  
      // Pass the full URL to the `del` function
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  
      res.json({
        message: 'Blob deleted successfully',
        deletedUrl: url,
      });
    } catch (error) {
      console.error('Error deleting blob:', error);
      res.status(500).json({
        message: 'Error deleting blob',
        error: error.message,
      });
    }
  });

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;