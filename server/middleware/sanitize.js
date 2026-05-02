const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_PATTERN_REGEX = /(<\s*script\b|javascript:|on\w+\s*=)/i;
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sanitizeAnalyzeInput = (req, res, next) => {
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
  const jobDescriptionInput =
    typeof req.body?.jobDescription === 'string' ? req.body.jobDescription : '';
  const sanitizedJobDescription = jobDescriptionInput.replace(HTML_TAG_REGEX, '').trim();

  if (!UUID_V4_REGEX.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid sessionId: expected UUID v4 format.' });
  }

  if (!sanitizedJobDescription) {
    return res.status(400).json({ error: 'jobDescription is required.' });
  }

  if (SCRIPT_PATTERN_REGEX.test(jobDescriptionInput)) {
    return res.status(400).json({ error: 'jobDescription contains unsafe script patterns.' });
  }

  req.body.sessionId = sessionId;
  req.body.jobDescription = sanitizedJobDescription;
  return next();
};

export default sanitizeAnalyzeInput;
