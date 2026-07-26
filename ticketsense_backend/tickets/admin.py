from django.contrib import admin

from tickets.models import Ticket, TicketExternalLink


admin.site.register(Ticket)
admin.site.register(TicketExternalLink)

