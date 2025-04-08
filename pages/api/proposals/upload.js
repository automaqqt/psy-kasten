// pages/api/proposals/upload.js
import { getSession } from 'next-auth/react'; // or getServerSession
import prisma from '../../../lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from "next-auth/next";
import { formidable } from 'formidable'; // Use modern import if possible/needed
import fs from 'fs'; // For filesystem operations (if storing locally)
import path from 'path';

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
                // keep only pdfs
                 const isValid = mimetype && ALLOWED_MIME_TYPES.includes(mimetype);
                 if (!isValid) {
                     console.warn(`Upload blocked: Invalid mimetype ${mimetype} for ${originalFilename}`);
                      // Inform formidable to abort
                      form.emit('error', new Error(`Invalid file type. Only PDF is allowed.`));
                 }
                return isValid;
            },
             // Rename file to something unique (e.g., userId + timestamp)
              filename: (name, ext, part, form) => {
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(2, 8);
                return `${researcherId}-${timestamp}-${randomSuffix}${ext}`; // e.g., user123-1678886400000-a1b2c3.pdf
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
        const notes = fields.notes?.[0] || null; // formidable v3 fields are arrays

        // At this point, the file is saved locally in UPLOAD_DIR with the generated unique filename

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