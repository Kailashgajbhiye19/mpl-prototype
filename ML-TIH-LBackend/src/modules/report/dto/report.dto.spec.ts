import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReportQueryDto } from './report.dto';

describe('ReportQueryDto', () => {
  it('converts numeric query strings to district and block codes', async () => {
    const query = plainToInstance(ReportQueryDto, {
      district_cd: '700001',
      block_cd: '700002',
    });

    expect(query.district_cd).toBe(700001);
    expect(query.block_cd).toBe(700002);
    await expect(validate(query)).resolves.toHaveLength(0);
  });

  it('rejects malformed, fractional, and negative location codes', async () => {
    const query = plainToInstance(ReportQueryDto, {
      district_cd: '12invalid',
      block_cd: '-2',
    });

    const errors = await validate(query);
    expect(errors.map(({ property }) => property)).toEqual([
      'district_cd',
      'block_cd',
    ]);
  });
});
