// Small feature card used on the Dokkhota homepage
const FeatureCard = ({ title, description }) => {
  return (
    <div className='bg-white rounded-3xl p-6 shadow-sm'>
      <h3 className='text-xl font-semibold mb-2'>{title}</h3>
      <p className='text-gray-600'>{description}</p>
    </div>
  );
};

export default FeatureCard;
