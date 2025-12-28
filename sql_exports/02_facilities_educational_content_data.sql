-- Facilities Educational Content Update
-- Generated: December 28, 2025
-- Description: Updates educational content fields for all facilities with bullet-pointed content

-- Padel Tennis
UPDATE facilities SET 
  how_to_play_content = '• Played in doubles on an enclosed court (25% smaller than tennis)
• Ball can be played off the glass walls, similar to squash
• Serve underhand diagonally, letting the ball bounce once before hitting
• Ball must bounce once on your side before you can volley
• Games are played to 6 with a 2-game advantage needed to win a set',
  scoring_rules_content = '• Same scoring as tennis: 15, 30, 40, and game
• At deuce (40-40), a team must win by 2 points
• Golden point rule may apply at deuce (receiving team chooses side)
• Sets are played to 6 games with a tiebreak at 6-6
• Matches are typically best of 3 sets',
  winning_criteria_content = '• Win a match by being first to win 2 sets
• Win a set by reaching 6 games with at least a 2-game lead
• Tiebreak played at 6-6
• Win a game by scoring 4 points with a 2-point advantage
• Ball is out if it hits the fence or goes over glass without bouncing first',
  points_system_content = '• Wins earn 25 ranking points
• Losses earn 5 participation points
• Tournament victories earn bonus points
• Seasonal rankings reset quarterly
• Top players qualify for exclusive member tournaments'
WHERE slug = 'padel-tennis';

-- Squash Courts
UPDATE facilities SET 
  how_to_play_content = '• Played between two players in a four-walled court
• Take turns hitting the ball against the front wall, above the tin
• Ball can hit any wall before reaching the front wall
• Hit the ball on the volley or after one bounce
• Alternate shots until someone fails to return correctly',
  scoring_rules_content = '• Point-a-rally scoring (PAR) to 11 points
• Every rally results in a point, regardless of who served
• Must win by 2 clear points if score reaches 10-10
• Matches are typically best of 5 games
• Server continues serving until they lose a rally',
  winning_criteria_content = '• Win a game by being first to 11 points (2-point lead required)
• Win the match by winning 3 games (best of 5)
• A "let" is called when play is interrupted fairly (point replayed)
• A "stroke" is awarded when opponent prevents a fair shot (you win point)',
  points_system_content = '• Match wins earn 20 ranking points
• Participation earns 5 points
• Weekly ladder matches contribute to seasonal rankings
• Top-ranked players qualify for Championship events
• Maintain ranking by playing at least 2 matches per month'
WHERE slug = 'squash';

-- Air Rifle Range
UPDATE facilities SET 
  how_to_play_content = '• Requires focus, breath control, and steady positioning
• Stand or kneel at the firing line, 10 meters from target
• Load a single pellet per shot
• Take aim through sights, control breathing, squeeze trigger smoothly
• Safety certification is mandatory before booking
• Range masters provide guidance for beginners',
  scoring_rules_content = '• Target has 10 scoring rings (center = 10 points, outer = 1 point)
• Competition uses decimal scoring (10.9, 10.5, etc.) for precision
• Standard match consists of 60 shots
• Inner tens (X) used as tiebreakers when scores are equal
• Maximum possible score: 600 points',
  winning_criteria_content = '• Competitions decided by total points across all shots
• Perfect score is 600 points (60 shots x 10 points)
• Tiebreakers use inner tens count, then shoot-off if needed
• Recreational sessions focus on personal improvement
• Consistency is key to success',
  points_system_content = '• Personal bests recorded for each session
• Monthly challenges to compete against other members
• Achievement badges for milestones:
  - First Bullseye
  - Perfect String (10 consecutive 10s)
  - Century Club (100+ total sessions)
• Safety certification earns 50 bonus points'
WHERE slug = 'air-rifle-range';

-- Multipurpose Hall
UPDATE facilities SET 
  how_to_play_content = '• Accommodates badminton, table tennis, yoga, dance classes
• Book the full hall or sections based on your needs
• Equipment available for rent
• Climate control and professional lighting
• Premium sound system for events
• Staff available for setup assistance',
  scoring_rules_content = '• Badminton: Rally scoring to 21 points (win by 2)
• Table Tennis: Plays to 11 points (win by 2)
• For events and classes, no scoring applies
• Staff can provide rulebooks for any sport
• International rules apply for all sports',
  winning_criteria_content = '• Badminton matches are best of 3 games
• Table tennis matches are best of 5 or 7 games
• For recreational use, enjoy the space on your terms
• Event bookings include setup and cleanup time
• Private events have flexible arrangements',
  points_system_content = '• Regular class attendance earns 10 points per session
• Event hosting earns points toward membership perks
• Community program participation earns bonus rewards
• Monthly fitness challenges available
• Group booking discounts for members'
WHERE slug = 'multipurpose-hall';

-- Bridge Room (Hidden Facility)
UPDATE facilities SET 
  how_to_play_content = '• Contract Bridge is a trick-taking card game for 4 players
• Players form 2 partnerships sitting across from each other
• Standard 52-card deck, cards ranked A-K-Q-J-10-9-8-7-6-5-4-3-2
• Game has two phases: bidding (auction) and play
• Bidding determines the contract (tricks to win and trump suit)
• Declarer plays both their hand and dummy''s exposed cards',
  scoring_rules_content = '• Points awarded for tricks won beyond the first 6 ("book")
• Minor suits (clubs, diamonds): 20 points per trick
• Major suits (hearts, spades): 30 points per trick
• No-trump: 40 for first trick, 30 for subsequent
• Game bonus awarded at 100+ trick points
• Slam bonuses for bidding and making 12 or 13 tricks',
  winning_criteria_content = '• Win a rubber by being first to win 2 games
• Game requires accumulating 100+ trick points
• Making your contract earns trick points plus bonuses
• Defeating opponents'' contracts earns penalty points
• Duplicate bridge scored on comparison with other tables',
  points_system_content = '• Regular play sessions earn 15 participation points
• Tournament wins earn ranking points
• Monthly duplicate events for competitive players
• Beginner lessons available weekly
• Partner matching service for solo players'
WHERE slug = 'bridge-room';
