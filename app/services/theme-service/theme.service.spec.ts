import { ThemeService, AppTheme } from './theme.service';
import { DOCUMENT } from '@angular/common';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockDocument: Document;
  let linkElement: HTMLLinkElement;

  beforeEach(() => {
    // Mock document with theme link
    linkElement = document.createElement('link');
    linkElement.id = 'app-theme';
    document.body.appendChild(linkElement);

    mockDocument = document;

    // clean localStorage
    localStorage.clear();

    service = new ThemeService(mockDocument);
  });

  afterEach(() => {
    document.body.removeChild(linkElement);
    localStorage.clear();
  });

  it('should set theme to a specific value', () => {
    service.setTheme(AppTheme.dark);
    expect(localStorage.getItem('theme')).toBe(AppTheme.dark);
    expect(linkElement.href).toContain(AppTheme.dark);
  });

  it('should toggle theme from light to dark', () => {
    localStorage.setItem('theme', AppTheme.light);
    service.toggleTheme();
    expect(localStorage.getItem('theme')).toBe(AppTheme.dark);
    expect(linkElement.href).toContain(AppTheme.dark);
  });

  it('should notify listeners when theme changes', (done) => {
    service.themeChanged.subscribe((theme) => {
      expect(theme).toBe(AppTheme.dark);
      done();
    });

    service.setTheme(AppTheme.dark);
  });
});
