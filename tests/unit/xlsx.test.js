import { describe, expect, it } from 'vitest';
import { buildXlsx, crc32, sheetXml, zipStore } from '../../src/xlsx.js';
import { historyXlsxSheets } from '../../src/logic.js';

const textDecoder = new TextDecoder();

// Rozbiera ZIP (wpisy bez kompresji): central directory → { nazwa: zawartość }.
function unzipStore(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdSignature = 0x06054b50;
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === eocdSignature) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('brak EOCD w ZIP');
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const files = {};
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('zepsuty central directory');
    const nameLen = view.getUint16(offset + 28, true);
    const localOffset = view.getUint32(offset + 42, true);
    const size = view.getUint32(offset + 24, true);
    const name = textDecoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
    const localNameLen = view.getUint16(localOffset + 26, true);
    const dataStart = localOffset + 30 + localNameLen;
    files[name] = bytes.subarray(dataStart, dataStart + size);
    offset += 46 + nameLen;
  }
  return files;
}

describe('xlsx: crc32 i kontener ZIP', () => {
  it('crc32 zna standardowy wektor testowy', () => {
    const encoder = new TextEncoder();
    expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926);
  });

  it('ZIP bez kompresji da się rozpakować i zawiera poprawne CRC', () => {
    const encoder = new TextEncoder();
    const files = [
      { name: 'a.txt', data: encoder.encode('trening') },
      { name: 'dir/b.xml', data: encoder.encode('<x>1</x>') },
    ];
    const bytes = zipStore(files);
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
    const unzipped = unzipStore(bytes);
    expect(Object.keys(unzipped).sort()).toEqual(['a.txt', 'dir/b.xml']);
    expect(textDecoder.decode(unzipped['a.txt'])).toBe('trening');
    expect(crc32(unzipped['dir/b.xml'])).toBe(crc32(encoder.encode('<x>1</x>')));
  });
});

describe('xlsx: arkusze', () => {
  it('sheetXml buduje nagłówek stylowany, zamrożony wiersz i autofilter', () => {
    const xml = sheetXml({
      columns: ['Data', 'Ciężar (kg)'],
      rows: [['2026-11-23', 82.5]],
      numericStyles: { 1: 2 },
    });
    expect(xml).toContain('<pane ySplit="1"');
    expect(xml).toContain('<autoFilter ref="A1:B2"/>');
    expect(xml).toContain('s="1"');
    expect(xml).toContain('<t xml:space="preserve">Data</t>');
    expect(xml).toContain('<c r="B2" s="2"><v>82.5</v></c>');
    expect(xml).toContain('customWidth="1"');
  });

  it('puste wiersze nie dają autofiltra i nie wywalają pliku', () => {
    const xml = sheetXml({ columns: ['A'], rows: [], numericStyles: {} });
    expect(xml).not.toContain('autoFilter');
  });
});

describe('logic: historyXlsxSheets', () => {
  const sessions = [
    {
      sessionId: 's1', workoutId: 'A', workoutName: 'TRENING A', week: 3, date: '2026-03-08T10:00:00.000Z',
      totalSets: 2, totalVolume: 1000,
      exercises: [
        { name: 'Przysiad z sztangą na plecach', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] },
        { name: 'Plank (deska klasyczna)', sets: [{ weight: 0, reps: 60, measurement: 'seconds' }] },
      ],
    },
  ];

  it('buduje arkusz serii z liczbami i arkusz podsumowania', () => {
    const sheets = historyXlsxSheets(sessions, { lang: 'pl', unit: 'kg' });
    expect(sheets).toHaveLength(2);
    expect(sheets[0].name).toBe('Serie');
    expect(sheets[0].columns[6]).toBe('Ciężar (kg)');
    // Serie: 100 kg × 5, zapisane jako liczba w kolumnie ciężaru.
    const firstRow = sheets[0].rows[0];
    expect(firstRow[6]).toBe(100);
    expect(firstRow[7]).toBe(5);
    // Plank: powtórzenia (sekundy) jako liczba.
    const plankRow = sheets[0].rows.find(row => String(row[4]).startsWith('Plank'));
    expect(plankRow[7]).toBe(60);
    // Podsumowanie: serie i objętość liczbowo.
    expect(sheets[1].name).toBe('Treningi');
    expect(sheets[1].rows[0][4]).toBe(2);
    expect(sheets[1].rows[0][5]).toBe(1000);
  });

  it('przelicza na funty po zmianie jednostki', () => {
    const sheets = historyXlsxSheets(sessions, { lang: 'en', unit: 'lb' });
    expect(sheets[0].columns[6]).toContain('lb');
    expect(sheets[0].rows[0][6]).toBe(220.46);
  });
});

describe('xlsx: pełny plik', () => {
  it('buildXlsx składa działający pakiet OOXML z dwoma arkuszami', () => {
    const sheets = [
      { name: 'Serie', columns: ['Data'], rows: [['2026-03-08']], numericStyles: {} },
      { name: 'Treningi', columns: ['Data', 'Objętość'], rows: [['2026-03-08', 1000]], numericStyles: { 1: 2 } },
    ].map(sheet => ({ ...sheet, xml: sheetXml(sheet) }));
    const bytes = buildXlsx(sheets);
    // Sygnatura ZIP = plik XLSX.
    expect(Array.from(bytes.subarray(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const files = unzipStore(bytes);
    expect(Object.keys(files).sort()).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/workbook.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
    ]);
    const workbook = textDecoder.decode(files['xl/workbook.xml']);
    expect(workbook).toContain('name="Serie"');
    expect(workbook).toContain('name="Treningi"');
    const styles = textDecoder.decode(files['xl/styles.xml']);
    expect(styles).toContain('numFmt numFmtId="164"');
    expect(styles).toContain('<b/>');
  });
});
