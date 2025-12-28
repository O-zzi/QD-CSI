import { pool } from "../db";

const educationalContent = [
  {
    slug: 'padel-tennis',
    howToPlayContent: 'Padel is played in doubles on an enclosed court about 25% smaller than a tennis court. The ball can be played off the glass walls, similar to squash. Serve underhand diagonally, letting the ball bounce once before hitting. The ball must bounce once on your side before you can volley. Games are played to 6 with a 2-game advantage needed to win a set.',
    scoringRulesContent: 'Padel uses the same scoring system as tennis: 15, 30, 40, and game. At deuce (40-40), a team must win by 2 points. A golden point rule may apply at deuce where the receiving team chooses which side to receive. Sets are played to 6 games with a tiebreak at 6-6. Matches are typically best of 3 sets.',
    winningCriteriaContent: 'Win a match by being the first team to win 2 sets. Win a set by reaching 6 games with at least a 2-game lead, or by winning a tiebreak at 6-6. Win a game by scoring 4 points with a 2-point advantage. The ball is out if it hits the fence or goes over the glass without bouncing first.',
    pointsSystemContent: 'At The Quarterdeck, players earn ranking points based on match results. Wins earn 25 points, losses earn 5 participation points. Tournament victories earn bonus points. Seasonal rankings reset quarterly with top players recognized. Play regularly to climb the leaderboard and qualify for exclusive member tournaments.'
  },
  {
    slug: 'squash',
    howToPlayContent: 'Squash is played between two players in a four-walled court. Take turns hitting the ball against the front wall, above the tin (metal strip at the bottom). The ball can hit any wall before reaching the front wall. You can hit the ball on the volley or after one bounce. Alternate shots until someone fails to return the ball correctly.',
    scoringRulesContent: 'Modern squash uses point-a-rally scoring (PAR) to 11 points. Every rally results in a point, regardless of who served. You must win by 2 clear points if the score reaches 10-10. Matches are typically best of 5 games. The server continues serving until they lose a rally.',
    winningCriteriaContent: 'Win a game by being first to 11 points with at least a 2-point lead. Win the match by winning 3 games (best of 5). A let is called when play is interrupted fairly - the point is replayed. A stroke is awarded when your opponent prevents a fair shot, giving you the point.',
    pointsSystemContent: 'Earn ranking points through regular play and tournaments. Match wins earn 20 points, participation earns 5 points. Weekly ladder matches contribute to seasonal rankings. Top-ranked players qualify for The Quarterdeck Championship events. Maintain your ranking by playing at least 2 matches per month.'
  },
  {
    slug: 'air-rifle-range',
    howToPlayContent: 'Air rifle shooting requires focus, breath control, and steady positioning. Stand or kneel at the firing line, 10 meters from the target. Load a single pellet, take aim through the sights, control your breathing, and squeeze the trigger smoothly. Safety certification is mandatory before booking. Our range masters provide guidance for beginners.',
    scoringRulesContent: 'The 10-meter air rifle target has 10 scoring rings. The center (10 ring) scores 10 points, decreasing outward to 1 point. Competition shooting uses decimal scoring (10.9, 10.5, etc.) for precision. A standard match consists of 60 shots. Inner tens (X) are used as tiebreakers when scores are equal.',
    winningCriteriaContent: 'Competitions are decided by total points across all shots. A perfect score is 600 points (60 shots x 10 points). Tiebreakers use inner tens count, then a shoot-off if needed. Recreational sessions focus on personal improvement and consistency rather than competition.',
    pointsSystemContent: 'Track your progress with our digital scoring system. Personal bests are recorded for each session. Monthly challenges let you compete against other members. Earn achievement badges for milestones: First Bullseye, Perfect String (10 consecutive 10s), and more. Safety certification completion earns 50 bonus points.'
  },
  {
    slug: 'multipurpose-hall',
    howToPlayContent: 'Our Multipurpose Hall accommodates various activities including badminton, table tennis, yoga, dance classes, and private events. Book the full hall or sections based on your needs. Equipment is available for rent. The hall features climate control, professional lighting, and a premium sound system for events.',
    scoringRulesContent: 'Scoring varies by activity. Badminton uses rally scoring to 21 points (win by 2). Table tennis plays to 11 points (win by 2). For events and classes, no scoring applies. Our staff can provide rulebooks and guidance for any sport or activity you wish to enjoy.',
    winningCriteriaContent: 'For sports activities, standard international rules apply. Badminton matches are best of 3 games. Table tennis matches are typically best of 5 or 7 games. For recreational use, enjoy the space on your own terms. Event bookings include setup and cleanup time.',
    pointsSystemContent: 'Participate in scheduled classes and activities to earn engagement points. Regular attendance in fitness classes earns 10 points per session. Event hosting earns points toward membership perks. Join our community programs to connect with other members and earn bonus rewards.'
  }
];

export async function seedEducationalContent() {
  console.log('Seeding educational content for facilities...');
  
  for (const content of educationalContent) {
    try {
      await pool.query(`
        UPDATE facilities SET 
          how_to_play_content = $1,
          scoring_rules_content = $2,
          winning_criteria_content = $3,
          points_system_content = $4
        WHERE slug = $5
      `, [
        content.howToPlayContent,
        content.scoringRulesContent,
        content.winningCriteriaContent,
        content.pointsSystemContent,
        content.slug
      ]);
      console.log(`Updated educational content for: ${content.slug}`);
    } catch (error) {
      console.error(`Failed to update ${content.slug}:`, error);
    }
  }
  
  console.log('Educational content seeding complete!');
}

seedEducationalContent()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
