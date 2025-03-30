from django.core.exceptions import ValidationError
from django.db import models


def validate_team_size(value):
    """Validate that a team contains exactly five players."""
    if len(value) != 5:
        raise ValidationError("A team must have exactly five players.")

def validate_match_participants(value):
    """Validate that a match contains exactly two teams."""
    if len(value) != 2:
        raise ValidationError("A match must be played between exactly two teams.")


class DotaHero(models.Model):
    name = models.CharField(max_length=255, unique=True)
    dota_id = models.CharField(max_length=255, unique=True)
    thumbnail_url = models.URLField(unique=True)


class Player(models.Model):
    """An individual member of IDL."""
    name = models.CharField(max_length=255)
    steam_id = models.CharField(max_length=255, unique=True)
    avatar_url = models.URLField(unique=True)

    elo = models.IntegerField()
    elo_last_updated_at = models.DateTimeField(blank=True, null=True)


class Season(models.Model):
    """A season of IDL games."""
    class DraftFormats(models.TextChoices):
        CAPTAINS_MODE = ("captains_mode", "Captain's Mode")
        CAPTAINS_DRAFT = ("captains_draft", "Captain's Draft")

    number = models.PositiveIntegerField()
    draft_format = models.CharField(max_length=50, choices=DraftFormats.choices, default=DraftFormats.CAPTAINS_MODE)
    start_date = models.DateField(blank=True, null=True)


class BaseTeam(models.Model):
    """A drafted team for a particular season."""
    name = models.CharField(max_length=512)
    season = models.ForeignKey(Season, related_name="teams_drafted", on_delete=models.CASCADE)
    captain = models.ForeignKey(Player, related_name="teams_captained", on_delete=models.CASCADE)
    players = models.ManyToManyField(Player, related_name="teams_joined")

    # TODO: Could also include information about the draft - who was picked when, etc.


class TeamParticipation(models.Model):
    """
    The linkage between a Match and a BaseTeam, including the team's overall score
    within that match.
    """
    team = models.ForeignKey(BaseTeam, on_delete=models.CASCADE)
    match = models.ForeignKey("Match", on_delete=models.CASCADE)
    games_won = models.PositiveSmallIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(name="no_duplicate_teams", fields=["team", "match"]),
        ]


class Match(models.Model):
    """A match between teams, consisting of one or more games."""
    class BestOf(models.IntegerChoices):
        TWO = (2, "Best of 2")
        THREE = (3, "Best of 3")

    season = models.ForeignKey(Season, related_name="matches", on_delete=models.CASCADE)

    # Track how many games were needed to decide a winner, and the overall
    # score and winning team. While this could theoretically be derived from
    # looking at the Game objects, sometimes individual games aren't ticketed
    # or we don't have the necessary information, so tracking the results on
    # the Match object gives us a useful redundant source to handle (and
    # highlight) that failure case.
    start_time = models.DateTimeField()
    best_of = models.PositiveSmallIntegerField(choices=BestOf.choices)
    teams = models.ManyToManyField(BaseTeam, through=TeamParticipation, related_name="matches_played")


class Game(models.Model):
    """A single game that was played as part of an IDL match."""
    dota_id = models.CharField(max_length=255, unique=True)
    match = models.ForeignKey(Match, related_name="games", on_delete=models.CASCADE)
    start_time = models.DateTimeField()

    # TODO: Other game-specific data here, if we want them: stratz/dotabuff page URL,
    # which team had pick, XP/gold graphs, draft history, lane outcomes, IDL stream VOD, etc.


class IndividualGameTeam(models.Model):
    """
    This is used to collect the specific players that participated in a single game,
    including any subs. The PlayerParticipation model FKs this one.
    """
    base_team = models.ForeignKey(BaseTeam, related_name="game_appearances", on_delete=models.CASCADE)
    game = models.ForeignKey(Game, related_name="teams", on_delete=models.CASCADE)

    radiant_side = models.BooleanField()
    won_game = models.BooleanField()

    class Meta:
        # Only one team can be on Radiant or Dire in each game, and only one team
        # can win or lose each game. (Bold assumptions in software development...)
        constraints = [
            models.UniqueConstraint(name="different_sides", fields=["game", "radiant_side"]),
            models.UniqueConstraint(name="only_one_winner", fields=["game", "won_game"]),
        ]


class PlayerParticipation(models.Model):
    """A player's involvement and performance in a single game."""
    class Roles(models.TextChoices):
        CORE = ("CORE", "Core (pos 1-3)")
        POS_4 = ("LIGHT_SUPPORT", "Soft Support (pos 4)")
        POS_5 = ("HARD_SUPPORT", "Hard Support (pos 5)")

    team = models.ForeignKey(IndividualGameTeam, related_name="players", on_delete=models.CASCADE)
    hero_id = models.ForeignKey(DotaHero, related_name="appearances", on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=Roles.choices)

    kills = models.PositiveSmallIntegerField()
    deaths = models.PositiveSmallIntegerField()
    assists = models.PositiveSmallIntegerField()

    stratz_imp_score = models.SmallIntegerField()

    experience_per_minute = models.IntegerField()
    gold_per_minute = models.IntegerField()

    # TODO: Other, more detailed stats, if we want them.
