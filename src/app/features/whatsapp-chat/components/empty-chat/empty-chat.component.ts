import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-empty-chat',
    templateUrl: './empty-chat.component.html',
    styleUrls: ['./empty-chat.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EmptyChatComponent {}
