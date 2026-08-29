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
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAllCategories(accessToken);
      setCategories(response.data.categories || []);
    } catch (error) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [accessToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await categoryService.createCategory({ name, description }, accessToken);
      setName('');
      setDescription('');
      setMessage({ type: 'success', text: 'Category created successfully.' });
      loadCategories();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to create category.' });
    }
  };

  const handleRename = async (category) => {
    const newName = window.prompt(`Rename category "${category.name}" to:`, category.name);
    if (!newName || newName.trim() === category.name) return;

    try {
      await categoryService.updateCategory(category._id, { name: newName.trim() }, accessToken);
      setMessage({
        type: 'success',
        text: `Category renamed to "${newName.trim()}". All existing listings have been updated automatically!`,
      });
      loadCategories();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to rename category.' });
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await categoryService.updateCategory(
        category._id,
        { isActive: !category.isActive },
        accessToken
      );
      setMessage({
        type: 'success',
        text: `Category marked as ${!category.isActive ? 'Active' : 'Inactive'}.`,
      });
      loadCategories();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update status.' });
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      await categoryService.deleteCategory(category._id, accessToken);
      setMessage({ type: 'success', text: 'Category deleted.' });
      loadCategories();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete category.' });
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 py-10'>
      <div className='max-w-6xl mx-auto px-4'>
        <div className='bg-white rounded-3xl p-8 shadow-sm border border-slate-100'>
          <h1 className='text-3xl font-bold text-slate-800 mb-2'>Categories Management</h1>
          <p className='text-gray-600 mb-6 text-sm'>
            Create, rename, activate/deactivate, and manage categories. Category renames automatically propagate across all existing skill listings.
          </p>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className='grid gap-8 lg:grid-cols-[1.1fr_1.9fr]'>
            {/* Create Category Form */}
            <div className='bg-slate-50 p-6 rounded-2xl border border-slate-200'>
              <h2 className='text-lg font-bold text-slate-800 mb-4'>Add New Category</h2>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label className='block text-xs font-semibold text-slate-700 mb-1'>Category Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. Artificial Intelligence'
                    className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    required
                  />
                </div>
                <div>
                  <label className='block text-xs font-semibold text-slate-700 mb-1'>Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Brief description of this category...'
                    className='w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                    rows={3}
                  />
                </div>
                <button
                  type='submit'
                  className='w-full bg-emerald-600 text-white font-medium rounded-xl px-5 py-2.5 hover:bg-emerald-700 transition shadow-sm text-sm'
                >
                  Create Category
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div>
              <h2 className='text-lg font-bold text-slate-800 mb-4'>Existing Categories ({categories.length})</h2>
              <div className='space-y-3'>
                {loading ? (
                  <p className='text-slate-500 text-sm'>Loading categories...</p>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <div
                      key={category._id}
                      className='border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white hover:shadow-sm transition'
                    >
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-bold text-slate-800 text-base'>{category.name}</h3>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                              category.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {category.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className='text-xs text-slate-500 mt-1'>
                          {category.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={() => handleRename(category)}
                          className='text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition'
                        >
                          Rename ✏️
                        </button>
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                            category.isActive !== false
                              ? 'border-amber-300 text-amber-800 hover:bg-amber-50'
                              : 'border-emerald-300 text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          {category.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className='text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-sm text-slate-500'>No categories found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
