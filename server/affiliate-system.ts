import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'wisdom_hub',
});

const router = express.Router();

/**
 * POST /affiliates/register
 * Register a new affiliate
 */
router.post('/affiliates/register', async (req: Request, res: Response) => {
  try {
    const { user_id, commission_rate = 20 } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate unique affiliate code
    const affiliateCode = `AFF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Check if user already has affiliate account
    const existingAffiliate = await pool.query('SELECT * FROM affiliates WHERE user_id = $1', [
      user_id,
    ]);

    if (existingAffiliate.rows.length > 0) {
      return res.status(409).json({ error: 'User already has an affiliate account' });
    }

    // Create affiliate account
    const result = await pool.query(
      `INSERT INTO affiliates (user_id, affiliate_code, commission_rate, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, affiliate_code, commission_rate, status, created_at`,
      [user_id, affiliateCode, commission_rate, 'pending']
    );

    const affiliate = result.rows[0];

    res.status(201).json({
      message: 'Affiliate account created',
      affiliate: {
        id: affiliate.id,
        affiliateCode: affiliate.affiliate_code,
        commissionRate: affiliate.commission_rate,
        status: affiliate.status,
        createdAt: affiliate.created_at,
      },
    });
  } catch (error) {
    console.error('Affiliate registration error:', error);
    res.status(500).json({ error: 'Failed to register affiliate' });
  }
});

/**
 * GET /affiliates/:affiliateCode/stats
 * Get affiliate statistics and earnings
 */
router.get('/affiliates/:affiliateCode/stats', async (req: Request, res: Response) => {
  try {
    const { affiliateCode } = req.params;

    // Get affiliate info
    const affiliateResult = await pool.query(
      `SELECT a.id, a.user_id, a.affiliate_code, a.commission_rate, a.status, u.name, u.email
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       WHERE a.affiliate_code = $1`,
      [affiliateCode]
    );

    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    const affiliate = affiliateResult.rows[0];

    // Get commission statistics
    const statsResult = await pool.query(
      `SELECT 
        COUNT(c.id) as total_commissions,
        SUM(c.amount) as total_earnings,
        SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END) as pending_earnings,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as paid_earnings
       FROM commissions c
       WHERE c.affiliate_id = $1`,
      [affiliate.id]
    );

    const stats = statsResult.rows[0];

    // Get recent sales
    const salesResult = await pool.query(
      `SELECT p.id, p.price, p.created_at, 
        CASE 
          WHEN p.article_id IS NOT NULL THEN 'Article'
          WHEN p.book_id IS NOT NULL THEN 'Book'
          WHEN p.course_id IS NOT NULL THEN 'Course'
        END as product_type
       FROM purchases p
       JOIN commissions c ON p.id = c.purchase_id
       WHERE c.affiliate_id = $1
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [affiliate.id]
    );

    res.json({
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        affiliateCode: affiliate.affiliate_code,
        commissionRate: affiliate.commission_rate,
        status: affiliate.status,
      },
      statistics: {
        totalCommissions: parseInt(stats.total_commissions),
        totalEarnings: parseFloat(stats.total_earnings || 0),
        pendingEarnings: parseFloat(stats.pending_earnings || 0),
        paidEarnings: parseFloat(stats.paid_earnings || 0),
      },
      recentSales: salesResult.rows,
    });
  } catch (error) {
    console.error('Get affiliate stats error:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate statistics' });
  }
});

/**
 * GET /affiliates/:affiliateCode/referral-link
 * Get referral link for affiliate
 */
router.get('/affiliates/:affiliateCode/referral-link', async (req: Request, res: Response) => {
  try {
    const { affiliateCode } = req.params;
    const appUrl = process.env.APP_FRONTEND_URL || 'https://wisdomhub.app';

    // Verify affiliate exists
    const affiliateResult = await pool.query(
      'SELECT id FROM affiliates WHERE affiliate_code = $1',
      [affiliateCode]
    );

    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    const referralLink = `${appUrl}?ref=${affiliateCode}`;

    res.json({
      referralLink,
      affiliateCode,
      shareText: `Join me on Wisdom Hub and get exclusive insights on personal development! Use my referral link: ${referralLink}`,
    });
  } catch (error) {
    console.error('Get referral link error:', error);
    res.status(500).json({ error: 'Failed to generate referral link' });
  }
});

/**
 * POST /affiliates/approve
 * Admin: Approve affiliate application
 */
router.post('/affiliates/approve', async (req: Request, res: Response) => {
  try {
    const { affiliate_id, admin_id } = req.body;

    if (!affiliate_id || !admin_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify admin (implement proper admin check)
    const result = await pool.query(
      `UPDATE affiliates 
       SET status = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, approved_at`,
      ['approved', affiliate_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, resource_type, resource_id)
       VALUES ($1, $2, $3, $4)`,
      [admin_id, 'approve_affiliate', 'affiliate', affiliate_id]
    );

    res.json({
      message: 'Affiliate approved',
      affiliate: result.rows[0],
    });
  } catch (error) {
    console.error('Approve affiliate error:', error);
    res.status(500).json({ error: 'Failed to approve affiliate' });
  }
});

/**
 * POST /affiliates/reject
 * Admin: Reject affiliate application
 */
router.post('/affiliates/reject', async (req: Request, res: Response) => {
  try {
    const { affiliate_id, admin_id, reason } = req.body;

    if (!affiliate_id || !admin_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update affiliate status
    const result = await pool.query(
      `UPDATE affiliates 
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      ['rejected', affiliate_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, resource_type, resource_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [admin_id, 'reject_affiliate', 'affiliate', affiliate_id, reason || '']
    );

    res.json({
      message: 'Affiliate rejected',
      affiliate: result.rows[0],
    });
  } catch (error) {
    console.error('Reject affiliate error:', error);
    res.status(500).json({ error: 'Failed to reject affiliate' });
  }
});

/**
 * GET /affiliates/pending
 * Admin: Get pending affiliate applications
 */
router.get('/affiliates/pending', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.affiliate_code, a.commission_rate, a.status, a.created_at, u.name, u.email
       FROM affiliates a
       JOIN users u ON a.user_id = u.id
       WHERE a.status = 'pending'
       ORDER BY a.created_at ASC`
    );

    res.json({
      pendingAffiliates: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get pending affiliates error:', error);
    res.status(500).json({ error: 'Failed to fetch pending affiliates' });
  }
});

export default router;
