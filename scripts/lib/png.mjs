import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const DEFAULT_MAX_DECODED_BYTES = 128 * 1024 * 1024;

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const diagonalDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= diagonalDistance) return left;
  return aboveDistance <= diagonalDistance ? above : upperLeft;
}

function compositeChannel(channel, alpha, background) {
  return Math.round((channel * alpha + background * (255 - alpha)) / 255);
}

export function decodePng(bytes, options = {}) {
  const maxDecodedBytes = options.maxDecodedBytes || DEFAULT_MAX_DECODED_BYTES;
  const background = options.background || [255, 255, 255];
  if (!Buffer.isBuffer(bytes) || bytes.length < 57
      || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return null;

  let offset = 8;
  let header = null;
  let imageDataEnded = false;
  let sawEnd = false;
  const imageData = [];
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) return null;
    const length = bytes.readUInt32BE(offset);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const chunkEnd = dataEnd + 4;
    if (dataEnd < dataStart || chunkEnd > bytes.length) return null;
    const typeBytes = bytes.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString('ascii');
    if (!/^[A-Za-z]{4}$/.test(type)) return null;
    const data = bytes.subarray(dataStart, dataEnd);
    if (crc32(Buffer.concat([typeBytes, data])) !== bytes.readUInt32BE(dataEnd)) {
      return null;
    }
    if (type === 'IHDR') {
      if (header || offset !== 8 || length !== 13) return null;
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12]
      };
    } else if (!header) {
      return null;
    } else if (type === 'tRNS') {
      return null;
    } else if (type === 'IDAT') {
      if (imageDataEnded || sawEnd || length === 0) return null;
      imageData.push(data);
    } else if (type === 'IEND') {
      if (!imageData.length || sawEnd || length !== 0 || chunkEnd !== bytes.length) {
        return null;
      }
      sawEnd = true;
      offset = chunkEnd;
      break;
    } else {
      if (imageData.length) imageDataEnded = true;
      if ((typeBytes[0] & 0x20) === 0) return null;
    }
    offset = chunkEnd;
  }
  if (!header || !sawEnd || offset !== bytes.length) return null;
  const channels = new Map([[0, 1], [2, 3], [4, 2], [6, 4]])
    .get(header.colorType);
  if (header.width < 1 || header.height < 1 || header.bitDepth !== 8 || !channels
      || header.compression !== 0 || header.filter !== 0 || header.interlace !== 0) {
    return null;
  }
  const rowBytes = header.width * channels;
  const expectedBytes = header.height * (rowBytes + 1);
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes > maxDecodedBytes) return null;
  let inflated;
  try {
    inflated = inflateSync(Buffer.concat(imageData), { maxOutputLength: expectedBytes });
  } catch {
    return null;
  }
  if (inflated.length !== expectedBytes) return null;

  const visiblePixels = Buffer.alloc(header.width * header.height * 4);
  let previous = Buffer.alloc(rowBytes);
  for (let y = 0; y < header.height; y += 1) {
    const sourceOffset = y * (rowBytes + 1);
    const filterType = inflated[sourceOffset];
    if (filterType > 4) return null;
    const row = Buffer.alloc(rowBytes);
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[sourceOffset + 1 + x];
      const left = x >= channels ? row[x - channels] : 0;
      const above = previous[x];
      const upperLeft = x >= channels ? previous[x - channels] : 0;
      const predictor = [
        0,
        left,
        above,
        Math.floor((left + above) / 2),
        paeth(left, above, upperLeft)
      ][filterType];
      row[x] = (raw + predictor) & 0xff;
    }
    for (let x = 0; x < header.width; x += 1) {
      const source = x * channels;
      const target = (y * header.width + x) * 4;
      let red;
      let green;
      let blue;
      let alpha;
      if (header.colorType === 0) {
        red = row[source];
        green = red;
        blue = red;
        alpha = 255;
      } else if (header.colorType === 2) {
        red = row[source];
        green = row[source + 1];
        blue = row[source + 2];
        alpha = 255;
      } else if (header.colorType === 4) {
        red = row[source];
        green = red;
        blue = red;
        alpha = row[source + 1];
      } else {
        red = row[source];
        green = row[source + 1];
        blue = row[source + 2];
        alpha = row[source + 3];
      }
      visiblePixels[target] = compositeChannel(red, alpha, background[0]);
      visiblePixels[target + 1] = compositeChannel(green, alpha, background[1]);
      visiblePixels[target + 2] = compositeChannel(blue, alpha, background[2]);
      visiblePixels[target + 3] = 255;
    }
    previous = row;
  }
  return {
    width: header.width,
    height: header.height,
    visiblePixels,
    visibleSha256: createHash('sha256').update(visiblePixels).digest('hex')
  };
}

function luminance(pixels, offset) {
  return Math.round(
    pixels[offset] * 0.2126
      + pixels[offset + 1] * 0.7152
      + pixels[offset + 2] * 0.0722
  );
}

export function imageComplexity(image) {
  if (!image) return null;
  let minimum = 255;
  let maximum = 0;
  let edgeCount = 0;
  const edgeRegions = new Set();
  const edgeRows = new Set();
  const edgeColumns = new Set();
  const gridSize = 4;
  const pixelCount = image.width * image.height;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const offset = (y * image.width + x) * 4;
      const value = luminance(image.visiblePixels, offset);
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
      const right = x + 1 < image.width
        ? luminance(image.visiblePixels, offset + 4)
        : value;
      const below = y + 1 < image.height
        ? luminance(image.visiblePixels, offset + image.width * 4)
        : value;
      if (Math.max(Math.abs(value - right), Math.abs(value - below)) >= 12) {
        edgeCount += 1;
        const regionRow = Math.min(
          gridSize - 1,
          Math.floor(y * gridSize / image.height)
        );
        const regionColumn = Math.min(
          gridSize - 1,
          Math.floor(x * gridSize / image.width)
        );
        edgeRegions.add(regionRow * gridSize + regionColumn);
        edgeRows.add(regionRow);
        edgeColumns.add(regionColumn);
      }
    }
  }
  return {
    luminanceRange: maximum - minimum,
    edgeRatio: pixelCount ? edgeCount / pixelCount : 0,
    edgeRegionCount: edgeRegions.size,
    edgeRowCount: edgeRows.size,
    edgeColumnCount: edgeColumns.size
  };
}

export function perceptualFingerprint(image, size = 24) {
  if (!image || size < 1) return null;
  const output = new Uint8Array(size * size);
  const sums = new Float64Array(size * size);
  const counts = new Uint32Array(size * size);
  for (let y = 0; y < image.height; y += 1) {
    const row = Math.min(size - 1, Math.floor(y * size / image.height));
    for (let x = 0; x < image.width; x += 1) {
      const column = Math.min(size - 1, Math.floor(x * size / image.width));
      const bucket = row * size + column;
      sums[bucket] += luminance(
        image.visiblePixels,
        (y * image.width + x) * 4
      );
      counts[bucket] += 1;
    }
  }
  for (let index = 0; index < output.length; index += 1) {
    output[index] = counts[index] ? Math.round(sums[index] / counts[index]) : 0;
  }
  return output;
}

export function fingerprintDistance(left, right) {
  if (!left || !right || left.length !== right.length || !left.length) return Infinity;
  let total = 0;
  for (let index = 0; index < left.length; index += 1) {
    total += Math.abs(left[index] - right[index]);
  }
  return total / left.length;
}
