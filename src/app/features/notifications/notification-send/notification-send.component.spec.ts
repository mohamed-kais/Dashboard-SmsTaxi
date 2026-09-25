import { TestBed, ComponentFixture, fakeAsync, tick, flush } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { provideTranslateService } from '@ngx-translate/core';

import { NotificationSendComponent } from './notification-send.component';
import { NotificationService } from '../../../core/services/notification.service';
import {
  NotificationClientRow,
  NotificationTaxiRow,
  SendNotificationRequest,
} from '../../../core/models/notification.model';

describe('NotificationSendComponent', () => {
  let component: NotificationSendComponent;
  let fixture: ComponentFixture<NotificationSendComponent>;
  let notifSpy: jasmine.SpyObj<NotificationService>;

  const taxiRow = (id: number, over: Partial<NotificationTaxiRow> = {}): NotificationTaxiRow => ({
    id,
    nom: `Taxi ${id}`,
    telephone: `061${id}`,
    ...over,
  });
  const clientRow = (id: number, over: Partial<NotificationClientRow> = {}): NotificationClientRow => ({
    id,
    nom: `Client ${id}`,
    telephone: `062${id}`,
    ...over,
  });

  const fillForm = (): void => {
    component.form.setValue({ title: 'Hello', message: '  Bonjour  ', channel: 'SMS', type: 'WARNING' });
  };

  beforeEach(() => {
    notifSpy = jasmine.createSpyObj('NotificationService', ['getTaxisCriteria', 'getClientsCriteria', 'send']);
    notifSpy.getTaxisCriteria.and.returnValue(of({
      taxis: {
        content: [taxiRow(1), taxiRow(2, { taxiStatus: 'APPROVED' })],
        totalElements: 2,
        totalPages: 1,
        size: 10,
        number: 0,
      },
      stats: {},
    }));
    notifSpy.getClientsCriteria.and.returnValue(of({
      content: [clientRow(3, { etat: 'WAITING' }), clientRow(4)],
      totalElements: 2,
      totalPages: 1,
      size: 10,
      number: 0,
    }));
    notifSpy.send.and.returnValue(of('Sent'));

    TestBed.configureTestingModule({
      imports: [NotificationSendComponent],
      providers: [
        provideTranslateService(),
        { provide: NotificationService, useValue: notifSpy },
      ],
    });
    fixture = TestBed.createComponent(NotificationSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create and render the wizard', () => {
    expect(component).toBeTruthy();
    expect(component.step).toBe(1);
    // Eager TAXI picker load on init.
    expect(notifSpy.getTaxisCriteria).toHaveBeenCalledTimes(1);
    expect(component.taxis.rows.length).toBe(2);
  });

  it('goToStep2 on invalid form → stays on step 1 and flags errors', () => {
    component.form.get('message')!.setValue('');
    component.goToStep2();
    expect(component.step).toBe(1);
    expect(component.step1Submitted).toBeTrue();
    expect(component.form.get('title')!.errors?.['required']).toBeTruthy();
  });

  it('goToStep2 on valid form → advances to step 2 without re-loading the loaded TAXI tab', () => {
    fillForm();
    component.goToStep2();
    expect(component.step).toBe(2);
    expect(notifSpy.getTaxisCriteria).toHaveBeenCalledTimes(1); // still the eager init load
  });

  it('setTab(CLIENT) → lazy-loads clients on first visit and restores search term later', () => {
    component.setTab('CLIENT');
    expect(component.activeTab).toBe('CLIENT');
    expect(notifSpy.getClientsCriteria).toHaveBeenCalledTimes(1);
    expect(component.clients.rows.length).toBe(2);
    expect(component.clients.loaded).toBeTrue();

    // Second visit: no reload.
    component.setTab('TAXI');
    component.setTab('CLIENT');
    expect(notifSpy.getClientsCriteria).toHaveBeenCalledTimes(1);
  });

  it('canSend → false on TAXI without selection, true after toggling a row', () => {
    component.setTab('TAXI');
    expect(component.canSend).toBeFalse();
    component.toggleRow(component.taxis, 1);
    expect(component.canSend).toBeTrue();
    component.toggleRow(component.taxis, 1);
    expect(component.canSend).toBeFalse();
  });

  it('canSend → true on ADMIN even with no selection', () => {
    component.setTab('ADMIN');
    expect(component.canSend).toBeTrue();
  });

  it('canSend → true when selectAll is active', () => {
    component.toggleSelectAll(component.taxis);
    expect(component.taxis.selectAll).toBeTrue();
    expect(component.canSend).toBeTrue();
  });

  it('toggleSelectAll clears selectedIds; toggleRow is a no-op under selectAll', () => {
    component.toggleRow(component.taxis, 1);
    component.toggleSelectAll(component.taxis);
    expect(component.taxis.selectedIds.size).toBe(0);
    component.toggleRow(component.taxis, 2);
    expect(component.taxis.selectedIds.size).toBe(0);
  });

  it('send() with no selection → early-return, no API call', () => {
    component.setTab('TAXI');
    component.send();
    expect(notifSpy.send).not.toHaveBeenCalled();
  });

  it('send() on TAXI with selected ids → targetType TAXI and id-string targetIds, trimmed fields', () => {
    fillForm();
    component.goToStep2();
    component.toggleRow(component.taxis, 1);
    component.toggleRow(component.taxis, 2);
    component.send();

    expect(notifSpy.send).toHaveBeenCalledTimes(1);
    const request = notifSpy.send.calls.mostRecent().args[0] as SendNotificationRequest;
    expect(request.targetType).toBe('TAXI');
    expect(request.targetIds).toEqual(['1', '2']);
    expect(request.channel).toBe('SMS');
    expect(request.type).toBe('WARNING');
    expect(request.title).toBe('Hello');
    expect(request.message).toBe('Bonjour'); // trimmed
  });

  it('send() with selectAll → targetIds ["ALL"]', () => {
    fillForm();
    component.goToStep2();
    component.toggleSelectAll(component.taxis);
    component.send();
    const request = notifSpy.send.calls.mostRecent().args[0] as SendNotificationRequest;
    expect(request.targetIds).toEqual(['ALL']);
  });

  it('send() on ADMIN tab → targetIds ["ALL"] and targetType ADMIN', () => {
    fillForm();
    component.goToStep2();
    component.setTab('ADMIN');
    component.send();
    const request = notifSpy.send.calls.mostRecent().args[0] as SendNotificationRequest;
    expect(request.targetType).toBe('ADMIN');
    expect(request.targetIds).toEqual(['ALL']);
  });

  it('send() success → Swal.fire success, resets to step 1 with cleared state', () => {
    spyOn(Swal, 'fire').and.resolveTo();
    fillForm();
    component.goToStep2();
    component.toggleRow(component.taxis, 1);
    component.send();

    expect(Swal.fire).toHaveBeenCalledTimes(1);
    expect(component.step).toBe(1);
    expect(component.step1Submitted).toBeFalse();
    expect(component.activeTab).toBe('TAXI');
    expect(component.taxis.selectedIds.size).toBe(0);
    expect(component.taxis.selectAll).toBeFalse();
    expect(component.form.get('title')!.value).toBe('');
    expect(component.form.get('channel')!.value).toBe('PUSH');
    expect(component.form.get('type')!.value).toBe('INFO');
  });

  it('send() error → surfaces API error message, keeps state', () => {
    const swalSpy = spyOn(Swal, 'fire');
    notifSpy.send.and.returnValue(throwError(() => new Error('backend exploded')));
    fillForm();
    component.goToStep2();
    component.toggleRow(component.taxis, 1);
    component.send();

    expect(component.sending).toBeFalse();
    expect(component.sendError).toBe('backend exploded');
    expect(component.step).toBe(2);
    expect(swalSpy).not.toHaveBeenCalled();
  });

  it('goToStep1 → back to step 1 and clears sendError, preserves form values', () => {
    fillForm();
    component.goToStep2();
    component.sendError = 'old error';
    component.goToStep1();
    expect(component.step).toBe(1);
    expect(component.sendError).toBe('');
    expect(component.form.get('title')!.value).toBe('Hello');
  });

  it('debounced search: digits → phone param, text → name param, page reset to 1', fakeAsync(() => {
    component.setTab('TAXI');
    expect(notifSpy.getTaxisCriteria).toHaveBeenCalledTimes(1);

    component.searchControl.setValue('01234567');
    tick(400);
    expect(notifSpy.getTaxisCriteria).toHaveBeenCalledTimes(2);
    expect(notifSpy.getTaxisCriteria.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
      page: 0, size: 10, phone: '01234567',
    }));
    expect(notifSpy.getTaxisCriteria.calls.mostRecent().args[0].name).toBeUndefined();

    component.searchControl.setValue('Ali');
    tick(400);
    expect(notifSpy.getTaxisCriteria).toHaveBeenCalledTimes(3);
    expect(notifSpy.getTaxisCriteria.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
      name: 'Ali',
    }));
    expect(notifSpy.getTaxisCriteria.calls.mostRecent().args[0].phone).toBeUndefined();
    flush(); // clear the 30s clock interval
  }));

  it('onPageChange reloads the picker with the new 0-based page', () => {
    component.setTab('TAXI');
    component.onPageChange(3);
    expect(notifSpy.getTaxisCriteria).toHaveBeenCalledTimes(2);
    expect(notifSpy.getTaxisCriteria.calls.mostRecent().args[0].page).toBe(2);
  });

  it('onPageSizeChange resets to page 1 and reloads', () => {
    component.setTab('TAXI');
    component.onPageChange(3);
    component.onPageSizeChange('50');
    expect(component.taxis.pageSize).toBe(50);
    expect(component.taxis.page).toBe(1);
    expect(notifSpy.getTaxisCriteria.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
      page: 0,
      size: 50,
    }));
  });

  it('totalPagesOf → at least 1, ceil(total/pageSize)', () => {
    expect(component.totalPagesOf({ totalRecords: 0, pageSize: 10 })).toBe(1);
    expect(component.totalPagesOf({ totalRecords: 25, pageSize: 10 })).toBe(3);
    expect(component.totalPagesOf({ totalRecords: 100, pageSize: 50 })).toBe(2);
  });

  it('selectionLabel → reflects per-tab counts and selectAll flags', () => {
    component.setTab('TAXI');
    expect(component.selectionLabel()).toBe('sendNotif.taxisNoneSelected');
    component.toggleRow(component.taxis, 1);
    expect(component.selectionLabel()).toBe('sendNotif.taxisCountSelected');
    component.toggleSelectAll(component.taxis);
    expect(component.selectionLabel()).toBe('sendNotif.taxisAllSelected');
    component.setTab('CLIENT');
    expect(component.selectionLabel()).toBe('sendNotif.clientsNoneSelected');
    component.toggleSelectAll(component.clients);
    expect(component.selectionLabel()).toBe('sendNotif.clientsAllSelected');
    component.setTab('ADMIN');
    expect(component.selectionLabel()).toBe('sendNotif.adminAllSelected');
  });

  it('channelLabel/channelIcon/typeIcon → mapping helpers', () => {
    expect(component.channelLabel('WHATSAPP')).toBe('WHATSAPP');
    expect(component.channelLabel('SMS')).toBe('SMS');
    expect(component.channelLabel('PUSH')).toBe('sendNotif.channelApp'); // via translate
    expect(component.channelIcon('WHATSAPP')).toBe('fab fa-whatsapp');
    expect(component.channelIcon('SMS')).toBe('fas fa-sms');
    expect(component.channelIcon('PUSH')).toBe('fas fa-bell');
    expect(component.typeIcon('WARNING')).toBe('fas fa-exclamation-triangle');
    expect(component.typeIcon('ERROR')).toBe('fas fa-exclamation-circle');
    expect(component.typeIcon('INFO')).toBe('fas fa-info-circle');
  });

  it('taxiBadge/clientBadge → shared status-badge scheme or dash placeholder', () => {
    expect(component.taxiBadge('APPROVED')).toEqual({ label: 'APPROVED', class: 'badge-soft-success' });
    expect(component.taxiBadge(undefined)).toEqual({ label: '—', class: 'badge-soft-secondary' });
    expect(component.clientBadge({ id: 3, nom: 'x', telephone: 'y', etat: 'WAITING' })).toEqual({
      label: 'WAITING',
      class: 'badge-soft-warning',
    });
    expect(component.clientBadge({ id: 3, nom: 'x', telephone: 'y' })).toEqual({ label: '—', class: 'badge-soft-secondary' });
  });

  it('clearSearch → resets the shared search control', () => {
    component.searchControl.setValue('Ali');
    component.clearSearch();
    expect(component.searchControl.value).toBe('');
  });

  it('trackById → returns the row id', () => {
    expect(component.trackById(0, { id: 42 })).toBe(42);
  });
});