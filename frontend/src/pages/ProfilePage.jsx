// Public profile page for Dokkhota showing user information and skills offered
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import userService from '../services/userService.js';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await userService.getProfile(userId);
        setProfile(response.data.user);
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  if (loading) {
    return <div className='max-w-6xl mx-auto px-4 py-10'>Loading profile...</div>;
  }

  if (!profile) {
    return <div className='max-w-6xl mx-auto px-4 py-10'>Profile not found.</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='bg-white p-8 rounded-3xl shadow-sm'>
          <div className='flex items-center justify-between gap-4 mb-6'>
            <div>
              <h1 className='text-3xl font-semibold'>{profile.name}</h1>
              <p className='text-gray-600'>{profile.city || 'Unknown city'}</p>
            </div>
            {isAuthenticated && currentUser?.id === userId && (
              <Link to='/profile/edit' className='bg-green-600 text-white rounded-full px-5 py-3 hover:bg-green-700'>Edit profile</Link>
            )}
          </div>
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='w-full md:w-1/3'>
              <div className='bg-gray-100 rounded-3xl p-6 text-center'>
                <div className='text-4xl font-bold text-green-700 mb-4'>{profile.name?.charAt(0)}</div>
                <h2 className='text-2xl font-semibold'>{profile.name}</h2>
                <p className='text-gray-600'>{profile.city || 'Unknown city'}</p>
              </div>
            </div>
            <div className='w-full md:w-2/3'>
              <h2 className='text-2xl font-semibold mb-3'>About</h2>
              <p className='text-gray-700 mb-4'>{profile.bio || 'No bio available yet.'}</p>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='bg-slate-50 rounded-3xl p-5'>
                  <span className='block text-sm text-gray-500'>Credits</span>
                  <span className='text-xl font-semibold'>{profile.creditBalance}</span>
                </div>
                <div className='bg-slate-50 rounded-3xl p-5'>
                  <span className='block text-sm text-gray-500'>Languages</span>
                  <span className='text-lg'>{profile.languages?.join(', ') || 'None'}</span>
                </div>
                <div className='bg-slate-50 rounded-3xl p-5'>
                  <span className='block text-sm text-gray-500'>Skills offered</span>
                  <span className='text-lg'>{profile.skillsOffered?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8 bg-white rounded-3xl p-8 shadow-sm'>
          <h3 className='text-xl font-semibold mb-4'>Skills Offered</h3>
          {profile.skillsOffered?.length > 0 ? (
            <div className='grid gap-4'>
              {profile.skillsOffered.map((skill, index) => (
                <div key={index} className='border rounded-3xl p-5'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-semibold'>{skill.title}</span>
                    <span className='text-sm text-gray-500'>{skill.category}</span>
                  </div>
                  <p className='text-gray-600'>{skill.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-600'>No skills offered yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
