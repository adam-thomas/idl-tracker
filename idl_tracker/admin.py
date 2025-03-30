from django.contrib import admin

from . import models


# TODO: Proper admin setup with list fields, inlines, etc.
admin.site.register(models.DotaHero)
admin.site.register(models.Player)
admin.site.register(models.Season)
admin.site.register(models.BaseTeam)
admin.site.register(models.TeamParticipation)
admin.site.register(models.Match)
admin.site.register(models.Game)
admin.site.register(models.IndividualGameTeam)
admin.site.register(models.PlayerParticipation)