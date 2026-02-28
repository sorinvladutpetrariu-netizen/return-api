import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './db/index';
import { articles, books, quotes } from './db/schema';

const today = new Date().toISOString().split('T')[0];

const SEED_BOOKS = [
  {
    id: 'book_seed_001',
    title: 'The Power of Now',
    description: 'A guide to spiritual enlightenment and living fully in the present moment.',
    author: 'Eckhart Tolle',
    price: 1299,
    category: 'Mindset',
    cover_url: null,
  },
  {
    id: 'book_seed_002',
    title: 'Atomic Habits',
    description: 'An easy and proven way to build good habits and break bad ones.',
    author: 'James Clear',
    price: 1499,
    category: 'Habits',
    cover_url: null,
  },
  {
    id: 'book_seed_003',
    title: 'Meditations',
    description: 'The timeless Stoic reflections of Marcus Aurelius on discipline and virtue.',
    author: 'Marcus Aurelius',
    price: 999,
    category: 'Philosophy',
    cover_url: null,
  },
  {
    id: 'book_seed_004',
    title: 'Dare to Lead',
    description: 'Brave work, tough conversations, and whole hearts — a guide to courageous leadership.',
    author: 'Brené Brown',
    price: 1399,
    category: 'Leadership',
    cover_url: null,
  },
  {
    id: 'book_seed_005',
    title: 'The Untethered Soul',
    description: 'A journey beyond yourself into consciousness and inner freedom.',
    author: 'Michael A. Singer',
    price: 1199,
    category: 'Consciousness',
    cover_url: null,
  },
];

const SEED_ARTICLES = [
  {
    id: 'article_seed_001',
    title: 'The Science of Building Resilience',
    description: 'How to develop mental toughness and bounce back from adversity.',
    content:
      'Resilience is not a trait people either have or do not have. It involves behaviors, thoughts, and actions that anyone can learn and develop. In this article we explore evidence-based strategies to strengthen your capacity to recover from difficulties...',
    price: 299,
    category: 'Resilience',
    author: 'Dr. Angela Lee',
  },
  {
    id: 'article_seed_002',
    title: 'Morning Meditation for Beginners',
    description: 'A practical guide to starting a sustainable daily meditation practice.',
    content:
      'Starting a meditation practice can feel daunting, but the benefits are well-documented. This guide breaks it down into five minutes a day to build consistency and calm...',
    price: 199,
    category: 'Meditation',
    author: 'Sarah Chen',
  },
  {
    id: 'article_seed_003',
    title: 'Growth Mindset at Work',
    description: 'Transform how you approach challenges and failure in your professional life.',
    content:
      "Carol Dweck's research on mindset has revolutionized how we think about talent and achievement. Here we apply growth mindset principles specifically to the workplace...",
    price: 349,
    category: 'Growth',
    author: 'Marcus Reid',
  },
  {
    id: 'article_seed_004',
    title: 'The Psychology of Self-Discipline',
    description: 'Understanding and strengthening your willpower through psychological science.',
    content:
      'Self-discipline is one of the strongest predictors of success across life domains. But willpower is not a fixed resource — it is a skill that can be trained systematically...',
    price: 299,
    category: 'Psychology',
    author: 'Dr. Emily Hartman',
  },
  {
    id: 'article_seed_005',
    title: 'Authentic Relationships: The Foundation of Wellbeing',
    description: 'Why deep, genuine connections matter more than the number of relationships you have.',
    content:
      "Decades of research from Harvard's Study of Adult Development confirm that the quality of our relationships is the single greatest predictor of health and happiness. Here is how to cultivate authenticity in every connection...",
    price: 249,
    category: 'Relationships',
    author: 'Dr. Robert Waldinger',
  },
];

const SEED_QUOTES = [
  {
    id: 'quote_seed_001',
    text: 'The present moment is the only moment available to us, and it is the door to all moments.',
    author: 'Thich Nhat Hanh',
    source: 'The Miracle of Mindfulness',
    category: 'Meditation',
    date_scheduled: today,
  },
  {
    id: 'quote_seed_002',
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    source: 'Atomic Habits',
    category: 'Habits',
    date_scheduled: '2026-03-01',
  },
  {
    id: 'quote_seed_003',
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius',
    source: 'Meditations',
    category: 'Philosophy',
    date_scheduled: '2026-03-02',
  },
  {
    id: 'quote_seed_004',
    text: 'Vulnerability is not winning or losing; it is having the courage to show up and be seen.',
    author: 'Brené Brown',
    source: 'Daring Greatly',
    category: 'Authenticity',
    date_scheduled: '2026-03-03',
  },
  {
    id: 'quote_seed_005',
    text: 'Growth is painful. Change is painful. But nothing is as painful as staying stuck where you do not belong.',
    author: 'N. R. Narayana Murthy',
    source: '',
    category: 'Growth',
    date_scheduled: '2026-03-04',
  },
  {
    id: 'quote_seed_006',
    text: 'The quality of your life is determined by the quality of your relationships.',
    author: 'Tony Robbins',
    source: '',
    category: 'Relationships',
    date_scheduled: '2026-03-05',
  },
  {
    id: 'quote_seed_007',
    text: 'Knowing yourself is the beginning of all wisdom.',
    author: 'Aristotle',
    source: '',
    category: 'Mindset',
    date_scheduled: '2026-03-06',
  },
];

async function seed() {
  console.log('🌱 Starting seed...');

  let booksInserted = 0;
  for (const book of SEED_BOOKS) {
    const existing = await db.select().from(books).where(eq(books.id, book.id));
    if (existing.length === 0) {
      await db.insert(books).values(book);
      booksInserted++;
      console.log(`  ✅ Book inserted: ${book.title}`);
    } else {
      console.log(`  ⏭️  Book already exists: ${book.title}`);
    }
  }

  let articlesInserted = 0;
  for (const article of SEED_ARTICLES) {
    const existing = await db.select().from(articles).where(eq(articles.id, article.id));
    if (existing.length === 0) {
      await db.insert(articles).values(article);
      articlesInserted++;
      console.log(`  ✅ Article inserted: ${article.title}`);
    } else {
      console.log(`  ⏭️  Article already exists: ${article.title}`);
    }
  }

  let quotesInserted = 0;
  for (const quote of SEED_QUOTES) {
    const existing = await db.select().from(quotes).where(eq(quotes.id, quote.id));
    if (existing.length === 0) {
      await db.insert(quotes).values(quote);
      quotesInserted++;
      console.log(`  ✅ Quote inserted: "${quote.text.substring(0, 50)}..."`);
    } else {
      console.log(`  ⏭️  Quote already exists: ${quote.id}`);
    }
  }

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Books:    ${booksInserted} inserted`);
  console.log(`   Articles: ${articlesInserted} inserted`);
  console.log(`   Quotes:   ${quotesInserted} inserted`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
