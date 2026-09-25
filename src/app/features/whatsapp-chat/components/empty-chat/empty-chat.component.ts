import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-empty-chat',
    templateUrl: './empty-chat.component.html',
    styleUrls: ['./empty-chat.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TranslatePipe]
})
export class EmptyChatComponent {}
