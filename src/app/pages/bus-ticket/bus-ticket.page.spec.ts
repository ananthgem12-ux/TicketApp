import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BusTicketPage } from './bus-ticket.page';

describe('BusTicketPage', () => {
  let component: BusTicketPage;
  let fixture: ComponentFixture<BusTicketPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BusTicketPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
