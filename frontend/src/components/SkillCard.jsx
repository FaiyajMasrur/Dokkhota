// Skill card component for Dokkhota listing previews
import { Link } from 'react-router-dom';

const SkillCard = ({ listing }) => {
  return (
    <div className='border rounded-xl p-5 shadow-sm hover:shadow-md transition'>
      <div className='flex items-center justify-between mb-3'>
        <span className='text-sm text-gray-500'>{listing.category}</span>
        <span className='text-sm font-semibold text-green-700'>{listing.format}</span>
      </div>
      <h3 className='text-xl font-semibold mb-2'>{listing.title}</h3>
      <p className='text-sm text-gray-600 mb-3'>{listing.description}</p>
      <div className='flex flex-wrap gap-2 mb-4'>
        {listing.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className='text-xs bg-gray-100 rounded-full px-3 py-1 text-gray-700'>
            {tag}
          </span>
        ))}
      </div>
      <div className='flex items-center justify-between'>
        <span className='text-lg font-bold'>{listing.creditCost} SC</span>
        <Link
          to={`/listing/${listing._id}`}
          className='text-green-700 hover:text-green-900 font-medium'
        >
          View
        </Link>
      </div>
    </div>
  );
};

export default SkillCard;
