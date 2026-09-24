import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatLayoutComponent } from './components/chat-layout/chat-layout.component';

const routes: Routes = [{ path: '', component: ChatLayoutComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WhatsappChatRoutingModule {}
