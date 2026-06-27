const fs = require('fs');

function parseRangeHeader(rangeHeader, fileSize) {
  const fallback = { start: 0, end: fileSize - 1 };
  if (!rangeHeader) return fallback;

  const matches = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!matches) return fallback;

  const start = matches[1] === '' ? 0 : Number.parseInt(matches[1], 10);
  const end = matches[2] === '' ? fileSize - 1 : Number.parseInt(matches[2], 10);

  if (Number.isNaN(start) || Number.isNaN(end)) return fallback;
  return { start, end };
}

function streamVideoFile(filePath, req, res) {
  fs.stat(filePath, (statErr, stats) => {
    if (statErr) {
      return res.status(404).send('Файл не найден');
    }

    const { start, end } = parseRangeHeader(req.headers.range, stats.size);
    if (start >= stats.size || start < 0 || end < start) {
      return res.status(416).send('Запрос за пределами размера файла');
    }

    const safeEnd = Math.min(end, stats.size - 1);
    const contentLength = safeEnd - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${safeEnd}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store',
      'Content-Disposition': 'inline'
    });

    const stream = fs.createReadStream(filePath, { start, end: safeEnd });
    stream.on('error', () => res.status(500).end());
    stream.pipe(res);
  });
}

module.exports = {
  streamVideoFile
};
