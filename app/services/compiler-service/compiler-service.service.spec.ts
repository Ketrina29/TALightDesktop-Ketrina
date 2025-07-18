import { TestBed } from '@angular/core/testing';

import { CompilerService } from './compiler-service.service';
import { ProjectLanguage } from '../project-manager-service/project-manager.types';

describe('CompilerService', () => {
  let service: CompilerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompilerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should throw error if driver is not found for a given language', () => {
    const invalidLang = 'JS' as ProjectLanguage; // every string that is not 'PY'
    spyOn(console, 'error'); // to cover console.error

    expect(() => service.get(invalidLang)).toThrowError('Driver not found');
    expect(console.error).toHaveBeenCalledWith('CompilerService:getDriver:driver_not_found:', invalidLang);
  });
});
