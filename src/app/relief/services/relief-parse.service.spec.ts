import { TestBed } from '@angular/core/testing';

import { ReliefParseService } from './relief-parse.service';

describe('ReliefParseService', () => {
  let service: ReliefParseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReliefParseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
