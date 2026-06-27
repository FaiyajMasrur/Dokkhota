// Explore page for Dokkhota with search filters and listing results
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import skillService from '../services/skillService.js';
import SkillCard from '../components/SkillCard.jsx';

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
    format: searchParams.get('format') || '',
    minCredits: searchParams.get('minCredits') || '',
    maxCredits: searchParams.get('maxCredits') || '',
  });

  useEffect(() => {
    const loadListings = async () => {
      try {
        const params = {
          q: searchParams.get('q') || undefined,
          category: searchParams.get('category') || undefined,
          proficiencyLevel: searchParams.get('level') || undefined,
          format: searchParams.get('format') || undefined,
          minCredits: searchParams.get('minCredits') || undefined,
          maxCredits: searchParams.get('maxCredits') || undefined,
        };
        const response = await skillService.searchListings(params);
        setListings(response.data.listings || []);
      } catch (error) {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, [searchParams]);

  useEffect(() => {
    setFilters({
      q: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      level: searchParams.get('level') || '',
      format: searchParams.get('format') || '',
      minCredits: searchParams.get('minCredits') || '',
      maxCredits: searchParams.get('maxCredits') || '',
    });
  }, [searchParams]);

  const handleChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.level) params.level = filters.level;
    if (filters.format) params.format = filters.format;
    if (filters.minCredits) params.minCredits = filters.minCredits;
    if (filters.maxCredits) params.maxCredits = filters.maxCredits;
    setSearchParams(params);
  };

  const handleClear = () => {
    setFilters({
      q: '',
      category: '',
      level: '',
      format: '',
      minCredits: '',
      maxCredits: '',
    });
    setSearchParams({});
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='mb-8'>
          <h1 className='text-3xl font-semibold mb-2'>Explore skill listings</h1>
          <p className='text-gray-600'>Search available skill exchange offerings across categories and formats.</p>
        </div>

        <div className='grid gap-6 lg:grid-cols-[280px_1fr]'>
          <aside className='bg-white rounded-3xl p-6 shadow-sm'>
            <h2 className='text-xl font-semibold mb-4'>Filters</h2>
            <form className='space-y-4' onSubmit={handleSearch}>
              <div>
                <label className='block text-sm text-gray-700 mb-1'>Search</label>
                <input
                  value={filters.q}
                  onChange={handleChange('q')}
                  className='w-full border rounded px-3 py-2'
                  placeholder='Search skills or teachers'
                />
              </div>
              <div>
                <label className='block text-sm text-gray-700 mb-1'>Category</label>
                <input value={filters.category} onChange={handleChange('category')} className='w-full border rounded px-3 py-2' placeholder='e.g. programming' />
              </div>
              <div>
                <label className='block text-sm text-gray-700 mb-1'>Level</label>
                <select value={filters.level} onChange={handleChange('level')} className='w-full border rounded px-3 py-2'>
                  <option value=''>Any</option>
                  <option value='beginner'>Beginner</option>
                  <option value='intermediate'>Intermediate</option>
                  <option value='expert'>Expert</option>
                </select>
              </div>
              <div>
                <label className='block text-sm text-gray-700 mb-1'>Format</label>
                <select value={filters.format} onChange={handleChange('format')} className='w-full border rounded px-3 py-2'>
                  <option value=''>Any</option>
                  <option value='online'>Online</option>
                  <option value='in-person'>In Person</option>
                </select>
              </div>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <label className='block text-sm text-gray-700 mb-1'>Min credits</label>
                  <input value={filters.minCredits} onChange={handleChange('minCredits')} type='number' min='0' className='w-full border rounded px-3 py-2' placeholder='0' />
                </div>
                <div>
                  <label className='block text-sm text-gray-700 mb-1'>Max credits</label>
                  <input value={filters.maxCredits} onChange={handleChange('maxCredits')} type='number' min='0' className='w-full border rounded px-3 py-2' placeholder='Any' />
                </div>
              </div>
              <div className='flex gap-3'>
                <button type='submit' className='flex-1 bg-green-600 text-white rounded-full px-4 py-3 hover:bg-green-700'>Apply filters</button>
                <button type='button' onClick={handleClear} className='flex-1 border border-gray-300 rounded-full px-4 py-3 hover:bg-gray-100'>Clear</button>
              </div>
            </form>
          </aside>

          <main>
            {loading ? (
              <div className='text-gray-600'>Loading listings...</div>
            ) : listings.length > 0 ? (
              <div className='grid gap-6 md:grid-cols-2'>
                {listings.map((listing) => <SkillCard key={listing._id} listing={listing} />)}
              </div>
            ) : (
              <div className='bg-white rounded-3xl p-10 text-center text-gray-600 shadow-sm'>No listings matched your search.</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
