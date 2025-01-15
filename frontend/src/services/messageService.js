import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL+'/chat';

export const sendMessage = async (recipientId, content) => {
  const token = sessionStorage.getItem('token');
  const response = await axios.post(API_URL, 
    { recipientId, content },
    { 
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

export const getConversation = async (userId) => {
  const token = sessionStorage.getItem('token');
  const response = await axios.get(`${API_URL}/conversation/${userId}`,
    { 
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

export const getConversations = async () => {
  const token = sessionStorage.getItem('token');
  const response = await axios.get(`${API_URL}/conversations`, 
    {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};