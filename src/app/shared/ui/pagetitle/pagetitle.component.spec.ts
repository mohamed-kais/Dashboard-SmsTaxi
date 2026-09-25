import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PagetitleComponent } from './pagetitle.component';

describe('PagetitleComponent', () => {
  let component: PagetitleComponent;
  let fixture: ComponentFixture<PagetitleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [PagetitleComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PagetitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
