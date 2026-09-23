import { Directive, EventEmitter, Input, Output } from '@angular/core';

/**
 * Generic sortable-table-header directive.
 *
 * Salvaged from the template's `pages/ecommerce/orders/orders-sortable.directive.ts`
 * (plan §3 SALVAGE) and decoupled from the Orders entity type. Feature lanes use it
 * on any `th[sortable]` header:
 *
 *   <th sortable="name" (sortchange)="onSortChange($event)">Name</th>
 *
 * via `@ViewChildren(NgbdSortableHeader) headers` in the component.
 */

export type SortColumn = string;
export type SortDirection = '' | 'asc' | 'desc';

const rotate: { [key: string]: SortDirection } = { 'asc': 'desc', 'desc': '', '': 'asc' };

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  }
})
export class NgbdSortableHeader {

  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sortchange = new EventEmitter<SortEvent>();

  rotate(): void {
    this.direction = rotate[this.direction];
    this.sortchange.emit({ column: this.sortable, direction: this.direction });
  }
}
