// Work Submission and Escrow API
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/work-submissions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'work-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|zip|rar|txt|psd|ai|fig/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

module.exports = (pool) => {
  
  // Submit work (Freelancer)
  router.post('/submit', upload.single('workFile'), async (req, res) => {
    const client = await pool.connect();
    
    try {
      const { projectId, freelancerId, notes } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      
      await client.query('BEGIN');
      
      // Get current submission count
      const countResult = await client.query(
        'SELECT COALESCE(MAX(submission_number), 0) as max_submission FROM work_submissions WHERE project_id = $1',
        [projectId]
      );
      const submissionNumber = countResult.rows[0].max_submission + 1;
      
      // Insert work submission
      const submissionResult = await client.query(
        `INSERT INTO work_submissions (project_id, freelancer_id, submission_number, file_url, file_name, file_size, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
        [projectId, freelancerId, submissionNumber, `/uploads/work-submissions/${file.filename}`, file.originalname, file.size, notes]
      );
      
      // Update project status
      await client.query(
        'UPDATE active_projects SET status = $1, updated_at = NOW() WHERE id = $2',
        ['under_review', projectId]
      );
      
      // Get company ID for notification
      const projectResult = await client.query(
        'SELECT company_id FROM active_projects WHERE id = $1',
        [projectId]
      );
      
      // Create notification for company
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, data, priority)
         VALUES ($1, 'work_submitted', 'Work Submitted', 'A freelancer has submitted work for review', $2, 'high')`,
        [projectResult.rows[0].company_id, JSON.stringify({ projectId, submissionId: submissionResult.rows[0].id })]
      );
      
      await client.query('COMMIT');
      
      res.json({ success: true, submission: submissionResult.rows[0] });
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error submitting work:', err);
      res.status(500).json({ success: false, message: 'Failed to submit work' });
    } finally {
      client.release();
    }
  });
  
  // Get work submissions for a project
  router.get('/project/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      const result = await pool.query(
        `SELECT ws.*, u.username as freelancer_name, wr.review_type, wr.revision_notes
         FROM work_submissions ws
         JOIN users u ON ws.freelancer_id = u.id
         LEFT JOIN work_reviews wr ON ws.id = wr.submission_id
         WHERE ws.project_id = $1
         ORDER BY ws.submission_number DESC`,
        [projectId]
      );
      
      res.json({ success: true, submissions: result.rows });
      
    } catch (err) {
      console.error('Error fetching submissions:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
  });
  
  // Review work (Company)
  router.post('/review', async (req, res) => {
    const client = await pool.connect();
    
    try {
      const { submissionId, projectId, companyId, reviewType, revisionNotes } = req.body;
      
      await client.query('BEGIN');
      
      // Insert review
      await client.query(
        `INSERT INTO work_reviews (submission_id, project_id, company_id, review_type, revision_notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [submissionId, projectId, companyId, reviewType, revisionNotes]
      );
      
      // Update submission status
      const newStatus = reviewType === 'approved' ? 'approved' : 'needs_revision';
      await client.query(
        'UPDATE work_submissions SET status = $1, reviewed_at = NOW() WHERE id = $2',
        [newStatus, submissionId]
      );
      
      if (reviewType === 'approved') {
        // Work approved - release escrow and complete project
        await handleWorkApproval(client, projectId, submissionId);
      } else {
        // Work needs revision - notify freelancer
        const freelancerResult = await client.query(
          'SELECT freelancer_id FROM work_submissions WHERE id = $1',
          [submissionId]
        );
        
        await client.query(
          `INSERT INTO notifications (user_id, type, title, message, data, priority)
           VALUES ($1, 'work_revision', 'Revision Requested', 'The company has requested revisions to your work', $2, 'high')`,
          [freelancerResult.rows[0].freelancer_id, JSON.stringify({ projectId, submissionId, revisionNotes })]
        );
        
        // Update project status back to in_progress
        await client.query(
          'UPDATE active_projects SET status = $1, updated_at = NOW() WHERE id = $2',
          ['in_progress', projectId]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({ success: true, message: reviewType === 'approved' ? 'Work approved and payment released' : 'Revision requested' });
      
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error reviewing work:', err);
      res.status(500).json({ success: false, message: 'Failed to review work' });
    } finally {
      client.release();
    }
  });
  
  // Handle work approval - release escrow and transfer to past projects
  async function handleWorkApproval(client, projectId, submissionId) {
    // Get project details
    const projectResult = await client.query(
      `SELECT ap.*, j.title, j.description, ws.file_url, ws.file_name
       FROM active_projects ap
       JOIN jobs j ON ap.job_id = j.id
       JOIN work_submissions ws ON ws.id = $1
       WHERE ap.id = $2`,
      [submissionId, projectId]
    );
    
    const project = projectResult.rows[0];
    
    // Get or create escrow transaction
    let escrowResult = await client.query(
      'SELECT * FROM escrow_transactions WHERE project_id = $1 AND status = $2',
      [projectId, 'held']
    );
    
    let escrow;
    
    if (escrowResult.rows.length === 0) {
      // No escrow found - create one now with the project budget
      console.log('No escrow found, creating one with project budget:', project.budget_amount || project.agreed_rate);
      
      const escrowAmount = parseInt(project.agreed_rate || project.budget_amount || 0);
      
      if (!escrowAmount || escrowAmount <= 0) {
        throw new Error('Cannot create escrow: No valid budget amount found for project');
      }
      
      // Check company balance
      const companyBalanceResult = await client.query(
        'SELECT credits FROM user_credits WHERE user_id = $1',
        [project.company_id]
      );
      
      const companyBalance = companyBalanceResult.rows.length > 0 ? companyBalanceResult.rows[0].credits : 0;
      
      if (companyBalance < escrowAmount) {
        throw new Error(`Insufficient company balance. Required: ${escrowAmount} VCreds, Available: ${companyBalance} VCreds`);
      }
      
      // Deduct from company balance
      await client.query(
        `INSERT INTO user_credits (user_id, credits, transaction_type, transaction_id, description)
         VALUES ($1, $2, 'escrow_hold', $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET credits = user_credits.credits - $2, updated_at = NOW()`,
        [project.company_id, escrowAmount, projectId, `Escrow hold for project: ${project.title}`]
      );
      
      // Log company transaction
      await client.query(
        `INSERT INTO credit_transactions (user_id, type, amount, credits, description, project_id, status)
         VALUES ($1, 'sent', $2, $3, $4, $5, 'completed')`,
        [project.company_id, escrowAmount * 10, escrowAmount, `Escrow hold for: ${project.title}`, projectId]
      );
      
      // Create escrow transaction
      const newEscrowResult = await client.query(
        `INSERT INTO escrow_transactions (project_id, company_id, freelancer_id, credits_amount, status)
         VALUES ($1, $2, $3, $4, 'held') RETURNING *`,
        [parseInt(projectId), parseInt(project.company_id), parseInt(project.freelancer_id), escrowAmount]
      );
      
      escrow = newEscrowResult.rows[0];
      
      console.log('Created escrow transaction and deducted from company balance:', escrow.id);
    } else {
      escrow = escrowResult.rows[0];
    }
    
    // Release escrow - transfer credits to freelancer
    await client.query(
      `INSERT INTO user_credits (user_id, credits, transaction_type, transaction_id, description)
       VALUES ($1, $2, 'project_payment', $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET credits = user_credits.credits + $2, updated_at = NOW()`,
      [project.freelancer_id, escrow.credits_amount, escrow.id, `Payment for: ${project.title}`]
    );
    
    // Log transaction for freelancer (amount in INR = credits * 10)
    await client.query(
      `INSERT INTO credit_transactions (user_id, type, amount, credits, description, project_id, status)
       VALUES ($1, 'earned', $2, $3, $4, $5, 'completed')`,
      [project.freelancer_id, escrow.credits_amount * 10, escrow.credits_amount, `Earned from project: ${project.title}`, projectId]
    );
    
    // Update escrow status
    await client.query(
      'UPDATE escrow_transactions SET status = $1, released_at = NOW(), updated_at = NOW() WHERE id = $2',
      ['released', escrow.id]
    );
    
    // Get submission count and revision count
    const statsResult = await client.query(
      `SELECT COUNT(*) as submission_count,
              COUNT(CASE WHEN status = 'needs_revision' THEN 1 END) as revision_count
       FROM work_submissions WHERE project_id = $1`,
      [projectId]
    );
    
    // Move to past projects
    await client.query(
      `INSERT INTO past_projects (project_id, job_id, company_id, freelancer_id, title, description, 
                                   budget_amount, final_amount, submission_count, revision_count, 
                                   final_file_url, final_file_name, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [parseInt(projectId), parseInt(project.job_id), parseInt(project.company_id), parseInt(project.freelancer_id), 
       project.title, project.description, parseInt(project.budget_amount || 0), parseInt(escrow.credits_amount), 
       parseInt(statsResult.rows[0].submission_count), parseInt(statsResult.rows[0].revision_count), 
       project.file_url, project.file_name, project.start_date]
    );
    
    // Update active project status
    await client.query(
      'UPDATE active_projects SET status = $1, updated_at = NOW() WHERE id = $2',
      ['completed', projectId]
    );
    
    // Create notifications
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data, priority)
       VALUES ($1, 'payment_received', 'Payment Received', 'You have received payment for completed work', $2, 'high')`,
      [project.freelancer_id, JSON.stringify({ projectId, amount: escrow.credits_amount })]
    );
    
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data, priority)
       VALUES ($1, 'work_approved', 'Work Approved', 'Work has been approved and payment released', $2, 'high')`,
      [project.company_id, JSON.stringify({ projectId, submissionId })]
    );
  }
  
  // Download work file (Company - only after payment)
  router.get('/download/:submissionId', async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { userId } = req.query;
      
      // Check if work is approved and payment released
      const result = await pool.query(
        `SELECT ws.*, et.status as escrow_status, ap.company_id
         FROM work_submissions ws
         JOIN active_projects ap ON ws.project_id = ap.id
         LEFT JOIN escrow_transactions et ON ap.id = et.project_id
         WHERE ws.id = $1`,
        [submissionId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }
      
      const submission = result.rows[0];
      
      // Only allow download if user is company and escrow is released
      if (submission.company_id != userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      if (submission.escrow_status !== 'released') {
        return res.status(403).json({ success: false, message: 'File can only be downloaded after payment is released' });
      }
      
      const filePath = path.join(__dirname, '../..', submission.file_url);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }
      
      // Get file extension and set proper MIME type
      const ext = path.extname(submission.file_name).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.psd': 'image/vnd.adobe.photoshop',
        '.ai': 'application/postscript'
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.download(filePath, submission.file_name);
      
    } catch (err) {
      console.error('Error downloading file:', err);
      res.status(500).json({ success: false, message: 'Failed to download file' });
    }
  });
  
  // View work file (Company - preview only, no download)
  router.get('/view/:submissionId', async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { userId } = req.query;
      
      const result = await pool.query(
        `SELECT ws.*, ap.company_id
         FROM work_submissions ws
         JOIN active_projects ap ON ws.project_id = ap.id
         WHERE ws.id = $1`,
        [submissionId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }
      
      const submission = result.rows[0];
      
      if (submission.company_id != userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      
      const filePath = path.join(__dirname, '../..', submission.file_url);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }
      
      // Get file extension and set proper MIME type
      const ext = path.extname(submission.file_name).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.txt': 'text/plain',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.psd': 'image/vnd.adobe.photoshop',
        '.ai': 'application/postscript',
        '.fig': 'application/octet-stream'
      };
      
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      // Set headers for inline viewing (not download)
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${submission.file_name}"`);
      res.sendFile(filePath);
      
    } catch (err) {
      console.error('Error viewing file:', err);
      res.status(500).json({ success: false, message: 'Failed to view file' });
    }
  });
  
  // Get past projects (for both company and freelancer)
  router.get('/past-projects/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { userType } = req.query;
      
      const column = userType === 'company' ? 'company_id' : 'freelancer_id';
      const otherColumn = userType === 'company' ? 'freelancer_id' : 'company_id';
      
      const result = await pool.query(
        `SELECT pp.*, u.username as other_party_name
         FROM past_projects pp
         JOIN users u ON pp.${otherColumn} = u.id
         WHERE pp.${column} = $1
         ORDER BY pp.completed_at DESC`,
        [userId]
      );
      
      res.json({ success: true, projects: result.rows });
      
    } catch (err) {
      console.error('Error fetching past projects:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch past projects' });
    }
  });
  
  return router;
};
