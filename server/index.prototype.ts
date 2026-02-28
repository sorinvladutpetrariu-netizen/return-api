import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware
app.use(cors());
app.use(express.json());

// Auth types
interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; interests: string[] };
}

// Verify JWT token
const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name: string;
      interests: string[];
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// All 17 interests
const ALL_INTERESTS = [
  "Mindset",
  "Consciousness",
  "Discipline",
  "Growth",
  "Spiritual Development",
  "Psychology",
  "Self-Improvement",
  "Meditation",
  "Philosophy",
  "Wellness",
  "Motivation",
  "Leadership",
  "Relationships",
  "Habits",
  "Resilience",
  "Authenticity",
  "Intuition",
];

// In-memory storage (replace with database in production)
const wishlistData: Record<string, string[]> = {};
const reviewsData: Record<string, any[]> = {};
const communityPosts: any[] = [];
const supportMessages: Record<string, any[]> = {};
const userLanguages: Record<string, string> = {};
const purchaseHistory: Record<string, any[]> = {};

// Auth endpoints
app.post("/auth/signup", (req: Request, res: Response) => {
  const { email, password, name, interests } = req.body;
  const selectedInterests = interests || ALL_INTERESTS.slice(0, 3);
  const token = jwt.sign(
    { id: "user-1", email, name, interests: selectedInterests },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: { id: "user-1", email, name, interests: selectedInterests },
  });
});

app.post("/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  const token = jwt.sign(
    {
      id: "user-1",
      email,
      name: "Test User",
      interests: ALL_INTERESTS.slice(0, 3),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: {
      id: "user-1",
      email,
      name: "Test User",
      interests: ALL_INTERESTS.slice(0, 3),
    },
  });
});

// Get all interests
app.get("/interests", (req: Request, res: Response) => {
  res.json({ interests: ALL_INTERESTS });
});

// Quote of the day endpoint
app.get("/quotes/today", (req: Request, res: Response) => {
  const quote = {
    id: "quote-1",
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    source: "Stanford Speech",
    category: "Motivation",
    date_scheduled: new Date().toISOString().split("T")[0],
  };
  res.json({ quote });
});

// Books endpoint - NO AUTH REQUIRED
app.get("/books", async (req: Request, res: Response) => {
  const books = [
    {
      id: "book-1",
      title: "Open The Eye",
      author: "Petrariu Sorin Vladut",
      description:
        "Awaken Your Mind. Take Responsibility. Live Consciously. A deep exploration of awareness, truth, responsibility, and personal freedom.",
      price: 8.5,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/dlptcjoetENMkQTV.png",
      category: "Self-Help",
      language: "English",
      interests: ["Consciousness", "Mindset", "Philosophy"],
      created_at: "2026-01-15",
      purchased: false,
    },
    {
      id: "book-2",
      title: "Rebuild Yourself",
      author: "Petrariu Sorin Vladut",
      description:
        "Breaking the Past, Mastering Your Mind, and Becoming the Person You Are Capable of Being. A practical guide to mental reconstruction and personal transformation.",
      price: 12,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/mFsbkcmmwSynsVhO.png",
      category: "Self-Help",
      language: "English",
      interests: ["Growth", "Psychology", "Self-Improvement"],
      created_at: "2026-01-20",
      purchased: false,
    },
    {
      id: "book-3",
      title: "Deschide Ochiul",
      author: "Petrariu Sorin Vladut",
      description:
        "O carte a clarității, nu a confortului. Explorează modul în care se formează convingerile, cum distragerea înlocuiește gândirea și cum responsabilitatea restabilește controlul.",
      price: 8.5,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/CzbSHdTShLNyJOCb.png",
      category: "Self-Help",
      language: "Romanian",
      interests: ["Consciousness", "Discipline", "Authenticity"],
      created_at: "2026-01-25",
      purchased: false,
    },
    {
      id: "book-4",
      title: "Reconstruiește-te",
      author: "Petrariu Sorin Vladut",
      description:
        "O carte despre restructurarea interioară profundă. Cum se formează identitatea, cum se instalează tiparele mentale și de ce majoritatea oamenilor rămân blocați.",
      price: 12,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/acJggGqmPkHUmuNy.png",
      category: "Self-Help",
      language: "Romanian",
      interests: ["Habits", "Resilience", "Self-Improvement"],
      created_at: "2026-02-01",
      purchased: false,
    },
  ];
  res.json({ books });
});

// Articles endpoint - NO AUTH REQUIRED
app.get("/articles", async (req: Request, res: Response) => {
  const category = req.query.category || "All";

  const articles = [
    {
      id: "article-1",
      title: "The Power of Mindset",
      author: "Petrariu Sorin Vladut",
      excerpt:
        "Understanding how your mindset shapes your reality and personal growth.",
      category: "Mindset",
      interests: ["Mindset", "Psychology"],
      image: "https://via.placeholder.com/300x200?text=Mindset",
      date: "2026-02-20",
      read_time: "5 min",
    },
    {
      id: "article-2",
      title: "Consciousness and Awareness",
      author: "Petrariu Sorin Vladut",
      excerpt:
        "Exploring the depths of consciousness and how awareness transforms life.",
      category: "Consciousness",
      interests: ["Consciousness", "Meditation", "Philosophy"],
      image: "https://via.placeholder.com/300x200?text=Consciousness",
      date: "2026-02-18",
      read_time: "7 min",
    },
    {
      id: "article-3",
      title: "Building Discipline",
      author: "Petrariu Sorin Vladut",
      excerpt:
        "How discipline becomes the foundation for personal freedom and success.",
      category: "Discipline",
      interests: ["Discipline", "Habits", "Growth"],
      image: "https://via.placeholder.com/300x200?text=Discipline",
      date: "2026-02-15",
      read_time: "6 min",
    },
    {
      id: "article-4",
      title: "Growth Through Challenges",
      author: "Petrariu Sorin Vladut",
      excerpt:
        "Why challenges are essential for personal growth and transformation.",
      category: "Growth",
      interests: ["Growth", "Resilience", "Motivation"],
      image: "https://via.placeholder.com/300x200?text=Growth",
      date: "2026-02-12",
      read_time: "8 min",
    },
    {
      id: "article-5",
      title: "Spiritual Development Path",
      author: "Petrariu Sorin Vladut",
      excerpt: "A guide to spiritual awakening and inner transformation.",
      category: "Spiritual Development",
      interests: ["Spiritual Development", "Meditation", "Intuition"],
      image: "https://via.placeholder.com/300x200?text=Spiritual",
      date: "2026-02-10",
      read_time: "9 min",
    },
  ];

  if (category !== "All") {
    const filtered = articles.filter((a) => a.category === category);
    return res.json({ articles: filtered });
  }

  res.json({ articles });
});

// Recommendations endpoint - WITH AUTH
app.get("/recommendations", verifyToken, async (req: AuthRequest, res: Response) => {
  const userInterests = req.user?.interests || [];

  const allBooks = [
    {
      id: "book-1",
      title: "Open The Eye",
      author: "Petrariu Sorin Vladut",
      description:
        "Awaken Your Mind. Take Responsibility. Live Consciously. A deep exploration of awareness, truth, responsibility, and personal freedom.",
      price: 8.5,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/dlptcjoetENMkQTV.png",
      category: "Self-Help",
      language: "English",
      interests: ["Consciousness", "Mindset", "Philosophy"],
      created_at: "2026-01-15",
      purchased: false,
    },
    {
      id: "book-2",
      title: "Rebuild Yourself",
      author: "Petrariu Sorin Vladut",
      description:
        "Breaking the Past, Mastering Your Mind, and Becoming the Person You Are Capable of Being. A practical guide to mental reconstruction and personal transformation.",
      price: 12,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/mFsbkcmmwSynsVhO.png",
      category: "Self-Help",
      language: "English",
      interests: ["Growth", "Psychology", "Self-Improvement"],
      created_at: "2026-01-20",
      purchased: false,
    },
    {
      id: "book-3",
      title: "Deschide Ochiul",
      author: "Petrariu Sorin Vladut",
      description:
        "O carte a clarității, nu a confortului. Explorează modul în care se formează convingerile, cum distragerea înlocuiește gândirea și cum responsabilitatea restabilește controlul.",
      price: 8.5,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/CzbSHdTShLNyJOCb.png",
      category: "Self-Help",
      language: "Romanian",
      interests: ["Consciousness", "Discipline", "Authenticity"],
      created_at: "2026-01-25",
      purchased: false,
    },
    {
      id: "book-4",
      title: "Reconstruiește-te",
      author: "Petrariu Sorin Vladut",
      description:
        "O carte despre restructurarea interioară profundă. Cum se formează identitatea, cum se instalează tiparele mentale și de ce majoritatea oamenilor rămân blocați.",
      price: 12,
      cover_url:
        "https://files.manuscdn.com/user_upload_by_module/session_file/310519663381084927/acJggGqmPkHUmuNy.png",
      category: "Self-Help",
      language: "Romanian",
      interests: ["Habits", "Resilience", "Self-Improvement"],
      created_at: "2026-02-01",
      purchased: false,
    },
  ];

  const recommendedBooks = allBooks.filter((book) =>
    book.interests.some((interest) => userInterests.includes(interest))
  );

  res.json({
    recommendations: {
      books: recommendedBooks,
      count: recommendedBooks.length,
      userInterests: userInterests,
    },
  });
});

// ============ NEW ENDPOINTS ============

// WISHLIST ENDPOINTS
app.get("/wishlist", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const userWishlist = wishlistData[userId] || [];
  res.json({ wishlist: userWishlist });
});

app.post("/wishlist/add", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const { bookId } = req.body;
  if (!wishlistData[userId]) {
    wishlistData[userId] = [];
  }
  if (!wishlistData[userId].includes(bookId)) {
    wishlistData[userId].push(bookId);
  }
  res.json({ success: true, wishlist: wishlistData[userId] });
});

app.post("/wishlist/remove", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const { bookId } = req.body;
  if (wishlistData[userId]) {
    wishlistData[userId] = wishlistData[userId].filter((id) => id !== bookId);
  }
  res.json({ success: true, wishlist: wishlistData[userId] || [] });
});

// REVIEWS ENDPOINTS
app.get("/reviews/:bookId", (req: Request, res: Response) => {
  const { bookId } = req.params;
  const bookReviews = reviewsData[bookId] || [];
  const averageRating =
    bookReviews.length > 0
      ? (bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length).toFixed(1)
      : 0;
  res.json({
    reviews: bookReviews,
    averageRating,
    totalReviews: bookReviews.length,
  });
});

app.post("/reviews/:bookId", verifyToken, (req: AuthRequest, res: Response) => {
  const { bookId } = req.params;
  const { rating, comment } = req.body;
  if (!reviewsData[bookId]) {
    reviewsData[bookId] = [];
  }
  const review = {
    id: `review-${Date.now()}`,
    userId: req.user?.id || "user-1",
    userName: req.user?.name || "Anonymous",
    rating,
    comment,
    date: new Date().toISOString(),
  };
  reviewsData[bookId].push(review);
  res.json({ success: true, review });
});

// COMMUNITY ENDPOINTS
app.get("/community/posts", (req: Request, res: Response) => {
  const category = req.query.category || "All";
  let posts = communityPosts;
  if (category !== "All") {
    posts = posts.filter((p) => p.category === category);
  }
  res.json({ posts, total: posts.length });
});

app.post("/community/posts", verifyToken, (req: AuthRequest, res: Response) => {
  const { title, content, category } = req.body;
  const post = {
    id: `post-${Date.now()}`,
    userId: req.user?.id || "user-1",
    userName: req.user?.name || "Anonymous",
    title,
    content,
    category,
    likes: 0,
    replies: 0,
    date: new Date().toISOString(),
  };
  communityPosts.unshift(post);
  res.json({ success: true, post });
});

// SUBSCRIPTIONS ENDPOINTS
app.get("/subscriptions/plans", (req: Request, res: Response) => {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      features: ["Access to 2 books", "Basic articles", "Community access"],
    },
    {
      id: "pro",
      name: "Pro",
      price: 9.99,
      features: ["All books", "Premium articles", "Ad-free experience", "Priority support"],
    },
    {
      id: "premium",
      name: "Premium",
      price: 19.99,
      features: ["All books", "Exclusive content", "Ad-free", "Priority support", "Monthly coaching"],
    },
  ];
  res.json({ plans });
});

app.post("/subscriptions/upgrade", verifyToken, (req: AuthRequest, res: Response) => {
  const { planId } = req.body;
  const userId = req.user?.id || "user-1";
  res.json({
    success: true,
    message: `Upgraded to ${planId} plan`,
    userId,
  });
});

// SUPPORT CHAT ENDPOINTS
app.get("/support/messages", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const messages = supportMessages[userId] || [];
  res.json({ messages });
});

app.post("/support/messages", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const { message } = req.body;
  if (!supportMessages[userId]) {
    supportMessages[userId] = [];
  }
  const userMessage = {
    id: `msg-${Date.now()}`,
    sender: "user",
    text: message,
    timestamp: new Date().toISOString(),
  };
  supportMessages[userId].push(userMessage);

  // Simulate AI response
  const aiResponse = {
    id: `msg-${Date.now() + 1}`,
    sender: "ai",
    text: "Thank you for your message! We're here to help. How can we assist you further?",
    timestamp: new Date().toISOString(),
  };
  supportMessages[userId].push(aiResponse);

  res.json({ success: true, message: userMessage, response: aiResponse });
});

// LANGUAGE SETTINGS ENDPOINTS
app.get("/settings/language", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const language = userLanguages[userId] || "en";
  res.json({ language });
});

app.post("/settings/language", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const { language } = req.body;
  userLanguages[userId] = language;
  res.json({ success: true, language });
});

// PURCHASE HISTORY ENDPOINTS
app.get("/purchases", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const purchases = purchaseHistory[userId] || [];
  res.json({ purchases });
});

app.post("/purchases", verifyToken, (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || "user-1";
  const { bookId, bookTitle, price } = req.body;
  if (!purchaseHistory[userId]) {
    purchaseHistory[userId] = [];
  }
  const purchase = {
    id: `purchase-${Date.now()}`,
    bookId,
    bookTitle,
    price,
    date: new Date().toISOString(),
    downloadUrl: `https://example.com/downloads/${bookId}.pdf`,
  };
  purchaseHistory[userId].push(purchase);
  res.json({ success: true, purchase });
});

// ANALYTICS ENDPOINTS
app.get("/analytics/stats", (req: Request, res: Response) => {
  const stats = {
    totalSales: 15420,
    totalRevenue: 125640,
    totalUsers: 5230,
    activeUsers: 1240,
    averageRating: 4.7,
    topBooks: [
      { id: "book-1", title: "Open The Eye", sales: 3200 },
      { id: "book-2", title: "Rebuild Yourself", sales: 2800 },
      { id: "book-3", title: "Deschide Ochiul", sales: 2400 },
      { id: "book-4", title: "Reconstruiește-te", sales: 2100 },
    ],
  };
  res.json({ stats });
});

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`[api] server listening on port ${PORT}`);
});