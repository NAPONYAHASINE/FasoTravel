import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should use defaults when empty', async () => {
    const dto = plainToInstance(PaginationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.order).toBe('DESC');
  });

  it('should accept valid values', async () => {
    const dto = plainToInstance(PaginationDto, {
      page: 2,
      limit: 50,
      sort: 'createdAt',
      order: 'ASC',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject page < 1', async () => {
    const dto = plainToInstance(PaginationDto, { page: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject limit > 100', async () => {
    const dto = plainToInstance(PaginationDto, { limit: 200 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject invalid order', async () => {
    const dto = plainToInstance(PaginationDto, { order: 'RANDOM' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
