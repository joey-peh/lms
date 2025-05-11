import { TestBed } from '@angular/core/testing';

import { CsvDataStoreService } from './csv-data-store-service.service';

describe('CsvDataStoreServiceService', () => {
  let service: CsvDataStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvDataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
