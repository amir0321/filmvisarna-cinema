import type { RequestHandler } from 'express';
import { createBrotliCompress, createGzip, constants } from 'node:zlib';
import { Writable } from 'node:stream';

// Stream text responses with bounded memory. Images, ranges and precompressed assets pass through.
export const compression: RequestHandler = (req, res, next) => {
  const write = res.write.bind(res);
  const end = res.end.bind(res);
  let decided = false;
  let encoder: ReturnType<typeof createGzip> | undefined;

  function decide() {
    if (decided) return;
    decided = true;
    if (req.method === 'HEAD' || res.statusCode === 204 || res.statusCode === 304 ||
      res.statusCode === 206 || res.hasHeader('Content-Range') || res.hasHeader('Content-Encoding') ||
      /\bno-transform\b/i.test(String(res.getHeader('Cache-Control') ?? '')) ||
      !/^(text\/|application\/(json|javascript|xml|.*\+json)|image\/svg\+xml)/i.test(String(res.getHeader('Content-Type') ?? ''))) return;
    res.vary('Accept-Encoding');
    const length = res.getHeader('Content-Length');
    if (length !== undefined && Number(length) < 1024) return;
    const encoding = req.acceptsEncodings('br', 'gzip', 'identity');
    if (encoding !== 'br' && encoding !== 'gzip') return;
    encoder = encoding === 'br'
      ? createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 4 } })
      : createGzip({ level: 6 });
    res.setHeader('Content-Encoding', encoding);
    res.removeHeader('Content-Length');
    // The sink forwards backpressure to zlib and to the original producer.
    const sink = new Writable({
      write(chunk, _encoding, callback) { write(chunk, callback); },
      final(callback) { end(callback); },
    });
    encoder.pipe(sink);
    encoder.on('drain', () => res.emit('drain'));
    encoder.on('error', error => res.destroy(error));
    sink.on('error', error => res.destroy(error));
    res.on('close', () => { encoder?.destroy(); sink.destroy(); });
  }

  res.write = ((...args: Parameters<typeof res.write>) => {
    decide();
    return encoder ? encoder.write(...args) : write(...args);
  }) as typeof res.write;
  res.end = ((...args: Parameters<typeof res.end>) => {
    decide();
    if (encoder) encoder.end(...args);
    else end(...args);
    return res;
  }) as typeof res.end;
  next();
};
