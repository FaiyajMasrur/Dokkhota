// Admin category management page for Dokkhota
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import categoryService from '../services/categoryService.js';

const AdminCategoriesPage = () => {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await categoryService.createCategory({ name, description }, accessToken);
      setName('');
      setDescription('');
      setMessage('Category created.');
      loadCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create category.');
    }
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold mb-4'>Categories</h1>
          <p className='text-gray-600 mb-4'>Manage skill categories and category-level settings.</p>
          {message && <div className='mb-4 text-green-700'>{message}</div>}
          <form onSubmit={handleSubmit} className='space-y-4 mb-6'>
            <div>
              <label className='block mb-1'>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className='w-full border rounded px-4 py-3' required />
            </div>
            <div>
              <label className='block mb-1'>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className='w-full border rounded px-4 py-3' rows={3} />
            </div>
            <button type='submit' className='bg-green-600 text-white rounded-full px-6 py-3'>Create category</button>
          </form>
          <div className='rounded-3xl border p-6 text-gray-700'>
            <div className='space-y-3'>
              {categories.length > 0 ? categories.map((category) => (
                <div key={category._id} className='border rounded-3xl p-4'>
                  <div className='font-semibold'>{category.name}</div>
                  <div className='text-sm text-gray-500'>{category.description || 'No description'}</div>
                </div>
              )) : <p className='text-sm text-gray-500'>No categories yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
