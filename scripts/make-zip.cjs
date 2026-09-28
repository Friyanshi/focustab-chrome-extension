const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

function collectFiles(dir, baseDir = dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, '/');
    if (rel === 'focustab-extension.zip') continue;
    if (entry.isDirectory()) {
      collectFiles(full, baseDir, list);
    } else {
      list.push({ full, rel });
    }
  }
  return list;
}

const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist.');
  process.exit(1);
}

const files = collectFiles(distDir);

const localChunks = [];
const centralChunks = [];
let offset = 0;

for (const f of files) {
  const rawData = fs.readFileSync(f.full);
  const compressed = zlib.deflateRawSync(rawData);
  const crc = crc32(rawData);
  const nameBuf = Buffer.from(f.rel, 'utf8');

  // Local file header (30 bytes + name)
  const lfh = Buffer.alloc(30);
  lfh.writeUInt32LE(0x04034b50, 0); // signature
  lfh.writeUInt16LE(20, 4); // version needed
  lfh.writeUInt16LE(0, 6); // flags
  lfh.writeUInt16LE(8, 8); // compression method: deflate (8)
  lfh.writeUInt16LE(0, 10); // mod time
  lfh.writeUInt16LE(0, 12); // mod date
  lfh.writeUInt32LE(crc, 14);
  lfh.writeUInt32LE(compressed.length, 18);
  lfh.writeUInt32LE(rawData.length, 22);
  lfh.writeUInt16LE(nameBuf.length, 26);
  lfh.writeUInt16LE(0, 28); // extra len

  const localRecord = Buffer.concat([lfh, nameBuf, compressed]);
  localChunks.push(localRecord);

  // Central directory header (46 bytes + name)
  const cdh = Buffer.alloc(46);
  cdh.writeUInt32LE(0x02014b50, 0);
  cdh.writeUInt16LE(20, 4); // version made by
  cdh.writeUInt16LE(20, 6); // version needed
  cdh.writeUInt16LE(0, 8); // flags
  cdh.writeUInt16LE(8, 10); // deflate
  cdh.writeUInt16LE(0, 12);
  cdh.writeUInt16LE(0, 14);
  cdh.writeUInt32LE(crc, 16);
  cdh.writeUInt32LE(compressed.length, 20);
  cdh.writeUInt32LE(rawData.length, 24);
  cdh.writeUInt16LE(nameBuf.length, 28);
  cdh.writeUInt16LE(0, 30); // extra
  cdh.writeUInt16LE(0, 32); // comment
  cdh.writeUInt16LE(0, 34); // disk
  cdh.writeUInt16LE(0, 36); // int attr
  cdh.writeUInt32LE(0, 38); // ext attr
  cdh.writeUInt32LE(offset, 42); // local header offset

  centralChunks.push(Buffer.concat([cdh, nameBuf]));
  offset += localRecord.length;
}

const centralBuf = Buffer.concat(centralChunks);
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(centralBuf.length, 12);
eocd.writeUInt32LE(offset, 16);
eocd.writeUInt16LE(0, 20);

const zipBuffer = Buffer.concat([...localChunks, centralBuf, eocd]);
fs.writeFileSync(path.join(process.cwd(), 'public/focustab-extension.zip'), zipBuffer);
fs.writeFileSync(path.join(process.cwd(), 'dist/focustab-extension.zip'), zipBuffer);
console.log('Successfully generated focustab-extension.zip (' + zipBuffer.length + ' bytes, ' + files.length + ' files)');
