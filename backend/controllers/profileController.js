import { parseResumeWithAI, generateEmbedding } from '../services/groqService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const extractTextFromBuffer = async (fileBuffer, mimeType) => {
  if (!fileBuffer) {
    return '';
  }

  if (mimeType === 'application/pdf') {
    if (typeof pdfParse === 'function') {
      const pdfData = await pdfParse(fileBuffer);
      return pdfData.text || '';
    }

    if (pdfParse && typeof pdfParse.PDFParse === 'function') {
      const parser = new pdfParse.PDFParse({ data: fileBuffer });
      const pdfData = await parser.getText();
      await parser.destroy();
      return pdfData?.text || '';
    }

    throw new Error('Unsupported pdf-parse module format');
  }

  // Basic text extraction for TXT/DOC/DOCX and unknown types.
  return fileBuffer.toString('utf-8');
};

export const parseResume = async (req, res) => {
  try {
    let resumeContent = '';
    const meta = {
      inputMode: req.file ? 'file' : 'text',
      fileName: null,
      mimeType: null,
      fileSize: 0,
      extractedTextLength: 0,
      parsedAt: new Date().toISOString()
    };

    if (req.file) {
      resumeContent = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
      meta.fileName = req.file.originalname || null;
      meta.mimeType = req.file.mimetype || null;
      meta.fileSize = req.file.size || req.file.buffer?.length || 0;
    } else if (req.body.resumeText) {
      resumeContent = req.body.resumeText;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Resume file or text is required'
      });
    }

    meta.extractedTextLength = resumeContent.length;

    const parsedData = await parseResumeWithAI(resumeContent, req.file?.originalname || 'resume.txt');

    const skillsText = parsedData.skills.join(', ') + ' ' + (parsedData.summary || '');
    const embedding = await generateEmbedding(skillsText);

    res.json({
      success: true,
      profile: {
        ...parsedData,
        skillsEmbedding: embedding,
        meta
      },
      meta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
