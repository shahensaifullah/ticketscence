from django.contrib import admin

from tickets.models import Ticket, TicketExternalLink, TicketTimeEntry


admin.site.register(Ticket)
admin.site.register(TicketExternalLink)
admin.site.register(TicketTimeEntry)
