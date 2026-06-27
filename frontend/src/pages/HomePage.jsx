// Home page for Dokkhota featuring quick actions, search, and highlights
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import skillService from '../services/skillService.js';
import SkillCard from '../components/SkillCard.jsx';

const HomePage = () => {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await skillService.searchListings({});
        setListings(response.data.listings || []);
      } catch (error) {
        setListings([]);
      }
    };
    loadListings();
  }, []);

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <section className='bg-white rounded-3xl shadow-lg p-10 mb-10'>
          <h1 className='text-4xl font-bold text-green-800 mb-4'>Learn a skill, earn credits, teach the community.</h1>
          <p className='text-gray-600 mb-6'>Dokkhota connects learners and providers for skill exchange using virtual Skill Credits.</p>
          <div className='flex flex-col md:flex-row gap-4'>
            <input
              type='search'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search skills, categories, or teachers'
              className='flex-1 border rounded-full px-5 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300'
            />
            <Link to={`/explore?q=${encodeURIComponent(search)}`} className='bg-green-600 text-white rounded-full px-8 py-3 font-semibold hover:bg-green-700'>
              Explore skills
            </Link>
          </div>
        </section>

        <section className='mb-10'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-2xl font-semibold'>Featured skill listings</h2>
              <p className='text-gray-600'>Popular exchanges from verified providers.</p>
            </div>
            <Link to='/explore' className='text-green-700 hover:underline'>See all</Link>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {listings.length > 0 ? (
              listings.map((listing) => <SkillCard key={listing._id} listing={listing} />)
            ) : (
              <div className='col-span-3 text-center text-gray-600'>No active listings available yet.</div>
            )}
          </div>
        </section>

        <section className='bg-green-600 text-white rounded-3xl p-10'>
          <div className='grid gap-6 md:grid-cols-3'>
            <div>
              <h3 className='text-xl font-semibold'>Skill profile creation</h3>
              <p>Build your skill profile with bio, experience, and availability.</p>
            </div>
            <div>
              <h3 className='text-xl font-semibold'>Listing creation</h3>
              <p>Create skill listings with category, level, mode, credits, and availability.</p>
            </div>
            <div>
              <h3 className='text-xl font-semibold'>Starter credits</h3>
              <p>Every new user starts with 10 Skill Credits to book their first session.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
