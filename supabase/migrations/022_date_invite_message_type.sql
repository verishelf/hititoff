-- Allow date_invite message type for structured date invites in chat/inbox

alter table public.messages drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in ('text', 'voice', 'quick_response', 'date_invite'));
