// Seed initial category data for Dokkhota
const Category = require('./models/Category');

const defaultCategories = [
  'Music',
  'Programming',
  'Design',
  'Art & Craft',
  'Languages',
  'Business',
  'Marketing',
  'Photography',
  'Health & Fitness',
  'Cooking',
  'Mathematics',
  'Science',
  'Writing',
  'Career & Interview',
  'Finance',
  'Personal Development',
  'Teaching & Tutoring',
  'Technology',
  'Hobbies',
  'DIY',
];

const seedCategories = async () => {
  const count = await Category.countDocuments();
  if (count > 0) return;
  const docs = defaultCategories.map((name) => ({ name }));
  await Category.insertMany(docs);
  console.log('Seeded default categories');
};

module.exports = { seedCategories };
