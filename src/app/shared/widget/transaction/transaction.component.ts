import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-transaction',
    templateUrl: './transaction.component.html',
    styleUrls: ['./transaction.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass]
})
export class TransactionComponent implements OnInit {

  @Input() transactions: Array<{
    id?: string;
    index?: number,
    name?: string,
    date?: string,
    total?: string,
    status?: string,
    payment?: string[],
  }>;

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }

  /**
   * Open modal
   * @param content modal content
   */
  openModal(content: any) {
    this.modalService.open(content, { centered: true });
  }

}
