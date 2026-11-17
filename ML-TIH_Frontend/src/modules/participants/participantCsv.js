const SUPPORTED_COLUMNS = new Set([
  'training_id', 'name', 'phone', 'age', 'caste', 'education', 'category',
  'attendance_status', 'profile_image_url',
]);

function readCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let physicalLine = 1;
  let recordLine = 1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
        if (char === '\n') physicalLine += 1;
      }
    } else if (char === '"' && cell.length === 0) {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push({ values: row, line: recordLine });
      row = [];
      cell = '';
      physicalLine += 1;
      recordLine = physicalLine;
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error('CSV has an unclosed quoted value.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push({ values: row, line: recordLine });
  return rows;
}

export function parseParticipantCsv(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('CSV file is empty.');
  const [headerRecord, ...dataRows] = readCsvRows(text);
  if (!headerRecord) throw new Error('CSV file is empty.');
  const headerRow = headerRecord.values;

  const headers = headerRow.map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, '') : header).trim().toLowerCase(),
  );
  if (headers.some((header) => !header)) throw new Error('CSV column names cannot be empty.');
  if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate column names.');
  const unsupported = headers.filter((header) => !SUPPORTED_COLUMNS.has(header));
  if (unsupported.length) throw new Error(`Unsupported CSV column: ${unsupported.join(', ')}.`);
  for (const required of ['training_id', 'name']) {
    if (!headers.includes(required)) throw new Error(`CSV must include a ${required} column.`);
  }

  return dataRows.map(({ values, line }) => {
    if (values.length !== headers.length) {
      throw new Error(`Row ${line} has ${values.length} values; expected ${headers.length}.`);
    }
    const row = Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]));
    const trainingId = Number(row.training_id);
    if (!Number.isInteger(trainingId) || trainingId < 1) {
      throw new Error(`Row ${line}: training_id must be a positive whole number.`);
    }
    if (!row.name || row.name.length < 2 || row.name.length > 100) {
      throw new Error(`Row ${line}: name must be between 2 and 100 characters.`);
    }

    const participant = { training_id: trainingId, name: row.name };
    for (const field of ['phone', 'caste', 'education', 'category', 'profile_image_url']) {
      if (row[field]) participant[field] = row[field];
    }
    if (row.phone && !/^\d{10,15}$/.test(row.phone)) {
      throw new Error(`Row ${line}: phone must contain 10 to 15 digits.`);
    }
    if (row.age) {
      const age = Number(row.age);
      if (!Number.isInteger(age) || age < 10 || age > 120) {
        throw new Error(`Row ${line}: age must be a whole number from 10 to 120.`);
      }
      participant.age = age;
    }
    if (row.attendance_status) {
      const attendance = row.attendance_status.toLowerCase();
      if (!['present', 'absent', 'late'].includes(attendance)) {
        throw new Error(`Row ${line}: attendance_status must be present, absent, or late.`);
      }
      participant.attendance_status = attendance;
    }
    return { line, data: participant };
  });
}
