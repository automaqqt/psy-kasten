// pages/api/proposals/upload.js
import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";
import { formidable } from 'formidable'; // Use modern import if possible/needed
import fs from 'fs'; // For filesystem operations (if storing locally)
import path from 'path';
import crypto from 'crypto';
import { checkCsrf } from '../../../lib/csrf';
import rateLimit from '../../../lib/rateLimit';
import { sanitizeRichText } from '../../../lib/sanitize';

// --- Configuration ---
// Option 1: Local Storage (Change for Production!)
const UPLOAD_DIR = path.join(process.cwd(), '/uploads/proposals');
// Ensure the upload directory exists (run once or ensure in deployment script)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created upload directory: ${UPLOAD_DIR}`);
}
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = ['application/pdf'];
const ALLOWED_EXTENSIONS = ['.pdf'];

// Rate limiter: 5 uploads per hour per user
const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});

// Option 2: Cloud Storage (e.g., S3 - Requires AWS SDK setup)
// const S3_BUCKET = process.env.S3_PROPOSAL_BUCKET;
// const s3 = new AWS.S3(...); // Configure S3 client

// Disable Next.js body parsing for this route, let formidable handle it
export const config = {
  api: {
    bodyParser: false,
  },
};
// --- End Configuration ---

/**
 * Validates that a file path is safe and doesn't contain path traversal attacks
 * @param {string} filepath - The file path to validate
 * @param {string} allowedDir - The allowed directory (e.g., UPLOAD_DIR)
 * @returns {boolean} - True if path is safe
 */
function isPathSafe(filepath, allowedDir) {
  // Resolve paths to absolute paths to prevent traversal
  const resolvedPath = path.resolve(filepath);
  const resolvedAllowedDir = path.resolve(allowedDir);

  // Check that the resolved path starts with the allowed directory
  return resolvedPath.startsWith(resolvedAllowedDir + path.sep);
}

/**
 * Generates a secure random filename
 * @param {string} userId - User ID
 * @param {string} extension - File extension (e.g., '.pdf')
 * @returns {string} - Secure filename
 */
function generateSecureFilename(userId, extension) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  // Sanitize userId to prevent any path issues
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedUserId}-${timestamp}-${randomBytes}${extension}`;
}


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const session = await getServerSession(req, res, authOptions); // Or getSession({ req });

    if (!session?.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const researcherId = session.user.id;

    // Apply rate limiting (5 uploads per hour per user)
    const rateLimitResult = await limiter.check(req, 5, researcherId);
    if (!rateLimitResult.success) {
        return res.status(429).json({
            message: 'Too many upload attempts. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        });
    }

    // Validate CSRF token
    const csrfValid = await checkCsrf(req, res);
    if (!csrfValid) {
        return; // Response already sent by checkCsrf
    }

    try {
        // --- Check for existing PENDING proposal ---
        // Allow replacing only if not reviewed yet? Or disallow completely?
        // For simplicity: Allow upload only if NO pending (isReviewed=false) proposal exists.
        const existingProposal = await prisma.testProposal.findFirst({
            where: {
                researcherId: researcherId,
                isReviewed: false,
            },
        });

        if (existingProposal) {
            return res.status(409).json({ message: 'You already have a pending proposal. Please wait for it to be reviewed.' });
            // Alternative: Allow replacement (delete old file/record, create new) - More complex
        }
        // --- End Check ---


        // --- Parse Form Data with Formidable ---
        const form = formidable({
            uploadDir: UPLOAD_DIR, // Specify upload directory (for local storage)
            keepExtensions: true,
            maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // Max size in bytes
            // Filter allowed file types BEFORE saving (formidable v3+)
            filter: function ({ name, originalFilename, mimetype }) {
                // Validate mimetype
                const validMimetype = mimetype && ALLOWED_MIME_TYPES.includes(mimetype);

                // Validate file extension
                const ext = path.extname(originalFilename || '').toLowerCase();
                const validExtension = ALLOWED_EXTENSIONS.includes(ext);

                const isValid = validMimetype && validExtension;

                if (!isValid) {
                    console.warn(`Upload blocked: Invalid file ${originalFilename} (mime: ${mimetype}, ext: ${ext})`);
                    // Inform formidable to abort
                    form.emit('error', new Error(`Invalid file type. Only PDF files are allowed.`));
                }
                return isValid;
            },
            // Generate secure filename using crypto
            filename: (name, ext, part, form) => {
                // Ensure extension is .pdf
                const safeExt = ALLOWED_EXTENSIONS[0]; // Always use .pdf
                return generateSecureFilename(researcherId, safeExt);
            }
        });


        const parseForm = () => new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                     // Handle specific formidable errors (like file size limit, type filter)
                     if (err.message.includes('maxFileSize exceeded')) {
                         return reject(new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`));
                     }
                     if (err.message.includes('Invalid file type')) {
                          return reject(new Error(err.message)); // Use the filter error message
                     }
                    console.error("Formidable parsing error:", err);
                    return reject(new Error('Error parsing form data.'));
                }
                 // formidable v3 places file under 'file' key by default if input name is 'file'
                if (!files.proposalFile || files.proposalFile.length === 0) {
                    return reject(new Error('No file uploaded. Please include a file named "proposalFile".'));
                }
                // formidable v3 wraps file in array, even for single file upload
                const file = files.proposalFile[0];
                resolve({ fields, file });
            });
        });

        const { fields, file } = await parseForm();

        // Sanitize notes field to prevent XSS
        const rawNotes = fields.notes?.[0] || null;
        const notes = rawNotes ? sanitizeRichText(rawNotes) : null;

        // Security: Validate that the file path is safe and within the upload directory
        if (!isPathSafe(file.filepath, UPLOAD_DIR)) {
            // Delete the file if it's outside the allowed directory
            try {
                fs.unlinkSync(file.filepath);
            } catch (err) {
                console.error('Failed to delete unsafe file:', err);
            }
            console.error(`Path traversal attempt detected: ${file.filepath}`);
            return res.status(400).json({ message: 'Invalid file path detected.' });
        }

        // Validate file extension one more time (defense in depth)
        const fileExt = path.extname(file.newFilename || '').toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
            fs.unlinkSync(file.filepath);
            console.error(`Invalid file extension after upload: ${fileExt}`);
            return res.status(400).json({ message: 'Invalid file type.' });
        }

        // At this point, the file is safely saved locally in UPLOAD_DIR with the generated unique filename

        // --- TODO (Production): Upload to Cloud Storage ---
        // If using cloud storage:
        // 1. Instead of using uploadDir, you might stream directly to S3/GCS.
        // 2. OR: Upload locally first, then upload `file.filepath` to cloud storage.
        // 3. Get the cloud storage path/key.
        // 4. Delete the temporary local file: fs.unlinkSync(file.filepath);
        // const cloudStoragePath = await uploadToCloud(file.filepath, file.newFilename); // Your upload function
        // fs.unlinkSync(file.filepath); // Delete local temp file
        // const storagePath = cloudStoragePath; // Use cloud path
        // -------------------------------------------------

        // --- Save metadata to Database ---
        const proposalData = {
            researcherId: researcherId,
            originalFilename: file.originalFilename || 'unknown.pdf',
            // For local storage, store relative path or just filename if base dir is known
            storagePath: file.newFilename, // Store the unique filename generated by formidable
            // If using cloud: storagePath: cloudStoragePath,
            fileType: file.mimetype,
            fileSize: file.size,
            notes: notes,
            isReviewed: false, // Default
        };

        const newProposal = await prisma.testProposal.create({ data: proposalData });

        console.log(`Proposal PDF uploaded by ${researcherId}: ${file.newFilename}`);
        return res.status(201).json({ message: 'Proposal uploaded successfully!', proposalId: newProposal.id });

    } catch (error) {
        console.error('Upload API Error:', error);
        // Check for specific errors passed from formidable promise rejection
        if (error.message.includes('File size exceeds') || error.message.includes('Invalid file type')) {
             return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message || 'Failed to upload proposal.' });
    }
}