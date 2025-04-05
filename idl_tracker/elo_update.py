
def get_elo_delta(
    team_average_elo,
    enemy_team_average_elo,
    won_game,
    is_season_game,  # True for actual season matches or upper bracket; False for inhouses and spoon bracket matches
    games_played_this_season,
    games_played_total,
    game_count_in_unplayed_seasons,  # The number of games *in prior seasons* since the player last participated in a season.
    previous_season_elo,
    current_elo,
):
    """
    This calculates the ELO delta a player should receive after winning or losing a game.

    It accepts a number of data points around the player's current and previous ELOs and season
    participation, plus the teams' average ELOs for this match.

    A diagram of the formula exists at `elo_update_formula.png` in the project root. The
    variables within map to the arguments to this function as follows:

        T: `team_average_elo` - The player's team's average ELO score during this game.
        O: `enemy_team_average_elo` - The enemy team's average ELO score during this game.
        W: `won_game` - W is 1 if the player was on the winning team and 0 otherwise.
        S: `is_season_game` - S is 15.0 for season matches, and 7.5 for inhouses or matches
            in the "wooden spoon" lower bracket playoffs.

        C: `current_elo` - The player's ELO at the start of this game.
        P: `previous_elo` - The player's ELO at the *beginning* of the previous season.
        H: `games_played_total` minus `games_played_this_season` - The total number of games
            played by this player in previous seasons.
        L: `game_count_in_unplayed_seasons` - The number of IDL games in previous seasons
            since the last season in which this player participated. If a player plays in
            two seasons back-to-back, this number will be zero.
        N: `games_played_this_season` - The number of games the player has played in this
            season (so far).
    """
    games_played_in_previous_seasons = games_played_total - games_played_this_season

    # Calculate elo_difference_factor, the left half of the equation for K.
    elo_difference_compressed = abs(current_elo - previous_season_elo) ** 0.75
    elo_difference_factor = (elo_difference_compressed / 90) + 0.92

    # Calculate progression_rate_factor, the right half of the equation for K.
    # This is meant to adjust players' ELO more rapidly when they're new or haven't played
    # in a long time.
    games_played_and_missed = games_played_in_previous_seasons * (1 - game_count_in_unplayed_seasons)
    scaled_games_missed = 300 + (1.5 * game_count_in_unplayed_seasons)
    progression_rate_denominator = 20 + (games_played_and_missed / scaled_games_missed) ** 1.19
    progression_rate_factor = 1 + (20 / progression_rate_denominator)

    # Calculate game_win_factor, the bracketed section on the first line of the formula.
    team_elo_difference_exponent = (enemy_team_average_elo - team_average_elo) / 400
    team_elo_difference_denominator = 1 + (10 ** team_elo_difference_exponent)
    win_integer = 1 if won_game else 0
    game_win_factor = win_integer - (1 / team_elo_difference_denominator)

    # Calculate match_type_factor, the S value in the formula, which adjusts so that ELO
    # progresses faster in games where people are likely to be putting more effort or
    # investment in.
    match_type_factor = 15 if is_season_game else 7.5

    # This now gives us enough parts to calculate the ELO delta!
    return elo_difference_factor * progression_rate_factor * match_type_factor * game_win_factor
