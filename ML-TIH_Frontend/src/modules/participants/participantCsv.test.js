import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseParticipantCsv } from './participantCsv.js';

describe('parseParticipantCsv', () => {
  it('parses supported fields, quoted commas, CRLF, and a UTF-8 BOM', () => {
    const rows = parseParticipantCsv('\uFEFFtraining_id,name,age,category,attendance_status\r\n7,"Kiran, Devi",35,Women,PRESENT\r\n');
    assert.deepEqual(rows, [{
      line: 2,
      data: { training_id: 7, name: 'Kiran, Devi', age: 35, category: 'Women', attendance_status: 'present' },
    }]);
  });

  it('handles escaped quotes and ignores blank lines', () => {
    const rows = parseParticipantCsv('training_id,name\n\n2,"A ""quoted"" name"\n');
    assert.equal(rows[0].line, 3);
    assert.equal(rows[0].data.name, 'A "quoted" name');
  });

  it('requires training_id and name headers', () => {
    assert.throws(() => parseParticipantCsv('name,phone\nKiran,1234567890'), /training_id column/);
  });

  it('rejects unsupported columns and malformed row widths', () => {
    assert.throws(() => parseParticipantCsv('training_id,name,password\n1,Asha,x'), /Unsupported CSV column/);
    assert.throws(() => parseParticipantCsv('training_id,name\n1,Asha,extra'), /expected 2/);
  });

  it('validates numeric ids, ages, phone numbers, and attendance status', () => {
    assert.throws(() => parseParticipantCsv('training_id,name\nx,Asha'), /training_id must/);
    assert.throws(() => parseParticipantCsv('training_id,name,age\n1,Asha,9'), /age must/);
    assert.throws(() => parseParticipantCsv('training_id,name,phone\n1,Asha,123'), /phone must/);
    assert.throws(() => parseParticipantCsv('training_id,name,attendance_status\n1,Asha,unknown'), /attendance_status must/);
  });

  it('rejects unclosed quotes and duplicate headers', () => {
    assert.throws(() => parseParticipantCsv('training_id,name\n1,"Asha'), /unclosed quoted/);
    assert.throws(() => parseParticipantCsv('training_id,name,name\n1,Asha,Basha'), /duplicate column/);
  });
});
