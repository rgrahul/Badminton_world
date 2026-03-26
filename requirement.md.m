🆕 Feature Enhancement: Tournament Mode (League + Knockout Structure)

We want to enhance the Badminton Scoring Application to support a full Tournament Mode that includes:

League (Group Stage)

Knockout Stage (Bracket System)

Support for both Individual and Team Matches

Visual Tournament Tree (Bracket View)

🎯 Objective

Enable organizers to create structured tournaments with:

Configurable group-stage (league) matches

Qualification rules

Automatic advancement to knockout stage

Visual bracket tree from Round of 32 → Final Winner

1️⃣ Tournament Configuration

When creating a tournament, the organizer must configure:

Basic Settings:

Tournament Name

Match Type:

Individual

Team

Tournament Format:

League + Knockout

Direct Knockout Only

2️⃣ League (Group Stage) Configuration

If League stage is enabled:

Organizer must define:

Number of Groups

Number of teams/players per group (X)

Qualification count per group (Y)
(Top Y teams qualify to next round)

League Match Rules

Each team in a group plays against every other team (Round Robin).

Automatically generate fixtures within group.

Points table must include:

Matches Played

Wins

Losses

Points

Game Difference (optional enhancement)

Ranking

Qualification Rules

Top Y teams from each group qualify for Knockout stage.

Qualified teams must:

Be highlighted with Green background

Marked with “Q” badge in standings table

Example:

Rank	Team	Points	Status
1	Team A	8	Q
2	Team B	6	Q
3	Team C	2	-

Green background for qualified teams.

3️⃣ Knockout Stage Configuration

Tournament should support:

Automatic seeding from group qualifiers

OR manual seeding by organizer

Organizer must define:

Total number of qualified teams entering knockout
(8, 16, 32, etc.)

Knockout Structure

System must auto-generate bracket based on qualified count:

Round of 32

Round of 16

Quarter Final

Semi Final

Final

Winner

Matches must progress automatically:

Winner advances to next round

Loser eliminated

4️⃣ Bracket Tree Visualization

UI must display a proper tree structure:

Example:

Round of 16
   |--- Match 1 ---|
                    |--- Quarter Final ---|
   |--- Match 2 ---|                       |--- Semi Final ---|
                                                    |--- Final --- Winner


Requirements:

Visual horizontal bracket layout

Clickable matches

Show score summary

Highlight progressing team

Show champion badge for winner

5️⃣ Data Model Enhancements
Tournament Entity

id

name

type (Individual / Team)

format (League+Knockout / Knockout Only)

totalGroups

teamsPerGroup

qualifyCountPerGroup

Group Entity

id

tournamentId

groupName

teams[]

Standing Entity

groupId

teamId

matchesPlayed

wins

losses

points

rank

qualified (boolean)

KnockoutMatch Entity

roundName

matchNumber

teamA

teamB

winner

nextMatchId

6️⃣ Validation Rules

Before generating Knockout:

Ensure League stage completed.

Ensure required number of qualifiers selected.

Prevent duplicate advancement.

Handle tie-break logic (configurable in future).

7️⃣ UI/UX Expectations

Step-based tournament creation wizard:

Basic Info

League Setup

Qualification Rules

Knockout Structure

Live preview of:

Total matches in league

Total matches in knockout

Total tournament matches

Standings table:

Green background for qualified teams

“Q” badge indicator

Interactive bracket tree view

8️⃣ Extensibility Design

Support future formats:

Double Elimination

Swiss System

Hybrid Formats

Keep match generation logic modular.

Separate League engine and Knockout engine.

If required, generate:

Database schema migration

Bracket generation algorithm

Group seeding algorithm

Tie-break rule logic

React component structure for bracket UI

API contract definitions