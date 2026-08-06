// Explore page for Dokkhota with search filters, sorting, and paginated listings.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import skillService from '../services/skillService.js';
import categoryService from '../services/categoryService.js';
import SkillCard from '../components/SkillCard.jsx';

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
    format: searchParams.get('format') || '',
    minCredits: searchParams.get('minCredits') || '',
    maxCredits: searchParams.get('maxCredits') || '',
    dayAvailable: searchParams.get('dayAvailable') || '',
    sortBy: searchParams.get('sortBy') || 'recent',
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '12',
  });

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

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      try {
        const params = {
          q: searchParams.get('q') || undefined,
          category: searchParams.get('category') || undefined,
          level: searchParams.get('level') || undefined,
          format: searchParams.get('format') || undefined,
          minCredits: searchParams.get('minCredits') || undefined,
          maxCredits: searchParams.get('maxCredits') || undefined,
          dayAvailable: searchParams.get('dayAvailable') || undefined,
          sortBy: searchParams.get('sortBy') || undefined,
          page: searchParams.get('page') || undefined,
          limit: searchParams.get('limit') || undefined,
        };
        const response = await skillService.searchListings(params);
        setListings(response.data.listings || []);
        setMeta({
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
          totalResults: response.data.totalResults || 0,
        });
      } catch (error) {
        setListings([]);
        setMeta({ page: 1, totalPages: 1, totalResults: 0 });
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
      dayAvailable: searchParams.get('dayAvailable') || '',
      sortBy: searchParams.get('sortBy') || 'recent',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '12',
    });
  }, [searchParams]);

  const handleChange = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const buildParams = (values) => {
    const params = {};
    if (values.q) params.q = values.q;
    if (values.category) params.category = values.category;
    if (values.level) params.level = values.level;
    if (values.format) params.format = values.format;
    if (values.minCredits) params.minCredits = values.minCredits;
    if (values.maxCredits) params.maxCredits = values.maxCredits;
    if (values.dayAvailable) params.dayAvailable = values.dayAvailable;
    if (values.sortBy && values.sortBy !== 'recent') params.sortBy = values.sortBy;
    if (values.page && values.page !== '1') params.page = values.page;
    if (values.limit && values.limit !== '12') params.limit = values.limit;
    return params;
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchParams(buildParams({ ...filters, page: '1' }));
  };

  const handleClear = () => {
    setFilters({
      q: '',
      category: '',
      level: '',
      format: '',
      minCredits: '',
      maxCredits: '',
      dayAvailable: '',
      sortBy: 'recent',
      page: '1',
      limit: '12',
    });
    setSearchParams({});
  };

  const handlePageChange = (nextPage) => {
    const nextFilters = { ...filters, page: String(nextPage) };
    setSearchParams(buildParams(nextFilters));
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='mb-8'>
          <h1 className='text-3xl font-semibold mb-2'>Explore skill listings</h1>
          <p className='text-gray-600'>Search available skill exchange offerings by keyword, category, day, and credit range.</p>
        </div>

        <div className='grid gap-6 lg:grid-cols-[320px_1fr]'>
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
                <select value={filters.category} onChange={handleChange('category')} className='w-full border rounded px-3 py-2'>
                  <option value=''>Any category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
              <div>
                <label className='block text-sm text-gray-700 mb-1'>Available day</label>
                <select value={filters.dayAvailable} onChange={handleChange('dayAvailable')} className='w-full border rounded px-3 py-2'>
                  <option value=''>Any day</option>
                  <option value='monday'>Monday</option>
                  <option value='tuesday'>Tuesday</option>
                  <option value='wednesday'>Wednesday</option>
                  <option value='thursday'>Thursday</option>
                  <option value='friday'>Friday</option>
                  <option value='saturday'>Saturday</option>
                  <option value='sunday'>Sunday</option>
                </select>
              </div>
              <div>
                <label className='block text-sm text-gray-700 mb-1'>Sort by</label>
                <select value={filters.sortBy} onChange={handleChange('sortBy')} className='w-full border rounded px-3 py-2'>
                  <option value='recent'>Most recent</option>
                  <option value='credits_asc'>Credits (low to high)</option>
                  <option value='credits_desc'>Credits (high to low)</option>
                  <option value='rating_desc'>Highest rated</option>
                  <option value='title_asc'>Title (A–Z)</option>
                </select>
              </div>
              <div className='flex gap-3'>
                <button type='submit' className='flex-1 bg-green-600 text-white rounded-full px-4 py-3 hover:bg-green-700'>Apply filters</button>
                <button type='button' onClick={handleClear} className='flex-1 border border-gray-300 rounded-full px-4 py-3 hover:bg-gray-100'>Clear</button>
              </div>
            </form>
          </aside>

          <main>
            <div className='flex items-center justify-between mb-4'>
              <p className='text-sm text-gray-600'>Showing {meta.totalResults} listing{meta.totalResults === 1 ? '' : 's'}</p>
              <div className='text-sm text-gray-500'>Page {meta.page} of {meta.totalPages}</div>
            </div>

            {loading ? (
              <div className='grid gap-6 md:grid-cols-2'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className='bg-white rounded-3xl p-5 shadow-sm animate-pulse'>
                    <div className='h-4 bg-gray-200 rounded w-20 mb-4' />
                    <div className='h-6 bg-gray-200 rounded w-3/4 mb-3' />
                    <div className='h-4 bg-gray-200 rounded w-full mb-2' />
                    <div className='h-4 bg-gray-200 rounded w-5/6 mb-4' />
                    <div className='h-10 bg-gray-200 rounded-full' />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className='grid gap-6 md:grid-cols-2'>
                  {listings.map((listing) => (
                    <SkillCard key={listing._id} listing={listing} />
                  ))}
                </div>
                {meta.totalPages > 1 && (
                  <div className='flex justify-center gap-3 mt-6'>
                    <button
                      type='button'
                      onClick={() => handlePageChange(meta.page - 1)}
                      disabled={meta.page <= 1}
                      className='rounded-full border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Previous
                    </button>
                    <button
                      type='button'
                      onClick={() => handlePageChange(meta.page + 1)}
                      disabled={meta.page >= meta.totalPages}
                      className='rounded-full border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className='bg-white rounded-3xl p-10 text-center text-gray-600 shadow-sm'>No listings matched your search. Try widening your filters.</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
