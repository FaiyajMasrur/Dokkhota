// Skill listing creation page for Dokkhota providers
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import skillService from '../services/skillService.js';
import categoryService from '../services/categoryService.js';

const CreateListingPage = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    format: 'online',
    durationMinutes: 60,
    creditCost: 10,
    proficiencyLevel: 'beginner',
    tags: '',
    availability: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data.categories || []);
      } catch (error) {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!accessToken) {
      setError('You must be logged in to create a listing.');
      return;
    }

    try {
      const availability = form.availability
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((slot) => ({ day: slot.split(' ')[0] || '', slots: [slot.split(' ').slice(1).join(' ')] }));

      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        format: form.format,
        durationMinutes: Number(form.durationMinutes),
        creditCost: Number(form.creditCost),
        proficiencyLevel: form.proficiencyLevel,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        availability,
      };

      const response = await skillService.createListing(payload, accessToken);
      if (response.data?.success) {
        setSuccess('Listing created successfully.');
        navigate(`/listing/${response.data.listing._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create listing');
    }
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-3xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl shadow-sm p-8'>
          <h1 className='text-3xl font-semibold mb-4'>Create a new skill listing</h1>
          {error && <div className='text-red-600 mb-4'>{error}</div>}
          {success && <div className='text-green-600 mb-4'>{success}</div>}
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <label className='block mb-1 font-medium'>Title</label>
              <input value={form.title} onChange={handleChange('title')} className='w-full border rounded px-4 py-3' required />
            </div>
            <div>
              <label className='block mb-1 font-medium'>Category</label>
              <select value={form.category} onChange={handleChange('category')} className='w-full border rounded px-4 py-3' required>
                <option value=''>Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block mb-1 font-medium'>Description</label>
              <textarea value={form.description} onChange={handleChange('description')} className='w-full border rounded px-4 py-3' rows={5} required />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <label className='block mb-1 font-medium'>Mode</label>
                <select value={form.format} onChange={handleChange('format')} className='w-full border rounded px-4 py-3'>
                  <option value='online'>Online</option>
                  <option value='in-person'>In Person</option>
                </select>
              </div>
              <div>
                <label className='block mb-1 font-medium'>Level</label>
                <select value={form.proficiencyLevel} onChange={handleChange('proficiencyLevel')} className='w-full border rounded px-4 py-3'>
                  <option value='beginner'>Beginner</option>
                  <option value='intermediate'>Intermediate</option>
                  <option value='expert'>Expert</option>
                </select>
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <label className='block mb-1 font-medium'>Duration (minutes)</label>
                <input type='number' min={15} value={form.durationMinutes} onChange={handleChange('durationMinutes')} className='w-full border rounded px-4 py-3' required />
              </div>
              <div>
                <label className='block mb-1 font-medium'>Credit cost</label>
                <input type='number' min={1} value={form.creditCost} onChange={handleChange('creditCost')} className='w-full border rounded px-4 py-3' required />
              </div>
            </div>
            <div>
              <label className='block mb-1 font-medium'>Tags (comma separated)</label>
              <input value={form.tags} onChange={handleChange('tags')} className='w-full border rounded px-4 py-3' placeholder='e.g. JavaScript, mentoring' />
            </div>
            <div>
              <label className='block mb-1 font-medium'>Availability examples</label>
              <textarea value={form.availability} onChange={handleChange('availability')} className='w-full border rounded px-4 py-3' rows={3} placeholder='Monday 10:00-12:00, Wednesday 18:00-20:00' />
            </div>
            <button type='submit' className='bg-green-600 text-white rounded-full px-6 py-3 hover:bg-green-700'>Create listing</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPage;
