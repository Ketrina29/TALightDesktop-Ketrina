import { TestBed } from '@angular/core/testing';

import { NotificationManagerService } from './notification-manager.service';
import { fakeAsync } from '@angular/core/testing';
import { NotificationType } from './notification-manager.service';

describe('NotificationManagerService', () => {
  let service: NotificationManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should emit notification with default type Info', (done) => {
  service.onNotification.subscribe((notification) => {
    expect(notification.title).toBe('Hello');
    expect(notification.message).toBe('World');
    expect(notification.type).toBe(NotificationType.Info);
    done();
  });

  service.sendNotification('Hello', 'World');
});

it('should emit notification with specific type', (done) => {
  service.onNotification.subscribe((notification) => {
    expect(notification.type).toBe(NotificationType.Error);
    done();
  });

  service.sendNotification('Error', 'Something went wrong', NotificationType.Error);
});

it('should store emitted notification in history', () => {
  service.sendNotification('Saved', 'This is stored');
  expect(service.history.length).toBe(1);
  expect(service.history[0].title).toBe('Saved');
  expect(service.history[0].message).toBe('This is stored');
});
it('should store multiple notifications in history', () => {
  service.sendNotification('N1', 'M1');
  service.sendNotification('N2', 'M2');
  service.sendNotification('N3', 'M3');
  expect(service.history.length).toBe(3);
  expect(service.history.map(n => n.title)).toEqual(['N1', 'N2', 'N3']);
});

it('should keep correct timestamp and default type', () => {
  const before = Date.now();
  service.sendNotification('Timestamp', 'Check');
  const after = Date.now();

  const notif = service.history[0];
  expect(notif.type).toBe(NotificationType.Info);
  expect(notif.timestamp).toBeGreaterThanOrEqual(before);
  expect(notif.timestamp).toBeLessThanOrEqual(after);
});

it('should emit different notification types', (done) => {
  const types = [
    NotificationType.Debug,
    NotificationType.Warning,
    NotificationType.Success,
    NotificationType.System,
  ];

  let received = 0;

  service.onNotification.subscribe((n) => {
    expect(types.includes(n.type)).toBeTrue();
    received++;
    if (received === types.length) done();
  });

  types.forEach((type, i) => {
    service.sendNotification(`Title${i}`, `Msg${i}`, type);
  });

});
it('should emit notification with custom NotificationType.Default', (done) => {
  service.onNotification.subscribe((notification) => {
    expect(notification.type).toBe(NotificationType.Default); // që është Info
    done();
  });

  service.sendNotification('Custom', 'Using Default type', NotificationType.Default);
});
it('should default type to Info when not provided', (done) => {
  service.onNotification.subscribe((notification) => {
    expect(notification.type).toBe(NotificationType.Info);
    done();
  });

  // type nuk jepet → duhet të përdorë default
  service.sendNotification('NoType', 'This should default to Info');
});
it('should not throw if no subscriber is attached', () => {
  expect(() => {
    service.sendNotification('No Subscribers', 'Still works');
  }).not.toThrow();
});
it('should emit and store a default type when type is not provided', (done) => {
  service.onNotification.subscribe((notification) => {
    expect(notification.type).toBe(NotificationType.Info); // default
    done();
  });

  service.sendNotification('Title only', 'No type');
  expect(service.history[service.history.length - 1].type).toBe(NotificationType.Info);
});
it('should store notification even if no subscriber is listening', () => {
  // Këtu nuk ka .subscribe()
  service.sendNotification('No listener', 'Still stored');
  expect(service.history.length).toBeGreaterThan(0);
  expect(service.history[service.history.length - 1].title).toBe('No listener');
});


});
