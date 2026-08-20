import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketGenerationPage } from './ticket-generation.page';

describe('TicketGenerationPage', () => {
  let component: TicketGenerationPage;
  let fixture: ComponentFixture<TicketGenerationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketGenerationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
