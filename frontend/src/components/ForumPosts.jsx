import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL + '/posts';

function ForumPosts() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await axios.get(API_URL);
    setPosts(response.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.patch(`${API_URL}/${editingId}`, { title, content });
      setEditingId(null);
    } else {
      await axios.post(API_URL, { title, content, author: '60cc9b0e001e3bfd00a6eddf' }); // Replace with actual user ID
    }
    setTitle('');
    setContent('');
    fetchPosts();
  };

  const handleEdit = (post) => {
    setTitle(post.title);
    setContent(post.content);
    setEditingId(post._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchPosts();
  };

  const handleLogout = () => {
    // Remove JWT token from local storage (or state)
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-6">
      <header className="bg-blue-600 text-white text-center py-6 rounded-lg mb-8 shadow-lg">
        <h1 className="text-3xl font-extrabold">Forum Posts</h1>
      </header>

      <div className="text-right mb-6">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition ease-in-out duration-200"
        >
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6">{editingId ? 'Edit Your Post' : 'Create a New Post'}</h2>
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post Title"
          className="w-full p-4 mb-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post content..."
          className="w-full p-4 mb-6 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          {editingId ? 'Update Post' : 'Create Post'}
        </button>
      </form>

      <div>
        {posts.map((post) => (
          <div key={post._id} className="bg-white p-6 rounded-lg shadow-lg mb-6 hover:shadow-xl transition duration-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h3>
            <p className="text-gray-700 mb-4">{post.content}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleEdit(post)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(post._id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="text-center text-gray-500 mt-8">
        &copy; 2024 Forum App. All rights reserved.
      </footer>
    </div>
  );
}

export default ForumPosts;
