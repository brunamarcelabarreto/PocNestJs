export class PaginationDto {
  page!: number;
  limit!: number;
  total!: number;
  pages!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  pagination!: PaginationDto;
}
