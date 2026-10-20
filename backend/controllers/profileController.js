import { parseResumeWithAI, generateEmbedding } from '../services/groqService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const extractText = async (buffer, mimeType) => {
  if (!buffer) return '';
  if (mimeType === 'application/pdf') {
    const data = typeof pdfParse === 'function' ? await pdfParse(buffer) : await (new pdfParse.PDFParse({ data: buffer })).getText();
    return data?.text || '';
  }
  return buffer.toString('utf-8');
};

export const parseResume = async (req, res) => {
  try {
    const content = req.file
      ? await extractText(req.file.buffer, req.file.mimetype)
      : req.body?.resumeText;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Resume file or text is required' });
    }

    const parsedData = await parseResumeWithAI(content, req.file?.originalname || 'resume.txt');
    const skillsText = `${parsedData.skills.join(', ')} ${parsedData.summary || ''}`;
    const embedding = await generateEmbedding(skillsText);

    res.json({
      success: true,
      profile: {
        ...parsedData,
        skillsEmbedding: embedding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
