// Profile editing page for Dokkhota users to update their bio and skills offered
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import userService from '../services/userService.js';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    city: '',
    bio: '',
    languages: '',
    skillsOffered: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        city: user.city || '',
        bio: user.bio || '',
        languages: (user.languages || []).join(', '),
        skillsOffered: (user.skillsOffered || []).map((skill) => `${skill.title} (${skill.category})`).join(', '),
      });
    }
  }, [user]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!accessToken) {
      setError('You must be logged in to edit your profile.');
      return;
    }

    try {
      const profilePayload = {
        name: form.name,
        city: form.city,
        bio: form.bio,
        languages: form.languages,
      };
      const skillsPayload = form.skillsOffered
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const match = item.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            return { title: match[1].trim(), category: match[2].trim(), description: '' };
          }
          return { title: item, category: 'General', description: '' };
        });

      await userService.updateProfile(profilePayload, accessToken);
      await userService.updateSkillsOffered(skillsPayload, accessToken);
      setSuccess('Profile updated successfully');
      const updatedUser = { ...user, ...profilePayload, languages: form.languages.split(',').map((l) => l.trim()).filter(Boolean), skillsOffered: skillsPayload };
      setUser(updatedUser);
      navigate(`/profile/${user.id || user._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    }
  };

  if (!isAuthenticated) {
    return <div className='max-w-4xl mx-auto px-4 py-10'>You need to log in to edit your profile.</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-4xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl shadow-sm p-8'>
          <h1 className='text-3xl font-semibold mb-4'>Edit Profile</h1>
          {error && <div className='text-red-600 mb-4'>{error}</div>}
          {success && <div className='text-green-600 mb-4'>{success}</div>}
          <form className='space-y-4' onSubmit={handleSubmit}>
            <div>
              <label className='block mb-1 font-medium'>Full Name</label>
              <input value={form.name} onChange={handleChange('name')} className='w-full border rounded px-4 py-3' required />
            </div>
            <div>
              <label className='block mb-1 font-medium'>City</label>
              <input value={form.city} onChange={handleChange('city')} className='w-full border rounded px-4 py-3' />
            </div>
            <div>
              <label className='block mb-1 font-medium'>Bio</label>
              <textarea value={form.bio} onChange={handleChange('bio')} className='w-full border rounded px-4 py-3' rows={4} />
            </div>
            <div>
              <label className='block mb-1 font-medium'>Languages (comma separated)</label>
              <input value={form.languages} onChange={handleChange('languages')} className='w-full border rounded px-4 py-3' />
            </div>
            <div>
              <label className='block mb-1 font-medium'>Skills Offered (e.g. JavaScript (Programming), Graphic Design (Creative))</label>
              <textarea value={form.skillsOffered} onChange={handleChange('skillsOffered')} className='w-full border rounded px-4 py-3' rows={4} />
            </div>
            <button type='submit' className='bg-green-600 text-white rounded-full px-6 py-3 hover:bg-green-700'>Save profile</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
