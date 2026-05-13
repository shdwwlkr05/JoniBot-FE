import { TestBed } from '@angular/core/testing';

import { ReliefExportService } from './relief-export.service';

describe('ReliefExportService', () => {
  let service: ReliefExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReliefExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
