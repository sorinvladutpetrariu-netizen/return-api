import { pgTable, text, varchar, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  email_verified: boolean('email_verified').default(false).notNull(),
  verification_token: varchar('verification_token', { length: 255 }),
  verification_token_expires: timestamp('verification_token_expires'),
  reset_token: varchar('reset_token', { length: 255 }),
  reset_token_expires: timestamp('reset_token_expires'),
  social_provider: varchar('social_provider', { length: 50 }),
  social_id: varchar('social_id', { length: 255 }),
  timezone: varchar('timezone', { length: 64 }).default('UTC').notNull(),
  interests: text('interests').default('[]').notNull(),
  founding_member: boolean('founding_member').default(false).notNull(),
  founding_discount_percent: integer('founding_discount_percent').default(0).notNull(),
});

// Articles table
export const articles = pgTable('articles', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  price: integer('price').notNull(), // in cents
  category: varchar('category', { length: 100 }).notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Books table
export const books = pgTable('books', {
  id: varchar('id', { length: 50 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  price: integer('price').notNull(), // in cents
  category: varchar('category', { length: 100 }).notNull(),
  cover_url: varchar('cover_url', { length: 500 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quotes table
export const quotes = pgTable('quotes', {
  id: varchar('id', { length: 50 }).primaryKey(),
  text: text('text').notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  date_scheduled: varchar('date_scheduled', { length: 10 }).notNull(),
});

// Purchases table
export const purchases = pgTable('purchases', {
  id: varchar('id', { length: 50 }).primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(),
  article_id: varchar('article_id', { length: 50 }),
  book_id: varchar('book_id', { length: 50 }),
  amount: integer('amount').notNull(), // in cents
  created_at: timestamp('created_at').defaultNow().notNull(),
  stripe_payment_id: varchar('stripe_payment_id', { length: 255 }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.user_id],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [purchases.article_id],
    references: [articles.id],
  }),
  book: one(books, {
    fields: [purchases.book_id],
    references: [books.id],
  }),
}));
// ==================== RETURN (V1) ====================

export const dailyPractices = pgTable('daily_practices', {
  id: varchar('id', { length: 50 }).primaryKey(),
  date: varchar('date', { length: 10 }).notNull().unique(),
  orientation_text: text('orientation_text').notNull(),
  orientation_author: varchar('orientation_author', { length: 255 }).notNull(),
  insight_text: text('insight_text').notNull(),
  reflection_prompt: text('reflection_prompt').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const returns = pgTable('returns', {
  id: varchar('id', { length: 50 }).primaryKey(),
  user_id: varchar('user_id', { length: 50 }).notNull(),
  practice_date: varchar('practice_date', { length: 10 }).notNull(),
  reflection_text: text('reflection_text').notNull(),
  commitment_text: text('commitment_text').notNull(),
  is_public: boolean('is_public').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  deleted_at: timestamp('deleted_at'),
  delete_allowed_until: timestamp('delete_allowed_until').notNull(),
});

export const returnFollowups = pgTable('return_followups', {
  id: varchar('id', { length: 50 }).primaryKey(),
  return_id: varchar('return_id', { length: 50 }).notNull(),
  note_text: text('note_text').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const returnReactions = pgTable('return_reactions', {
  id: varchar('id', { length: 50 }).primaryKey(),
  return_id: varchar('return_id', { length: 50 }).notNull(),
  user_id: varchar('user_id', { length: 50 }).notNull(),
  reaction_type: varchar('reaction_type', { length: 20 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  user_id: varchar('user_id', { length: 50 }).primaryKey(),
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(),
  plan: varchar('plan', { length: 50 }).notNull(),
  current_period_end: timestamp('current_period_end'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});