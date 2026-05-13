import { TestBed } from '@angular/core/testing';

import { ReliefStoreService } from './relief-store.service';

describe('ReliefStoreService', () => {
  let service: ReliefStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReliefStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
